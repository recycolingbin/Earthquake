/* ═══════════════════════════════════════════
   MODELS COMPARISON TAB – JS
   ═══════════════════════════════════════════ */

(function () {
    "use strict";

    // ── 5 building models with baseline metrics (0-100) + mock specs ──
    const MODELS = [
        {
            name: "RC Frame",
            icon: "🏢",
            color: "#f97316",
            strength: 72, eco: 35, quake: 60, cost: 75, durability: 78,
            damping: 0.05,
            desc: "Reinforced Concrete frame – the workhorse of mid-rise construction. Excellent cost-to-strength ratio with proven seismic code compliance. Widely used in residential and commercial buildings up to 25 stories.",
            buildingColor: 0xf97316,
            stories: 5, bayW: 6, bayD: 6, storyH: 3.2,
            // Mock spec data
            material: "Reinforced Concrete",
            co2: "420 kg",
            costPerM2: "$1,250",
            maxStories: "25",
            typicalUse: "Mid-rise residential",
            badge: "RC",
        },
        {
            name: "Steel Frame",
            icon: "🏗️",
            color: "#3b82f6",
            strength: 85, eco: 42, quake: 75, cost: 55, durability: 82,
            damping: 0.04,
            desc: "Steel moment-resisting frame with high ductility and superior seismic energy absorption. Preferred for tall structures where lightweight framing and rapid construction are critical advantages.",
            buildingColor: 0x3b82f6,
            stories: 8, bayW: 8, bayD: 8, storyH: 3.5,
            material: "Structural Steel (A992)",
            co2: "580 kg",
            costPerM2: "$1,850",
            maxStories: "60+",
            typicalUse: "High-rise commercial",
            badge: "STEEL",
        },
        {
            name: "Timber Eco",
            icon: "🌿",
            color: "#22c55e",
            strength: 48, eco: 92, quake: 50, cost: 68, durability: 45,
            damping: 0.06,
            desc: "Cross-laminated timber (CLT) system — the greenest option with the lowest carbon footprint. Lightweight and renewable, ideal for low-to-mid-rise projects targeting LEED Platinum or net-zero carbon.",
            buildingColor: 0x22c55e,
            stories: 4, bayW: 5, bayD: 5, storyH: 3.0,
            material: "Cross-Laminated Timber",
            co2: "85 kg",
            costPerM2: "$1,400",
            maxStories: "12",
            typicalUse: "Eco housing & schools",
            badge: "CLT",
        },
        {
            name: "Base Isolated",
            icon: "🛡️",
            color: "#8b5cf6",
            strength: 78, eco: 40, quake: 95, cost: 38, durability: 88,
            damping: 0.12,
            desc: "RC frame mounted on lead-rubber bearing isolators that decouple the structure from ground motion. Gold standard for earthquake resistance — used in hospitals, data centers, and critical infrastructure.",
            buildingColor: 0x8b5cf6,
            stories: 6, bayW: 7, bayD: 7, storyH: 3.2,
            material: "RC + Lead-Rubber Bearings",
            co2: "490 kg",
            costPerM2: "$2,400",
            maxStories: "20",
            typicalUse: "Hospitals & critical infra",
            badge: "ISO",
        },
        {
            name: "Hybrid Damper",
            icon: "🔬",
            color: "#06b6d4",
            strength: 80, eco: 55, quake: 88, cost: 45, durability: 85,
            damping: 0.10,
            desc: "Steel frame enhanced with fluid viscous dampers at strategic brace points. Delivers balanced performance across all metrics — strong, durable, and earthquake-resilient without extreme cost premium.",
            buildingColor: 0x06b6d4,
            stories: 10, bayW: 7, bayD: 7, storyH: 3.4,
            material: "Steel + Viscous Dampers",
            co2: "520 kg",
            costPerM2: "$2,100",
            maxStories: "45",
            typicalUse: "Mixed-use towers",
            badge: "HYB",
        },
    ];

    const LABELS = ["Strength", "Eco-Friendly", "Earthquake Res.", "Cost Efficiency", "Durability"];

    let selectedModel = 0;
    let simHistoryCounter = 6; // start after mock rows

    // ── DOM refs ──
    const modelTabs = document.querySelectorAll(".model-tab");
    const viewerLabel = document.getElementById("model-viewer-label");
    const simStatus = document.getElementById("models-sim-status");
    const modelDescText = document.getElementById("model-desc-text");
    const modelTypeBadge = document.getElementById("model-type-badge");

    // Info strip refs
    const infoMaterial = document.getElementById("info-material");
    const infoCo2 = document.getElementById("info-co2");
    const infoCost = document.getElementById("info-cost");
    const infoMaxStories = document.getElementById("info-maxstories");
    const infoUse = document.getElementById("info-use");

    // Slider refs
    const sliders = {
        magnitude: document.getElementById("sim-magnitude"),
        pga: document.getElementById("sim-pga"),
        soil: document.getElementById("sim-soil"),
        stories: document.getElementById("sim-stories"),
        duration: document.getElementById("sim-duration"),
        damping: document.getElementById("sim-damping"),
    };
    const readouts = {
        magnitude: document.getElementById("sim-magnitude-val"),
        pga: document.getElementById("sim-pga-val"),
        soil: document.getElementById("sim-soil-val"),
        stories: document.getElementById("sim-stories-val"),
        duration: document.getElementById("sim-duration-val"),
        damping: document.getElementById("sim-damping-val"),
    };

    const runBtn = document.getElementById("sim-run-btn");
    const resetBtn = document.getElementById("sim-reset-btn");
    const resultBar = document.getElementById("sim-result-bar");
    const damageValue = document.getElementById("sim-damage-value");
    const damageRating = document.getElementById("sim-damage-rating");

    // ── Three.js state ──
    let mScene, mCamera, mRenderer, mControls, mAnimId;
    let buildingGroup = null;
    let groundPlane = null;
    let simRunning = false;
    let simTime = 0;
    let simIntensity = 0;

    // ═══════════════════════════
    //  3D VIEWER
    // ═══════════════════════════
    function initModelsViewer() {
        const canvas = document.getElementById("models-3d-canvas");
        if (!canvas || !window.THREE) return;

        const rect = canvas.parentElement.getBoundingClientRect();
        const w = Math.max(rect.width, 300);
        const h = 420;

        mScene = new THREE.Scene();
        mScene.background = new THREE.Color(0x080c18);
        mScene.fog = new THREE.FogExp2(0x080c18, 0.012);

        mCamera = new THREE.PerspectiveCamera(45, w / h, 0.1, 500);
        mCamera.position.set(18, 14, 22);

        mRenderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        mRenderer.setPixelRatio(window.devicePixelRatio);
        mRenderer.setSize(w, h);
        mRenderer.shadowMap.enabled = true;
        mRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

        mControls = new THREE.OrbitControls(mCamera, mRenderer.domElement);
        mControls.target.set(0, 5, 0);
        mControls.enableDamping = true;
        mControls.dampingFactor = 0.08;
        mControls.update();

        // Lights — richer setup
        const hemi = new THREE.HemisphereLight(0xc9d6ff, 0x1a1a2e, 0.5);
        hemi.position.set(0, 30, 0);
        mScene.add(hemi);

        const dir = new THREE.DirectionalLight(0xffffff, 0.8);
        dir.position.set(15, 28, 18);
        dir.castShadow = true;
        dir.shadow.mapSize.width = 1024;
        dir.shadow.mapSize.height = 1024;
        mScene.add(dir);

        const accent = new THREE.PointLight(0x6366f1, 0.4, 60);
        accent.position.set(-10, 15, -10);
        mScene.add(accent);

        // Grid
        const grid = new THREE.GridHelper(40, 20, 0x2a2f4a, 0x161a2e);
        mScene.add(grid);

        // Ground with subtle gradient
        const gGeo = new THREE.PlaneGeometry(40, 40);
        const gMat = new THREE.MeshPhongMaterial({
            color: 0x0ea5e9, side: THREE.DoubleSide,
            transparent: true, opacity: 0.18,
        });
        groundPlane = new THREE.Mesh(gGeo, gMat);
        groundPlane.rotation.x = -Math.PI / 2;
        groundPlane.position.y = -0.01;
        groundPlane.receiveShadow = true;
        mScene.add(groundPlane);

        // Start render loop
        function renderLoop() {
            if (simRunning) {
                animateSimulation();
            }
            // Gentle idle rotation when not simulating
            if (!simRunning && buildingGroup) {
                buildingGroup.rotation.y += 0.001;
            }
            mControls.update();
            mRenderer.render(mScene, mCamera);
            mAnimId = requestAnimationFrame(renderLoop);
        }
        renderLoop();

        // Resize
        window.addEventListener("resize", () => {
            const r = canvas.parentElement.getBoundingClientRect();
            const rw = Math.max(r.width, 300);
            mCamera.aspect = rw / h;
            mCamera.updateProjectionMatrix();
            mRenderer.setSize(rw, h);
        });

        buildModel(MODELS[selectedModel]);
    }

    function buildModel(m) {
        if (!mScene) return;

        // Remove old building
        if (buildingGroup) {
            mScene.remove(buildingGroup);
            buildingGroup = null;
        }

        buildingGroup = new THREE.Group();

        const stories = parseInt(sliders.stories?.value) || m.stories;
        const storyH = m.storyH;
        const bayW = m.bayW;
        const bayD = m.bayD;
        const totalH = stories * storyH;

        // Floor slabs
        for (let i = 0; i <= stories; i++) {
            const slabGeo = new THREE.BoxGeometry(bayW + 0.4, 0.25, bayD + 0.4);
            const slabMat = new THREE.MeshPhongMaterial({ color: m.buildingColor, opacity: 0.85, transparent: true });
            const slab = new THREE.Mesh(slabGeo, slabMat);
            slab.position.y = i * storyH;
            buildingGroup.add(slab);
        }

        // Columns at corners
        const colGeo = new THREE.BoxGeometry(0.35, storyH, 0.35);
        const colMat = new THREE.MeshPhongMaterial({ color: 0xd4d4d8, opacity: 0.9, transparent: true });
        const offsets = [
            [-bayW / 2, bayD / 2],
            [bayW / 2, bayD / 2],
            [-bayW / 2, -bayD / 2],
            [bayW / 2, -bayD / 2],
        ];
        for (let i = 0; i < stories; i++) {
            for (const [ox, oz] of offsets) {
                const col = new THREE.Mesh(colGeo, colMat);
                col.position.set(ox, i * storyH + storyH / 2, oz);
                buildingGroup.add(col);
            }
        }

        // Base isolation pads (for base-isolated model)
        if (m.name === "Base Isolated") {
            for (const [ox, oz] of offsets) {
                const padGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16);
                const padMat = new THREE.MeshPhongMaterial({ color: 0xfbbf24 });
                const pad = new THREE.Mesh(padGeo, padMat);
                pad.position.set(ox, -0.2, oz);
                buildingGroup.add(pad);
            }
        }

        // Dampers (for hybrid damper model) – diagonal braces
        if (m.name === "Hybrid Damper") {
            const braceMat = new THREE.MeshPhongMaterial({ color: 0x06b6d4, opacity: 0.7, transparent: true });
            for (let i = 0; i < Math.min(stories, 3); i++) {
                const braceGeo = new THREE.CylinderGeometry(0.08, 0.08, Math.sqrt(storyH * storyH + bayW * bayW) * 0.9, 6);
                const brace = new THREE.Mesh(braceGeo, braceMat);
                brace.position.set(0, i * storyH + storyH / 2, bayD / 2 + 0.15);
                brace.rotation.z = Math.atan2(storyH, bayW);
                buildingGroup.add(brace);
            }
        }

        buildingGroup.position.y = 0.13;
        mScene.add(buildingGroup);

        // Fit camera
        const center = new THREE.Vector3(0, totalH / 2, 0);
        const dist = Math.max(totalH, bayW, bayD) * 2.2;
        mCamera.position.set(dist * 0.6, totalH * 0.8, dist * 0.6);
        mControls.target.copy(center);
        mControls.update();
    }

    // ── Simulation animation ──
    function animateSimulation() {
        if (!buildingGroup) return;
        simTime += 0.016; // ~60fps
        const mag = parseFloat(sliders.magnitude?.value) || 5;
        const pga = parseFloat(sliders.pga?.value) || 0.25;
        const soil = parseFloat(sliders.soil?.value) || 1.15;
        const damping = parseFloat(sliders.damping?.value) || 0.05;
        const duration = parseFloat(sliders.duration?.value) || 15;

        if (simTime > duration) {
            stopSimulation();
            return;
        }

        // Shake intensity ramps up then decays
        const t = simTime / duration;
        const envelope = Math.sin(Math.PI * t) * (1 - 0.3 * t);
        simIntensity = mag * pga * soil * (1 - damping * 3) * envelope * 0.04;

        // Apply displacement to each floor
        buildingGroup.children.forEach((child, idx) => {
            const floorLevel = child.position.y;
            const heightFactor = floorLevel / ((parseInt(sliders.stories?.value) || 5) * 3.2);
            const displacement = simIntensity * heightFactor * Math.sin(simTime * 8 + idx * 0.3);
            child.position.x = child.userData.origX != null ? child.userData.origX + displacement : displacement;
        });
    }

    function startSimulation() {
        if (!buildingGroup) return;

        // Store original positions
        buildingGroup.children.forEach((child) => {
            child.userData.origX = child.position.x;
        });

        simTime = 0;
        simRunning = true;

        const container = document.getElementById("models-3d-container");
        container?.classList.add("shaking");

        if (simStatus) simStatus.textContent = "⚡ Simulating earthquake…";
        if (runBtn) { runBtn.textContent = "⏸ Pause"; runBtn.style.background = "linear-gradient(135deg, #ef4444, #dc2626)"; runBtn.style.color = "#fff"; }
    }

    function stopSimulation() {
        simRunning = false;

        // Reset positions
        if (buildingGroup) {
            buildingGroup.children.forEach((child) => {
                if (child.userData.origX != null) {
                    child.position.x = child.userData.origX;
                    delete child.userData.origX;
                }
            });
        }

        const container = document.getElementById("models-3d-container");
        container?.classList.remove("shaking");

        if (simStatus) simStatus.textContent = "✓ Simulation complete";
        if (runBtn) { runBtn.textContent = "▶ Run Simulation"; runBtn.style.background = ""; runBtn.style.color = ""; }

        computeDamage();
    }

    function computeDamage() {
        const m = MODELS[selectedModel];
        const mag = parseFloat(sliders.magnitude?.value) || 5;
        const pga = parseFloat(sliders.pga?.value) || 0.25;
        const soil = parseFloat(sliders.soil?.value) || 1.15;
        const stories = parseInt(sliders.stories?.value) || 5;
        const damping = parseFloat(sliders.damping?.value) || 0.05;

        // Damage formula: higher magnitude/pga/soil/stories => more damage; higher quake-resistance/damping => less
        const quakeResistFactor = m.quake / 100;
        const raw = (mag * 0.3 + pga * 2.0 + soil * 0.8 + stories * 0.05) * (1 - damping * 4) * (1 - quakeResistFactor * 0.5);
        const damage = Math.max(0, Math.min(raw * 20, 100)).toFixed(1);

        let rating, ratingClass;
        if (damage < 30) { rating = "Low"; ratingClass = "low"; }
        else if (damage < 65) { rating = "Moderate"; ratingClass = "moderate"; }
        else { rating = "High"; ratingClass = "high"; }

        if (damageValue) damageValue.textContent = damage + "%";
        if (damageRating) {
            damageRating.textContent = rating;
            damageRating.className = "sim-result-rating " + ratingClass;
        }
        if (resultBar) resultBar.style.display = "flex";
    }

    // ═══════════════════════════
    //  RADAR CHART (pure Canvas)
    // ═══════════════════════════
    function drawRadar(model) {
        const canvas = document.getElementById("radar-chart");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const W = canvas.width;
        const H = canvas.height;
        const cx = W / 2;
        const cy = H / 2;
        const R = Math.min(cx, cy) - 50;
        const values = [model.strength, model.eco, model.quake, model.cost, model.durability];
        const n = values.length;
        const angleStep = (2 * Math.PI) / n;
        const startAngle = -Math.PI / 2;

        ctx.clearRect(0, 0, W, H);

        // Draw concentric rings
        for (let ring = 1; ring <= 5; ring++) {
            const r = (R / 5) * ring;
            ctx.beginPath();
            for (let i = 0; i <= n; i++) {
                const angle = startAngle + i * angleStep;
                const x = cx + r * Math.cos(angle);
                const y = cy + r * Math.sin(angle);
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.strokeStyle = "rgba(255,255,255,0.08)";
            ctx.lineWidth = 1;
            ctx.stroke();

            // Ring label
            ctx.fillStyle = "rgba(255,255,255,0.2)";
            ctx.font = "10px Inter, sans-serif";
            ctx.fillText(ring * 20, cx + 4, cy - r + 12);
        }

        // Draw axes
        for (let i = 0; i < n; i++) {
            const angle = startAngle + i * angleStep;
            const x = cx + R * Math.cos(angle);
            const y = cy + R * Math.sin(angle);
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(x, y);
            ctx.strokeStyle = "rgba(255,255,255,0.1)";
            ctx.lineWidth = 1;
            ctx.stroke();

            // Labels
            const labelR = R + 28;
            const lx = cx + labelR * Math.cos(angle);
            const ly = cy + labelR * Math.sin(angle);
            ctx.fillStyle = "#cbd5e1";
            ctx.font = "12px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(LABELS[i], lx, ly);
        }

        // Data polygon
        ctx.beginPath();
        for (let i = 0; i <= n; i++) {
            const idx = i % n;
            const angle = startAngle + idx * angleStep;
            const r = (values[idx] / 100) * R;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = hexToRGBA(model.color, 0.25);
        ctx.fill();
        ctx.strokeStyle = model.color;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Data points
        for (let i = 0; i < n; i++) {
            const angle = startAngle + i * angleStep;
            const r = (values[i] / 100) * R;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fillStyle = model.color;
            ctx.fill();
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        // Title in center
        ctx.fillStyle = "#f1f5f9";
        ctx.font = "bold 14px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(model.name, cx, cy - 6);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "11px Inter, sans-serif";
        ctx.fillText(model.desc.slice(0, 50) + (model.desc.length > 50 ? "…" : ""), cx, cy + 10);
    }

    function hexToRGBA(hex, alpha) {
        // Parse CSS hex or named color to rgba
        const tmp = document.createElement("canvas");
        tmp.width = tmp.height = 1;
        const c = tmp.getContext("2d");
        c.fillStyle = hex;
        c.fillRect(0, 0, 1, 1);
        const [r, g, b] = c.getImageData(0, 0, 1, 1).data;
        return `rgba(${r},${g},${b},${alpha})`;
    }

    // ═══════════════════════════
    //  STAT BARS UPDATE
    // ═══════════════════════════
    function updateStats(m) {
        const ids = [
            { key: "strength", fill: ".strength-fill", val: "#stat-strength" },
            { key: "eco", fill: ".eco-fill", val: "#stat-eco" },
            { key: "quake", fill: ".quake-fill", val: "#stat-quake" },
            { key: "cost", fill: ".cost-fill", val: "#stat-cost" },
            { key: "durability", fill: ".dura-fill", val: "#stat-dura" },
        ];
        ids.forEach(({ key, fill, val }) => {
            const bar = document.querySelector(fill);
            const span = document.querySelector(val);
            if (bar) bar.style.width = m[key] + "%";
            if (span) span.textContent = m[key];
        });
    }

    // ═══════════════════════════
    //  SELECT MODEL
    // ═══════════════════════════
    function selectModel(idx) {
        selectedModel = idx;
        const m = MODELS[idx];

        // Update tabs
        modelTabs.forEach((tab, i) => tab.classList.toggle("active", i === idx));

        // Update viewer label
        if (viewerLabel) viewerLabel.textContent = m.name;

        // Update slider defaults
        if (sliders.stories) sliders.stories.value = m.stories;
        if (readouts.stories) readouts.stories.textContent = m.stories;
        if (sliders.damping) sliders.damping.value = m.damping;
        if (readouts.damping) readouts.damping.textContent = m.damping;

        // Rebuild 3D model
        buildModel(m);

        // Redraw radar
        drawRadar(m);

        // Update stat bars
        updateStats(m);

        // Hide result bar
        if (resultBar) resultBar.style.display = "none";
        if (simStatus) simStatus.textContent = "Ready — adjust sliders to simulate";
    }

    // ═══════════════════════════
    //  WIRE EVENTS
    // ═══════════════════════════
    function wireModelTabs() {
        modelTabs.forEach((tab, i) => {
            tab.addEventListener("click", () => selectModel(i));
        });
    }

    function wireSliders() {
        Object.keys(sliders).forEach((key) => {
            const slider = sliders[key];
            const readout = readouts[key];
            if (!slider) return;
            slider.addEventListener("input", () => {
                if (readout) readout.textContent = slider.value;
                // Rebuild building when stories changes
                if (key === "stories") {
                    buildModel(MODELS[selectedModel]);
                }
                // Live-update radar for damping changes (simulate model tweak)
                if (key === "damping") {
                    drawRadar(MODELS[selectedModel]);
                }
            });
        });
    }

    function wireButtons() {
        runBtn?.addEventListener("click", () => {
            if (simRunning) {
                stopSimulation();
            } else {
                startSimulation();
            }
        });

        resetBtn?.addEventListener("click", () => {
            if (simRunning) stopSimulation();
            // Reset sliders to model defaults
            selectModel(selectedModel);
            if (sliders.magnitude) { sliders.magnitude.value = 5; readouts.magnitude.textContent = "5.0"; }
            if (sliders.pga) { sliders.pga.value = 0.25; readouts.pga.textContent = "0.25"; }
            if (sliders.soil) { sliders.soil.value = 1.15; readouts.soil.textContent = "1.15"; }
            if (sliders.duration) { sliders.duration.value = 15; readouts.duration.textContent = "15"; }
            if (resultBar) resultBar.style.display = "none";
        });
    }

    // ═══════════════════════════
    //  INIT on page load
    // ═══════════════════════════
    let modelsInitialized = false;

    function initModelsTab() {
        if (modelsInitialized) return;
        modelsInitialized = true;
        wireModelTabs();
        wireSliders();
        wireButtons();
        initModelsViewer();
        drawRadar(MODELS[0]);
        updateStats(MODELS[0]);
    }

    // Expose init for wireTabs to call when models tab is activated
    window.initModelsTab = initModelsTab;

    // Also auto-init when DOM is ready (deferred)
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            // Defer until first activation via wireTabs to avoid zero-size canvas
        });
    }
})();
