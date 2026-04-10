/* ═══════════════════════════════════════════════════
   Models Comparison Tab – 5 building models with
   3D viewer, radar chart, simulation controls,
   seismograph, inter-story drift & real-time stress
   ═══════════════════════════════════════════════════ */
(function () {
    "use strict";

    const MODEL_DATA = [
        {
            name: "RC Frame", material: "Reinforced Concrete", co2: "420 kg", cost: "$1,250",
            maxStories: 25, use: "Mid-rise residential",
            stats: { strength: 72, eco: 40, quake: 60, cost: 75, dura: 70 },
            color: 0x64748b, wireColor: 0x94a3b8,
            desc: "Reinforced Concrete frame – strong and cost-effective, standard code design.",
            naturalFreq: 1.2, dampingBase: 0.05,
        },
        {
            name: "Steel Frame", material: "Structural Steel", co2: "510 kg", cost: "$1,800",
            maxStories: 50, use: "High-rise offices",
            stats: { strength: 90, eco: 35, quake: 80, cost: 50, dura: 85 },
            color: 0x3b82f6, wireColor: 0x60a5fa,
            desc: "Steel moment frame – high ductility and strength, ideal for tall buildings.",
            naturalFreq: 0.8, dampingBase: 0.02,
        },
        {
            name: "Timber Eco", material: "CLT / Glulam", co2: "120 kg", cost: "$1,100",
            maxStories: 10, use: "Low-rise sustainable",
            stats: { strength: 45, eco: 92, quake: 50, cost: 80, dura: 40 },
            color: 0x22c55e, wireColor: 0x4ade80,
            desc: "Cross-laminated timber – lowest carbon footprint, limited height.",
            naturalFreq: 2.0, dampingBase: 0.07,
        },
        {
            name: "Base Isolated", material: "RC + Isolation Bearings", co2: "480 kg", cost: "$2,200",
            maxStories: 20, use: "Critical facilities / hospitals",
            stats: { strength: 70, eco: 38, quake: 95, cost: 35, dura: 75 },
            color: 0xa855f7, wireColor: 0xc084fc,
            desc: "Base-isolated RC – rubber/lead bearings decouple from ground motion.",
            naturalFreq: 0.4, dampingBase: 0.15,
        },
        {
            name: "Hybrid Damper", material: "Steel + Viscous Dampers", co2: "460 kg", cost: "$2,000",
            maxStories: 35, use: "Performance-based towers",
            stats: { strength: 85, eco: 42, quake: 88, cost: 40, dura: 80 },
            color: 0x06b6d4, wireColor: 0x22d3ee,
            desc: "Steel frame with supplemental viscous dampers for energy dissipation.",
            naturalFreq: 0.9, dampingBase: 0.12,
        },
    ];

    /* ── state ── */
    let mScene, mCamera, mRenderer, mControls;
    let currentModelIdx = 0;
    let mBuilding = null;
    let storyMeshes = [];
    let simRunning = false;
    let simTime = 0;
    let simMagnitude = 5;
    let simPga = 0.25;
    let simSoil = 1.15;
    let simStories = 5;
    let simDuration = 15;
    let simDamping = 0.05;
    let simHistoryCount = 6;
    let inited = false;

    const TIMBER_PRESET = {
        magnitude: 10.0,
        pga: 1.5,
        soil: 2.0,
        stories: 5,
        duration: 15,
        damping: 0.01,
    };

    let seismoCanvas, seismoCtx;
    let seismoData = [];
    const SEISMO_MAX = 300;
    let driftCanvas, driftCtx;

    function el(id) { return document.getElementById(id); }

    /* ═══════════════════════════════════════════════════
       3D Scene
       ═══════════════════════════════════════════════════ */
    function initScene() {
        const canvas = el("models-3d-canvas");
        if (!canvas || !window.THREE) return;
        const container = el("models-3d-container");
        const w = container.clientWidth || 600;
        const h = container.clientHeight || 420;

        mScene = new THREE.Scene();
        mScene.background = new THREE.Color(0x05070f);

        mCamera = new THREE.PerspectiveCamera(45, w / h, 0.1, 500);
        mCamera.position.set(12, 10, 16);

        mRenderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        mRenderer.setPixelRatio(window.devicePixelRatio);
        mRenderer.setSize(w, h);
        mRenderer.shadowMap.enabled = true;

        mControls = new THREE.OrbitControls(mCamera, canvas);
        mControls.target.set(0, 4, 0);
        mControls.enableDamping = true;
        mControls.update();

        mScene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.7));
        const dir = new THREE.DirectionalLight(0xffffff, 0.9);
        dir.position.set(10, 20, 10);
        dir.castShadow = true;
        mScene.add(dir);

        const grid = new THREE.GridHelper(30, 15, 0x334155, 0x1f2937);
        mScene.add(grid);

        const gGeo = new THREE.PlaneGeometry(30, 30);
        const gMat = new THREE.MeshPhongMaterial({ color: 0x0f172a, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
        const ground = new THREE.Mesh(gGeo, gMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        mScene.add(ground);

        window.addEventListener("resize", function () {
            var ww = container.clientWidth || 600;
            var hh = container.clientHeight || 420;
            mCamera.aspect = ww / hh;
            mCamera.updateProjectionMatrix();
            mRenderer.setSize(ww, hh);
        });

        renderLoop();
    }

    function renderLoop() {
        if (!mRenderer) return;
        requestAnimationFrame(renderLoop);

        if (simRunning && mBuilding) {
            simTime += 0.016;
            var d = MODEL_DATA[currentModelIdx];
            var freq = d.naturalFreq + simMagnitude * 0.3;
            var effectiveDamping = d.dampingBase + simDamping;
            var decay = Math.exp(-effectiveDamping * simTime * 2);
            var envelope = Math.sin(Math.PI * Math.min(simTime / simDuration, 1));
            var amp = simMagnitude * simPga * simSoil * 0.004 * envelope * decay;

            storyMeshes.forEach(function (sm, idx) {
                var heightFactor = (idx + 1) / storyMeshes.length;
                var drift = Math.sin(simTime * freq * 6.28 + heightFactor * 0.5) * amp * heightFactor * 3;
                sm.position.x = drift;
                sm.rotation.z = drift * 0.008;
            });

            var groundAccel = Math.sin(simTime * freq * 6.28) * amp * 60;
            seismoData.push(groundAccel);
            if (seismoData.length > SEISMO_MAX) seismoData.shift();
            drawSeismograph();
            drawDriftDiagram();
            updateStressColors(amp);

            if (simTime >= simDuration) stopSim();
        }

        mControls && mControls.update();
        mRenderer.render(mScene, mCamera);
    }

    /* ═══════════════════════════════════════════════════
       Build procedural model with per-story groups
       ═══════════════════════════════════════════════════ */
    function buildModel(idx) {
        var d = MODEL_DATA[idx];
        if (mBuilding) { mScene.remove(mBuilding); mBuilding = null; }
        storyMeshes = [];

        var stories = simStories;
        var storyH = 3.2;
        var totalH = stories * storyH;
        var group = new THREE.Group();

        for (var s = 0; s < stories; s++) {
            var storyGroup = new THREE.Group();
            storyGroup.userData.storyIdx = s;
            var y0 = s * storyH;

            var colGeo = new THREE.CylinderGeometry(0.15, 0.18, storyH, 8);
            var colMat = new THREE.MeshPhongMaterial({ color: d.color });
            [[-2, -2], [2, -2], [-2, 2], [2, 2]].forEach(function (pos) {
                var col = new THREE.Mesh(colGeo, colMat.clone());
                col.position.set(pos[0], y0 + storyH / 2, pos[1]);
                col.userData.isColumn = true;
                col.castShadow = true;
                storyGroup.add(col);
            });

            var braceMat = new THREE.LineBasicMaterial({ color: d.wireColor, transparent: true, opacity: 0.5 });
            var bracePoints = [
                new THREE.Vector3(-2, y0, -2), new THREE.Vector3(2, y0 + storyH, -2),
                new THREE.Vector3(2, y0, -2), new THREE.Vector3(-2, y0 + storyH, -2),
            ];
            var braceGeo = new THREE.BufferGeometry().setFromPoints(bracePoints);
            storyGroup.add(new THREE.LineSegments(braceGeo, braceMat));

            var slabGeo = new THREE.BoxGeometry(5, 0.2, 5);
            var slabMat = new THREE.MeshPhongMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.85 });
            var slab = new THREE.Mesh(slabGeo, slabMat);
            slab.position.y = y0 + storyH;
            slab.receiveShadow = true;
            storyGroup.add(slab);

            group.add(storyGroup);
            storyMeshes.push(storyGroup);
        }

        var baseGeo = new THREE.BoxGeometry(6, 0.3, 6);
        var baseMat = new THREE.MeshPhongMaterial({ color: 0x475569 });
        var base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0;
        base.receiveShadow = true;
        group.add(base);

        mBuilding = group;
        mScene.add(mBuilding);

        mCamera.position.set(14, totalH * 0.6, 18);
        mControls.target.set(0, totalH / 2, 0);
        mControls.update();

        el("viewer-overlay").style.display = "none";
    }

    function updateStressColors(amp) {
        var stressNorm = Math.min(Math.abs(amp) * 80, 1);
        storyMeshes.forEach(function (sg, idx) {
            var heightFactor = (idx + 1) / storyMeshes.length;
            var stress = Math.min(stressNorm * heightFactor * 2, 1);
            sg.traverse(function (child) {
                if (child.isMesh && child.userData.isColumn) {
                    var baseColor = new THREE.Color(MODEL_DATA[currentModelIdx].color);
                    var red = new THREE.Color(0xff2222);
                    child.material.color.copy(baseColor).lerp(red, stress);
                    child.material.emissive = new THREE.Color(0xff0000).multiplyScalar(stress * 0.3);
                }
            });
        });
    }

    /* ═══════════════════════════════════════════════════
       Radar Chart (fixed sizing)
       ═══════════════════════════════════════════════════ */
    function drawRadar(stats) {
        var canvas = el("radar-chart");
        if (!canvas) return;

        var container = canvas.parentElement;
        var size = Math.min(container.clientWidth || 380, 380);
        if (size < 50) size = 380;

        /* HiDPI: scale canvas buffer for sharp rendering */
        var dpr = window.devicePixelRatio || 1;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        canvas.style.width = size + "px";
        canvas.style.height = size + "px";

        var ctx = canvas.getContext("2d");
        ctx.scale(dpr, dpr);

        /* All drawing now happens in CSS-pixel coordinates */
        var w = size, h = size;
        var cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.3;
        ctx.clearRect(0, 0, w, h);

        var keys = ["strength", "eco", "quake", "cost", "dura"];
        var labels = ["Strength", "Eco-Friendly", "Quake Res.", "Cost Eff.", "Durability"];
        var colors = ["#f97316", "#22c55e", "#ef4444", "#3b82f6", "#a855f7"];
        var n = keys.length;

        /* Grid rings */
        for (var ring = 1; ring <= 5; ring++) {
            ctx.beginPath();
            var rr = (ring / 5) * r;
            for (var i = 0; i <= n; i++) {
                var angle = (Math.PI * 2 * i) / n - Math.PI / 2;
                var x = cx + Math.cos(angle) * rr;
                var y = cy + Math.sin(angle) * rr;
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.strokeStyle = "rgba(148,163,184,0.12)";
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = "rgba(148,163,184,0.25)";
            ctx.font = "9px Inter, sans-serif";
            ctx.textAlign = "left";
            ctx.fillText((ring * 20) + "%", cx + 3, cy - rr + 3);
        }

        /* Axis lines + labels (label on first line, value below it) */
        for (var i = 0; i < n; i++) {
            var angle = (Math.PI * 2 * i) / n - Math.PI / 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
            ctx.strokeStyle = "rgba(148,163,184,0.15)";
            ctx.lineWidth = 1;
            ctx.stroke();

            /* Label — pushed further out from polygon edge */
            var labelDist = r + 30;
            var lx = cx + Math.cos(angle) * labelDist;
            var ly = cy + Math.sin(angle) * labelDist;
            ctx.fillStyle = colors[i];
            ctx.font = "600 11px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(labels[i], lx, ly);

            /* Value — on a separate line below the label */
            ctx.fillStyle = "#cbd5e1";
            ctx.font = "10px Inter, sans-serif";
            ctx.fillText(stats[keys[i]], lx, ly + 14);
        }

        /* Data polygon — flat fill, no gradient */
        ctx.beginPath();
        keys.forEach(function (k, i) {
            var angle = (Math.PI * 2 * i) / n - Math.PI / 2;
            var v = (stats[k] / 100) * r;
            var x = cx + Math.cos(angle) * v;
            var y = cy + Math.sin(angle) * v;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fillStyle = "rgba(56,189,248,0.12)";
        ctx.fill();
        ctx.strokeStyle = "rgba(56,189,248,0.7)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        /* Simple dots at data points — no glow */
        keys.forEach(function (k, i) {
            var angle = (Math.PI * 2 * i) / n - Math.PI / 2;
            var v = (stats[k] / 100) * r;
            var px = cx + Math.cos(angle) * v;
            var py = cy + Math.sin(angle) * v;
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fillStyle = colors[i];
            ctx.fill();
        });
    }

    /* ═══════════════════════════════════════════════════
       Seismograph (live waveform)
       ═══════════════════════════════════════════════════ */
    function initSeismograph() {
        seismoCanvas = el("seismo-canvas");
        if (!seismoCanvas) return;
        seismoCtx = seismoCanvas.getContext("2d");
        seismoData = [];
        drawSeismograph();
    }

    function drawSeismograph() {
        if (!seismoCtx || !seismoCanvas) return;
        var w = seismoCanvas.width, h = seismoCanvas.height;
        var ctx = seismoCtx;
        ctx.clearRect(0, 0, w, h);

        ctx.fillStyle = "#0a0e1a";
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = "rgba(148,163,184,0.08)";
        ctx.lineWidth = 1;
        for (var y = 0; y < h; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
        for (var x = 0; x < w; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }

        ctx.strokeStyle = "rgba(239,68,68,0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();

        if (seismoData.length < 2) {
            ctx.fillStyle = "#64748b";
            ctx.font = "11px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("Run simulation to see seismograph", w / 2, h / 2 - 8);
            return;
        }

        ctx.beginPath();
        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 1.5;
        var step = w / SEISMO_MAX;
        seismoData.forEach(function (v, i) {
            var xx = i * step;
            var yy = h / 2 - v * (h * 0.4);
            i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy);
        });
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = "rgba(34,197,94,0.3)";
        ctx.lineWidth = 4;
        seismoData.forEach(function (v, i) {
            var xx = i * step;
            var yy = h / 2 - v * (h * 0.4);
            i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy);
        });
        ctx.stroke();

        var last = seismoData[seismoData.length - 1];
        ctx.fillStyle = "#22c55e";
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "right";
        ctx.fillText((last * 10).toFixed(2) + " g", w - 6, 14);

        ctx.fillStyle = "#64748b";
        ctx.font = "10px Inter, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("Ground Accel.", 6, 14);
    }

    /* ═══════════════════════════════════════════════════
       Inter-Story Drift Diagram
       ═══════════════════════════════════════════════════ */
    function initDriftCanvas() {
        driftCanvas = el("drift-canvas");
        if (driftCanvas) driftCtx = driftCanvas.getContext("2d");
    }

    function drawDriftDiagram() {
        if (!driftCtx || !driftCanvas) return;
        var w = driftCanvas.width, h = driftCanvas.height;
        var ctx = driftCtx;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "#0a0e1a";
        ctx.fillRect(0, 0, w, h);

        var n = storyMeshes.length;
        if (n === 0) return;
        var barH = Math.min(22, (h - 30) / n);
        var maxDrift = 0.04;

        for (var i = 0; i < n; i++) {
            var sm = storyMeshes[i];
            var drift = Math.abs(sm.position.x) / 3.2;
            var norm = Math.min(drift / maxDrift, 1);
            var y = h - 20 - (i + 1) * barH;

            ctx.fillStyle = "rgba(30,41,59,0.6)";
            ctx.fillRect(40, y, w - 50, barH - 3);

            var r = Math.round(255 * Math.min(norm * 2, 1));
            var g = Math.round(255 * Math.max(1 - norm * 1.5, 0));
            ctx.fillStyle = "rgb(" + r + "," + g + ",60)";
            ctx.fillRect(40, y, (w - 50) * norm, barH - 3);

            ctx.fillStyle = "#94a3b8";
            ctx.font = "9px Inter, sans-serif";
            ctx.textAlign = "right";
            ctx.textBaseline = "middle";
            ctx.fillText("F" + (i + 1), 35, y + barH / 2);

            ctx.fillStyle = "#e2e8f0";
            ctx.font = "bold 9px monospace";
            ctx.textAlign = "left";
            ctx.fillText((drift * 100).toFixed(2) + "%", 42 + (w - 50) * norm + 4, y + barH / 2);
        }

        ctx.fillStyle = "#64748b";
        ctx.font = "10px Inter, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("Inter-Story Drift", 6, 12);

        var threshX = 40 + (w - 50) * (0.02 / maxDrift);
        ctx.strokeStyle = "rgba(239,68,68,0.5)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.moveTo(threshX, 18); ctx.lineTo(threshX, h - 5); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(239,68,68,0.7)";
        ctx.font = "8px Inter, sans-serif";
        ctx.fillText("2% limit", threshX + 2, h - 6);
    }

    /* ═══════════════════════════════════════════════════
       Info strip + stat bars
       ═══════════════════════════════════════════════════ */
    function updateInfo(idx) {
        var d = MODEL_DATA[idx];
        el("info-material").textContent = d.material;
        el("info-co2").textContent = d.co2;
        el("info-cost").textContent = d.cost;
        el("info-maxstories").textContent = d.maxStories;
        el("info-use").textContent = d.use;
        el("model-desc-text").textContent = d.desc;
        el("model-viewer-label").textContent = d.name;
        el("model-type-badge").textContent = d.name.split(" ")[0];

        var map = { strength: "stat-strength", eco: "stat-eco", quake: "stat-quake", cost: "stat-cost", dura: "stat-dura" };
        Object.entries(map).forEach(function (entry) {
            var k = entry[0], id = entry[1];
            var span = el(id);
            if (!span) return;
            span.textContent = d.stats[k];
            var fill = span.closest(".stat-row");
            fill = fill && fill.querySelector(".stat-bar-fill");
            if (fill) {
                fill.style.transition = "width 0.6s cubic-bezier(.4,0,.2,1)";
                fill.style.width = d.stats[k] + "%";
            }
        });

        drawRadar(d.stats);
    }

    function buildComparison() {
        var grid = el("comparison-grid");
        if (!grid) return;
        grid.innerHTML = MODEL_DATA.map(function (d, i) {
            return '<div class="comparison-item' + (i === currentModelIdx ? " active" : "") + '">' +
                '<strong>' + d.name + '</strong>' +
                '<span class="comparison-metric">Quake Res.&ensp;<b>' + d.stats.quake + '%</b></span>' +
                '<span class="comparison-metric">Cost Eff.&ensp;<b>' + d.stats.cost + '%</b></span>' +
                '<span class="comparison-metric">Strength&ensp;<b>' + d.stats.strength + '%</b></span>' +
                '</div>';
        }).join("");
    }

    /* ═══════════════════════════════════════════════════
       Simulation
       ═══════════════════════════════════════════════════ */
    function runSim() {
        if (!mBuilding) return;
        simTime = 0;
        simRunning = true;
        seismoData = [];
        storyMeshes.forEach(function (sm) { sm.position.x = 0; sm.rotation.z = 0; });
        storyMeshes.forEach(function (sg) {
            sg.traverse(function (ch) {
                if (ch.isMesh && ch.userData.isColumn) {
                    ch.material.color.set(MODEL_DATA[currentModelIdx].color);
                    ch.material.emissive.set(0x000000);
                }
            });
        });
        el("sim-result-bar").style.display = "flex";
        el("sim-damage-value").textContent = "Simulating...";
        el("sim-damage-rating").textContent = "";
        el("models-sim-status").textContent = "Simulation in progress...";
    }

    function stopSim() {
        simRunning = false;
        storyMeshes.forEach(function (sm) { sm.position.x = 0; sm.rotation.z = 0; });
        storyMeshes.forEach(function (sg) {
            sg.traverse(function (ch) {
                if (ch.isMesh && ch.userData.isColumn) {
                    ch.material.color.set(MODEL_DATA[currentModelIdx].color);
                    ch.material.emissive.set(0x000000);
                }
            });
        });

        var d = MODEL_DATA[currentModelIdx];
        var durationFactor = Math.min(simDuration / 15, 2.0);
        var dampingFactor = Math.max(0.2, 1 - simDamping * 5);
        var baseDmg = (simMagnitude / 10) * (simPga / 1.5) * simSoil * (simStories / 30) * (1 - d.dampingBase) * durationFactor * dampingFactor * 100;
        var quakeFactor = 1 - d.stats.quake / 120;
        var dmg = Math.min(Math.max(baseDmg * quakeFactor, 0), 100).toFixed(1);

        var rating, cls;
        if (dmg < 25) { rating = "Low"; cls = "low"; }
        else if (dmg < 55) { rating = "Moderate"; cls = "moderate"; }
        else { rating = "High"; cls = "high"; }

        el("sim-damage-value").textContent = dmg + "%";
        el("sim-damage-rating").innerHTML = '<span class="rating-badge ' + cls + '">' + rating + '</span>';
        el("models-sim-status").textContent = "Simulation complete";

        /* Expose state for Report tab */
        window._modelsState = {
            magnitude: simMagnitude,
            pga: simPga,
            damageIndex: parseFloat(dmg),
            maxDrift: parseFloat(dmg) > 55 ? 3.5 : parseFloat(dmg) > 25 ? 1.8 : 0.6,
            maxAccel: simPga * (1 + simSoil * 0.5),
            stories: simStories,
            material: d.name,
            soilAmp: simSoil,
            duration: simDuration,
            damping: simDamping
        };

        simHistoryCount++;
        var tbody = el("sim-history-body");
        if (tbody) {
            var tr = document.createElement("tr");
            tr.innerHTML = '<td>' + simHistoryCount + '</td><td>' + d.name + '</td><td>' + simMagnitude + '</td><td>' + simPga + '</td><td>' + simStories + '</td><td>' + dmg + '%</td><td><span class="rating-badge ' + cls + '">' + rating + '</span></td>';
            tbody.prepend(tr);
        }
    }

    function resetSim() {
        simRunning = false;
        simTime = 0;
        seismoData = [];
        storyMeshes.forEach(function (sm) { sm.position.x = 0; sm.rotation.z = 0; });
        storyMeshes.forEach(function (sg) {
            sg.traverse(function (ch) {
                if (ch.isMesh && ch.userData.isColumn) {
                    ch.material.color.set(MODEL_DATA[currentModelIdx].color);
                    ch.material.emissive.set(0x000000);
                }
            });
        });
        el("sim-result-bar").style.display = "none";
        el("models-sim-status").textContent = "Ready — adjust sliders to simulate";
        drawSeismograph();
        drawDriftDiagram();
    }

    function setSimControl(id, value, decimals) {
        var input = el(id);
        if (!input) return;
        input.value = String(value);
        var readout = el(id + "-val");
        if (readout) {
            readout.textContent = (typeof decimals === "number") ? Number(value).toFixed(decimals) : String(value);
        }
    }

    function applyTimberPreset() {
        simMagnitude = TIMBER_PRESET.magnitude;
        simPga = TIMBER_PRESET.pga;
        simSoil = TIMBER_PRESET.soil;
        simStories = TIMBER_PRESET.stories;
        simDuration = TIMBER_PRESET.duration;
        simDamping = TIMBER_PRESET.damping;

        setSimControl("sim-magnitude", simMagnitude, 2);
        setSimControl("sim-pga", simPga, 2);
        setSimControl("sim-soil", simSoil, 2);
        setSimControl("sim-stories", simStories);
        setSimControl("sim-duration", simDuration);
        setSimControl("sim-damping", simDamping, 2);
    }

    /* ═══════════════════════════════════════════════════
       Wire controls
       ═══════════════════════════════════════════════════ */
    function wireControls() {
        document.querySelectorAll(".model-tab").forEach(function (btn) {
            btn.addEventListener("click", function () {
                document.querySelectorAll(".model-tab").forEach(function (b) { b.classList.remove("active"); });
                btn.classList.add("active");
                currentModelIdx = parseInt(btn.dataset.model, 10);
                if (currentModelIdx === 2) {
                    applyTimberPreset();
                }
                updateInfo(currentModelIdx);
                buildModel(currentModelIdx);
                buildComparison();
            });
        });

        var sliders = [
            ["sim-magnitude", "sim-magnitude-val", function (v) { simMagnitude = v; }],
            ["sim-pga", "sim-pga-val", function (v) { simPga = v; }],
            ["sim-soil", "sim-soil-val", function (v) { simSoil = v; }],
            ["sim-stories", "sim-stories-val", function (v) { simStories = v; buildModel(currentModelIdx); }],
            ["sim-duration", "sim-duration-val", function (v) { simDuration = v; }],
            ["sim-damping", "sim-damping-val", function (v) { simDamping = v; }],
        ];
        sliders.forEach(function (arr) {
            var s = el(arr[0]);
            if (!s) return;
            s.addEventListener("input", function () {
                var v = parseFloat(s.value);
                el(arr[1]).textContent = s.step.includes(".") ? v.toFixed(2) : v;
                arr[2](v);
            });
        });

        el("sim-run-btn") && el("sim-run-btn").addEventListener("click", runSim);
        el("sim-reset-btn") && el("sim-reset-btn").addEventListener("click", resetSim);
    }

    /* ═══════════════════════════════════════════════════
       Public init
       ═══════════════════════════════════════════════════ */
    window.initModelsTab = function () {
        if (inited) return;
        inited = true;
        initScene();
        initSeismograph();
        initDriftCanvas();
        wireControls();
        updateInfo(0);
        buildModel(0);
        buildComparison();
    };
})();