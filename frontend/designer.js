/* ═══════════════════════════════════════════════════
   Building Designer – parametric design + seismic assessment
   ═══════════════════════════════════════════════════ */
(function () {
    "use strict";

    var $ = function (id) { return document.getElementById(id); };
    var canvas, container;
    var inited = false;

    /* Three.js scene objects */
    var dScene, dCamera, dRenderer, dControls;
    var buildingGroup = null;

    /* Earthquake animation state */
    var quakeAnim = null;  /* { startTime, duration, magnitude, pieces[], cracks[], phase } */
    var LATERAL_COLORS = {
        "moment-frame": 0xf59e0b,
        "shear-wall": 0xf97316,
        "braced-frame": 0xeab308,
        "dual": 0xa855f7
    };
    var FOUNDATION_COLORS = {
        shallow: 0x22c55e,
        deep: 0x16a34a,
        isolated: 0x06b6d4,
        damped: 0x8b5cf6
    };

    /* Material properties (density kg/m³, base strength 0-1, eco 0-1, cost $/m²) */
    var MATS = {
        rc: { name: "RC", density: 2400, strength: 0.7, eco: 0.4, cost: 1250 },
        steel: { name: "Steel", density: 7850, strength: 0.9, eco: 0.35, cost: 1800 },
        timber: { name: "Timber", density: 600, strength: 0.45, eco: 0.9, cost: 950 },
        masonry: { name: "Masonry", density: 1800, strength: 0.35, eco: 0.5, cost: 700 },
        composite: { name: "Composite", density: 3200, strength: 0.85, eco: 0.45, cost: 2000 }
    };

    var FOUNDATIONS = {
        shallow: { label: "Shallow", bonus: 0, maxFloors: 12 },
        deep: { label: "Deep", bonus: 8, maxFloors: 40 },
        isolated: { label: "Isolated", bonus: 20, maxFloors: 25 },
        damped: { label: "Damped", bonus: 15, maxFloors: 30 }
    };

    function getParams() {
        return {
            name: ($("des-name") || {}).value || "My Building",
            floors: parseInt(($("des-floors") || {}).value, 10) || 8,
            floorH: parseFloat(($("des-floor-h") || {}).value) || 3.2,
            width: parseFloat(($("des-width") || {}).value) || 20,
            depth: parseFloat(($("des-depth") || {}).value) || 15,
            shape: ($("des-shape") || {}).value || "rectangular",
            material: ($("des-material") || {}).value || "rc",
            foundation: ($("des-foundation") || {}).value || "shallow",
            lateral: ($("des-lateral") || {}).value || "moment-frame",
            code: ($("des-code") || {}).value || "ibc"
        };
    }

    /* Material colors for Three.js */
    var MAT_COLORS = {
        rc: 0x8b9dc3, steel: 0x7ca0c4, timber: 0xc4a86b,
        masonry: 0xb88b6a, composite: 0x9aa5b4
    };
    var MAT_COLUMN_COLORS = {
        rc: 0x6b7d9c, steel: 0x5a8ab5, timber: 0xa88e4f,
        masonry: 0x9a7050, composite: 0x7a8594
    };

    /* ═══════════════════════════════════════════════════
       Three.js scene init
       ═══════════════════════════════════════════════════ */
    function initScene() {
        if (!canvas || !container || !window.THREE) return;
        var w = container.clientWidth || 600;
        var h = container.clientHeight || 400;

        dScene = new THREE.Scene();
        dScene.background = new THREE.Color(0x0a0e1a);

        dCamera = new THREE.PerspectiveCamera(40, w / h, 0.1, 500);
        dCamera.position.set(20, 15, 25);

        dRenderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        dRenderer.setPixelRatio(window.devicePixelRatio);
        dRenderer.setSize(w, h);
        dRenderer.shadowMap.enabled = true;

        dControls = new THREE.OrbitControls(dCamera, canvas);
        dControls.enableDamping = true;
        dControls.target.set(0, 5, 0);
        dControls.update();

        /* Lights */
        dScene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.8));
        var dir = new THREE.DirectionalLight(0xffffff, 1.0);
        dir.position.set(10, 20, 12);
        dir.castShadow = true;
        dir.shadow.mapSize.set(512, 512);
        dScene.add(dir);

        /* Ground */
        var gGeo = new THREE.PlaneGeometry(60, 60);
        var gMat = new THREE.MeshPhongMaterial({ color: 0x1e293b, side: THREE.DoubleSide });
        var ground = new THREE.Mesh(gGeo, gMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        dScene.add(ground);
        dScene.add(new THREE.GridHelper(60, 30, 0x334155, 0x1f2937));

        window.addEventListener("resize", onDesignerResize);
        tickDesigner();
    }

    function onDesignerResize() {
        if (!dRenderer || !dCamera || !container) return;
        var w = container.clientWidth || 500;
        var h = container.clientHeight || 600;
        dCamera.aspect = w / h;
        dCamera.updateProjectionMatrix();
        dRenderer.setSize(w, h);
    }

    function tickDesigner() {
        requestAnimationFrame(tickDesigner);
        if (dControls) dControls.update();

        /* Earthquake animation */
        if (quakeAnim && buildingGroup) {
            var elapsed = (performance.now() - quakeAnim.startTime) / 1000;
            var t = elapsed / quakeAnim.duration;
            if (t > 1) t = 1;

            var mag = quakeAnim.magnitude;
            var score = quakeAnim.score;
            var shakeIntensity = Math.pow(mag / 10, 2);
            /* envelope: ramp up 0→0.2, sustain 0.2→0.7, decay 0.7→1.0 */
            var env = t < 0.2 ? t / 0.2 : t < 0.7 ? 1.0 : (1.0 - t) / 0.3;
            env = Math.max(0, env);

            /* Shake the building */
            var amp = shakeIntensity * env * 0.4;
            buildingGroup.position.x = Math.sin(elapsed * 35) * amp;
            buildingGroup.position.z = Math.cos(elapsed * 28) * amp * 0.7;

            /* Damage threshold: score < 50 → vulnerable, crack at lower mag */
            var damageThreshold = score >= 70 ? 7.0 : score >= 50 ? 5.5 : 4.0;
            var collapseThreshold = score >= 70 ? 9.0 : score >= 50 ? 7.5 : 6.0;
            var shouldCrack = mag >= damageThreshold;
            var shouldCollapse = mag >= collapseThreshold;

            /* Animate cracks */
            if (shouldCrack && quakeAnim.cracks) {
                var crackProgress = Math.min(1, t * 2);
                quakeAnim.cracks.forEach(function (cr) {
                    cr.mesh.visible = true;
                    cr.mesh.scale.y = crackProgress * cr.targetScale;
                    cr.mesh.material.opacity = 0.6 + 0.4 * crackProgress;
                });
            }

            /* Animate collapse — pieces fall */
            if (shouldCollapse && t > 0.5 && quakeAnim.pieces) {
                var fallT = (t - 0.5) / 0.5;
                quakeAnim.pieces.forEach(function (pc) {
                    if (pc.delay > fallT) return;
                    var ft = Math.min(1, (fallT - pc.delay) / (1 - pc.delay));
                    pc.mesh.position.y = pc.origY - ft * pc.origY * 1.2;
                    pc.mesh.rotation.x = ft * pc.rotDir[0] * 0.5;
                    pc.mesh.rotation.z = ft * pc.rotDir[1] * 0.4;
                    if (pc.mesh.material && pc.mesh.material.opacity !== undefined) {
                        pc.mesh.material.opacity = Math.max(0.1, 1 - ft * 0.6);
                    }
                });
            }

            /* End animation */
            if (t >= 1) {
                /* Compute real damage metrics from the sim */
                var damageIdx = 0;
                if (shouldCollapse) {
                    damageIdx = 80 + (mag - collapseThreshold) / (10 - collapseThreshold) * 20;
                } else if (shouldCrack) {
                    damageIdx = 15 + (mag - damageThreshold) / (collapseThreshold - damageThreshold) * 55;
                } else {
                    damageIdx = mag / damageThreshold * 14;
                }
                damageIdx = Math.max(0, Math.min(100, Math.round(damageIdx)));

                var pga = shakeIntensity * 1.2;
                var maxDrift = shouldCollapse ? 4.0 + (mag - collapseThreshold) * 1.5 : shouldCrack ? 1.0 + (mag - damageThreshold) * 0.8 : mag * 0.1;
                maxDrift = Math.round(maxDrift * 10) / 10;

                var p = getParams();
                var matObj = MATS[p.material] || MATS.rc;
                var fndObj = FOUNDATIONS[p.foundation] || FOUNDATIONS.shallow;

                /* Store real results for the report */
                window._designerResult = window._designerResult || {};
                window._designerResult.quakeRan = true;
                window._designerResult.magnitude = mag;
                window._designerResult.pga = Math.round(pga * 100) / 100;
                window._designerResult.damageIndex = damageIdx;
                window._designerResult.maxDrift = maxDrift;
                window._designerResult.maxAccel = Math.round(pga * 0.9 * 100) / 100;
                window._designerResult.collapsed = shouldCollapse;
                window._designerResult.cracked = shouldCrack;
                window._designerResult.score = score;
                window._designerResult.floors = p.floors;
                window._designerResult.material = matObj.name;
                window._designerResult.foundation = fndObj.label;
                window._designerResult.lateral = p.lateral;
                window._designerResult.shape = p.shape;
                window._designerResult.width = p.width;
                window._designerResult.depth = p.depth;
                window._designerResult.totalHeight = p.floors * p.floorH;

                quakeAnim = null;
                var btn = $("des-quake-btn");
                if (btn) { btn.classList.remove("shaking"); btn.textContent = "🌊 Test Quake"; }
                /* leave cracks visible, leave collapsed state */
            }
        }

        if (dRenderer && dScene && dCamera) dRenderer.render(dScene, dCamera);
    }

    /* ═══════════════════════════════════════════════════
       Procedural building generation
       ═══════════════════════════════════════════════════ */
    function draw3D() {
        if (!dScene) return;
        var p = getParams();

        /* Stop any running quake */
        quakeAnim = null;
        var qBtn = $("des-quake-btn");
        if (qBtn) { qBtn.classList.remove("shaking"); qBtn.textContent = "🌊 Test Quake"; }

        /* Remove old building */
        if (buildingGroup) {
            dScene.remove(buildingGroup);
            buildingGroup.traverse(function (c) {
                if (c.geometry) c.geometry.dispose();
                if (c.material) {
                    if (Array.isArray(c.material)) c.material.forEach(function (m) { m.dispose(); });
                    else c.material.dispose();
                }
            });
        }
        buildingGroup = new THREE.Group();

        var totalH = p.floors * p.floorH;
        var hw = p.width / 2;
        var hd = p.depth / 2;

        /* Normalize scale so building fits in view */
        var maxDim = Math.max(p.width, p.depth, totalH);
        var sc = 14 / maxDim;

        var floorColor = MAT_COLORS[p.material] || 0x8b9dc3;
        var colColor = MAT_COLUMN_COLORS[p.material] || 0x6b7d9c;

        var floorMat = new THREE.MeshPhongMaterial({ color: floorColor, transparent: true, opacity: 0.55 });
        var colMat = new THREE.MeshPhongMaterial({ color: colColor });
        var glassMat = new THREE.MeshPhongMaterial({ color: 0x88ccee, transparent: true, opacity: 0.15 });
        var foundColor = FOUNDATION_COLORS[p.foundation] || 0x22c55e;
        var foundMat = new THREE.MeshPhongMaterial({ color: foundColor, transparent: true, opacity: 0.5 });

        /* ─── Foundation ─── */
        buildFoundation(buildingGroup, p, hw, hd, foundMat, foundColor);

        /* Column positions based on shape */
        var colPositions = getColumnPositions(p, hw, hd);

        /* Lateral system color */
        var latColor = LATERAL_COLORS[p.lateral] || 0xf59e0b;
        var latMat = new THREE.MeshPhongMaterial({ color: latColor, transparent: true, opacity: 0.6 });

        /* Build floors */
        var fndH = (p.foundation === "isolated") ? 1.0 : (p.foundation === "deep") ? 0.8 : (p.foundation === "damped") ? 0.9 : 0.3;
        for (var f = 0; f < p.floors; f++) {
            var baseY = fndH + f * p.floorH;
            var topY = baseY + p.floorH;

            /* Columns for this floor */
            var colRadius = Math.min(p.width, p.depth) * 0.025;
            if (colRadius < 0.15) colRadius = 0.15;
            if (colRadius > 0.5) colRadius = 0.5;
            var colGeo = new THREE.CylinderGeometry(colRadius, colRadius, p.floorH - 0.15, 8);

            colPositions.forEach(function (cp) {
                var col = new THREE.Mesh(colGeo, colMat);
                col.position.set(cp[0], baseY + p.floorH / 2, cp[1]);
                col.castShadow = true;
                col.userData.isFloorPiece = true;
                col.userData.floorIndex = f;
                buildingGroup.add(col);
            });

            /* Floor slab */
            var slabGeo = getFloorGeometry(p, 0.15);
            var slab = new THREE.Mesh(slabGeo, floorMat.clone());
            slab.position.y = topY;
            slab.castShadow = true;
            slab.receiveShadow = true;
            slab.userData.isFloorPiece = true;
            slab.userData.floorIndex = f;
            buildingGroup.add(slab);

            /* Glass curtain walls */
            var glassH = p.floorH - 0.3;
            if (p.shape === "rectangular" || p.shape === "square") {
                addGlassWall(buildingGroup, glassMat, p.width, glassH, 0, baseY + 0.15 + glassH / 2, -hd, 0);
                addGlassWall(buildingGroup, glassMat, p.width, glassH, 0, baseY + 0.15 + glassH / 2, hd, 0);
                addGlassWall(buildingGroup, glassMat, p.depth, glassH, -hw, baseY + 0.15 + glassH / 2, 0, Math.PI / 2);
                addGlassWall(buildingGroup, glassMat, p.depth, glassH, hw, baseY + 0.15 + glassH / 2, 0, Math.PI / 2);
            }

            /* ─── Lateral system visualization ─── */
            buildLateralSystem(buildingGroup, p, latMat, f, baseY, hw, hd, colRadius);
        }

        /* Roof slab */
        var roofMat = new THREE.MeshPhongMaterial({ color: floorColor, transparent: true, opacity: 0.7 });
        var roofGeo = getFloorGeometry(p, 0.2);
        var roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = fndH + totalH;
        roof.castShadow = true;
        roof.userData.isFloorPiece = true;
        roof.userData.floorIndex = p.floors;
        buildingGroup.add(roof);

        /* Scale and add to scene */
        buildingGroup.scale.set(sc, sc, sc);
        buildingGroup.position.x = 0;
        buildingGroup.position.z = 0;
        buildingGroup.position.y = 0;
        dScene.add(buildingGroup);

        /* Fit camera */
        var scaledH = totalH * sc;
        dCamera.position.set(scaledH * 1.2, scaledH * 0.8, scaledH * 1.4);
        dControls.target.set(0, scaledH * 0.4, 0);
        dControls.update();

        /* ─── Update overlay labels ─── */
        updateOverlay(p);

        /* Update label */
        var lbl = $("des-preview-label");
        if (lbl) lbl.textContent = p.floors + "-story " + p.shape;
    }

    /* ═══════════════════════════════════════════════════
       Overlay labels
       ═══════════════════════════════════════════════════ */
    function updateOverlay(p) {
        var mat = MATS[p.material] || MATS.rc;
        var fnd = FOUNDATIONS[p.foundation] || FOUNDATIONS.shallow;
        var lateralNames = {
            "moment-frame": "Moment Frame",
            "shear-wall": "Shear Wall",
            "braced-frame": "Braced Frame",
            "dual": "Dual System"
        };

        var el;
        el = $("des-ov-material");
        if (el) { el.textContent = "Material: " + mat.name; el.setAttribute("data-type", "material"); }
        el = $("des-ov-foundation");
        if (el) { el.textContent = "Foundation: " + fnd.label; el.setAttribute("data-type", "foundation"); }
        el = $("des-ov-lateral");
        if (el) { el.textContent = "Lateral: " + (lateralNames[p.lateral] || p.lateral); el.setAttribute("data-type", "lateral"); }
    }

    /* ═══════════════════════════════════════════════════
       Foundation geometry by type
       ═══════════════════════════════════════════════════ */
    function buildFoundation(group, p, hw, hd, foundMat, foundColor) {
        if (p.foundation === "isolated") {
            /* Base isolators: rubber bearing pads at column positions */
            var padH = 0.6;
            var padR = 0.8;
            var isoMat = new THREE.MeshPhongMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.7 });
            var rubberMat = new THREE.MeshPhongMaterial({ color: 0x1e293b });
            var padGeo = new THREE.CylinderGeometry(padR, padR, padH, 16);
            var rubberGeo = new THREE.CylinderGeometry(padR * 0.85, padR * 0.85, 0.15, 16);
            var cols = getColumnPositions(p, hw, hd);
            cols.forEach(function (cp) {
                var pad = new THREE.Mesh(padGeo, isoMat);
                pad.position.set(cp[0], padH / 2, cp[1]);
                pad.castShadow = true;
                group.add(pad);
                /* rubber layer stripe */
                var rub = new THREE.Mesh(rubberGeo, rubberMat);
                rub.position.set(cp[0], padH * 0.3, cp[1]);
                group.add(rub);
                var rub2 = new THREE.Mesh(rubberGeo, rubberMat);
                rub2.position.set(cp[0], padH * 0.6, cp[1]);
                group.add(rub2);
            });
            /* Connecting slab on top of isolators */
            var slabGeo = new THREE.BoxGeometry(p.width + 0.5, 0.2, p.depth + 0.5);
            var slab = new THREE.Mesh(slabGeo, foundMat);
            slab.position.y = padH + 0.1;
            group.add(slab);
        } else if (p.foundation === "deep") {
            /* Deep piles visible below ground */
            var pileMat = new THREE.MeshPhongMaterial({ color: 0x16a34a, transparent: true, opacity: 0.5 });
            var pileGeo = new THREE.CylinderGeometry(0.3, 0.25, 2.5, 8);
            var cols = getColumnPositions(p, hw, hd);
            cols.forEach(function (cp) {
                var pile = new THREE.Mesh(pileGeo, pileMat);
                pile.position.set(cp[0], -0.8, cp[1]);
                group.add(pile);
            });
            /* Pile cap */
            var capGeo = new THREE.BoxGeometry(p.width + 1, 0.5, p.depth + 1);
            var cap = new THREE.Mesh(capGeo, foundMat);
            cap.position.y = 0.25;
            cap.receiveShadow = true;
            group.add(cap);
        } else if (p.foundation === "damped") {
            /* Damped foundation with visible damper cylinders */
            var dampMat = new THREE.MeshPhongMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.7 });
            var dampGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.8, 12);
            var springGeo = new THREE.TorusGeometry(0.35, 0.06, 8, 16);
            var springMat = new THREE.MeshPhongMaterial({ color: 0xa78bfa });
            var cols = getColumnPositions(p, hw, hd);
            cols.forEach(function (cp) {
                var dmp = new THREE.Mesh(dampGeo, dampMat);
                dmp.position.set(cp[0], 0.4, cp[1]);
                group.add(dmp);
                var spr = new THREE.Mesh(springGeo, springMat);
                spr.position.set(cp[0], 0.6, cp[1]);
                spr.rotation.x = Math.PI / 2;
                group.add(spr);
            });
            var padGeo = new THREE.BoxGeometry(p.width + 0.5, 0.15, p.depth + 0.5);
            var pad = new THREE.Mesh(padGeo, foundMat);
            pad.position.y = 0.85;
            group.add(pad);
        } else {
            /* Shallow: simple pad */
            var fndH = 0.3;
            var fndGeo = new THREE.BoxGeometry(p.width + 1, fndH, p.depth + 1);
            var fndMesh = new THREE.Mesh(fndGeo, foundMat);
            fndMesh.position.y = fndH / 2;
            fndMesh.receiveShadow = true;
            group.add(fndMesh);
        }
    }

    /* ═══════════════════════════════════════════════════
       Lateral system geometry
       ═══════════════════════════════════════════════════ */
    function buildLateralSystem(group, p, latMat, floor, baseY, hw, hd, colR) {
        var h = p.floorH - 0.15;

        if (p.lateral === "braced-frame" || p.lateral === "dual") {
            /* X-braces on two faces */
            addXBrace(group, latMat, -hw, baseY + 0.15, -hd, -hw, baseY + 0.15, hd, h, colR);
            addXBrace(group, latMat, hw, baseY + 0.15, -hd, hw, baseY + 0.15, hd, h, colR);
            if (p.lateral === "dual") {
                /* dual: also add shear walls on the other two faces */
                addShearWall(group, latMat, p.width * 0.3, h, 0, baseY + 0.15 + h / 2, -hd + 0.05, 0);
                addShearWall(group, latMat, p.width * 0.3, h, 0, baseY + 0.15 + h / 2, hd - 0.05, 0);
            }
        } else if (p.lateral === "shear-wall") {
            /* Shear walls on all four faces */
            addShearWall(group, latMat, p.width * 0.4, h, 0, baseY + 0.15 + h / 2, -hd + 0.05, 0);
            addShearWall(group, latMat, p.width * 0.4, h, 0, baseY + 0.15 + h / 2, hd - 0.05, 0);
            addShearWall(group, latMat, p.depth * 0.4, h, -hw + 0.05, baseY + 0.15 + h / 2, 0, Math.PI / 2);
            addShearWall(group, latMat, p.depth * 0.4, h, hw - 0.05, baseY + 0.15 + h / 2, 0, Math.PI / 2);
        }
        /* moment-frame: columns alone (already drawn) - no extra geometry */
    }

    function addXBrace(group, mat, x1, baseY, z1, x2, baseY2, z2, h, colR) {
        /* Two diagonal lines forming an X on one face */
        var faceWidth = Math.sqrt((x2 - x1) * (x2 - x1) + (z2 - z1) * (z2 - z1));
        if (faceWidth < 0.5) return;
        var diagLen = Math.sqrt(faceWidth * faceWidth + h * h);
        var angle = Math.atan2(h, faceWidth);
        var cx = (x1 + x2) / 2;
        var cz = (z1 + z2) / 2;
        var cy = baseY + h / 2;
        var faceAngle = Math.atan2(z2 - z1, x2 - x1);
        var thickness = Math.max(colR * 0.4, 0.05);

        var braceGeo = new THREE.BoxGeometry(diagLen, thickness, thickness);

        /* Brace 1: bottom-left to top-right */
        var b1 = new THREE.Mesh(braceGeo, mat);
        b1.position.set(cx, cy, cz);
        b1.rotation.y = -faceAngle;
        b1.rotation.z = angle;
        group.add(b1);

        /* Brace 2: top-left to bottom-right */
        var b2 = new THREE.Mesh(braceGeo, mat);
        b2.position.set(cx, cy, cz);
        b2.rotation.y = -faceAngle;
        b2.rotation.z = -angle;
        group.add(b2);
    }

    function addShearWall(group, mat, width, height, x, y, z, rotY) {
        var wallMat = mat.clone();
        wallMat.opacity = 0.35;
        var geo = new THREE.BoxGeometry(width, height, 0.2);
        var mesh = new THREE.Mesh(geo, wallMat);
        mesh.position.set(x, y, z);
        if (rotY) mesh.rotation.y = rotY;
        mesh.castShadow = true;
        group.add(mesh);
    }

    /* ═══════════════════════════════════════════════════
       Earthquake test animation
       ═══════════════════════════════════════════════════ */
    function startDesignerQuake() {
        if (quakeAnim || !buildingGroup || !dScene) return;

        /* Rebuild fresh so no leftover damage */
        draw3D();

        var p = getParams();
        /* Use a test magnitude (based on score — weaker building tested harder) */
        var score = computeQuickScore(p);
        var magSlider = $("des-quake-mag");
        var testMag = magSlider ? parseFloat(magSlider.value) : 7.0;

        var damageThreshold = score >= 70 ? 7.0 : score >= 50 ? 5.5 : 4.0;
        var collapseThreshold = score >= 70 ? 9.0 : score >= 50 ? 7.5 : 6.0;

        /* Collect floor pieces for potential collapse */
        var pieces = [];
        var totalH = p.floors * p.floorH;
        buildingGroup.traverse(function (child) {
            if (child.userData && child.userData.isFloorPiece) {
                pieces.push({
                    mesh: child,
                    origY: child.position.y,
                    delay: (child.userData.floorIndex || 0) / (p.floors + 1) * 0.6 + Math.random() * 0.2,
                    rotDir: [Math.random() * 2 - 1, Math.random() * 2 - 1]
                });
            }
        });

        /* Place cracks on the building faces */
        var cracks = [];
        if (testMag >= damageThreshold) {
            var sc = buildingGroup.scale.x; /* uniform scale */
            var crackMat = new THREE.MeshBasicMaterial({ color: 0x1e1e1e, transparent: true, opacity: 0, side: THREE.DoubleSide });
            var numCracks = Math.min(12, Math.floor((testMag - damageThreshold + 1) * 3));
            var hw = p.width / 2, hd = p.depth / 2;
            for (var i = 0; i < numCracks; i++) {
                var crackW = 0.05 + Math.random() * 0.1;
                var crackH = p.floorH * (0.3 + Math.random() * 0.5);
                var crackGeo = new THREE.PlaneGeometry(crackW, crackH);
                var crackMesh = new THREE.Mesh(crackGeo, crackMat.clone());

                /* Random position on a face */
                var face = Math.floor(Math.random() * 4);
                var floorIdx = Math.floor(Math.random() * p.floors);
                var fndH2 = (p.foundation === "isolated") ? 1.0 : (p.foundation === "deep") ? 0.8 : (p.foundation === "damped") ? 0.9 : 0.3;
                var cy = fndH2 + floorIdx * p.floorH + p.floorH * 0.5;
                if (face === 0) { crackMesh.position.set((Math.random() - 0.5) * p.width * 0.8, cy, -hd - 0.02); }
                else if (face === 1) { crackMesh.position.set((Math.random() - 0.5) * p.width * 0.8, cy, hd + 0.02); }
                else if (face === 2) { crackMesh.position.set(-hw - 0.02, cy, (Math.random() - 0.5) * p.depth * 0.8); crackMesh.rotation.y = Math.PI / 2; }
                else { crackMesh.position.set(hw + 0.02, cy, (Math.random() - 0.5) * p.depth * 0.8); crackMesh.rotation.y = Math.PI / 2; }

                /* Random tilt */
                crackMesh.rotation.z = (Math.random() - 0.5) * 0.8;
                crackMesh.visible = false;
                buildingGroup.add(crackMesh);
                cracks.push({ mesh: crackMesh, targetScale: 1 + Math.random() * 0.5 });
            }
        }

        quakeAnim = {
            startTime: performance.now(),
            duration: 4.0,
            magnitude: testMag,
            score: score,
            pieces: pieces,
            cracks: cracks,
            phase: "shake"
        };

        var btn = $("des-quake-btn");
        if (btn) { btn.classList.add("shaking"); btn.textContent = "Shaking..."; }
    }

    function computeQuickScore(p) {
        var mat = MATS[p.material] || MATS.rc;
        var fnd = FOUNDATIONS[p.foundation] || FOUNDATIONS.shallow;
        var score = 50;
        score += mat.strength * 15;
        score += fnd.bonus;
        if (p.code === "none") score -= 20; else score += 5;
        if (p.lateral === "dual") score += 8;
        else if (p.lateral === "shear-wall") score += 5;
        else if (p.lateral === "braced-frame") score += 4;
        if (p.shape === "l-shape" || p.shape === "u-shape") score -= 8;
        var totalH = p.floors * p.floorH;
        var aspectRatio = totalH / Math.min(p.width, p.depth);
        if (aspectRatio > 4) score -= 12; else if (aspectRatio > 3) score -= 5;
        if (p.floors > fnd.maxFloors) score -= 15;
        return Math.max(0, Math.min(100, Math.round(score)));
    }

    function getColumnPositions(p, hw, hd) {
        var cols = [];
        var inset = 0.8;
        if (p.shape === "rectangular" || p.shape === "square") {
            /* 4 corner + midpoints */
            cols.push([-hw + inset, -hd + inset], [hw - inset, -hd + inset],
                [-hw + inset, hd - inset], [hw - inset, hd - inset]);
            if (p.width > 12) {
                cols.push([0, -hd + inset], [0, hd - inset]);
            }
            if (p.depth > 12) {
                cols.push([-hw + inset, 0], [hw - inset, 0]);
            }
        } else if (p.shape === "l-shape") {
            cols.push([-hw + inset, -hd + inset], [hw - inset, -hd + inset],
                [-hw + inset, hd - inset], [0, hd - inset],
                [0, 0], [hw - inset, 0]);
        } else if (p.shape === "u-shape") {
            cols.push([-hw + inset, -hd + inset], [hw - inset, -hd + inset],
                [-hw + inset, hd - inset], [hw - inset, hd - inset],
                [-hw * 0.3, 0], [hw * 0.3, 0]);
        } else if (p.shape === "circular") {
            var r = Math.min(hw, hd) - inset;
            for (var a = 0; a < 8; a++) {
                var angle = (a / 8) * Math.PI * 2;
                cols.push([Math.cos(angle) * r, Math.sin(angle) * r]);
            }
        } else {
            /* fallback: corners */
            cols.push([-hw + inset, -hd + inset], [hw - inset, -hd + inset],
                [-hw + inset, hd - inset], [hw - inset, hd - inset]);
        }
        return cols;
    }

    function getFloorGeometry(p, thickness) {
        var hw = p.width / 2, hd = p.depth / 2;
        if (p.shape === "circular") {
            var r = Math.min(hw, hd);
            return new THREE.CylinderGeometry(r, r, thickness, 24);
        } else if (p.shape === "l-shape") {
            var shape = new THREE.Shape();
            shape.moveTo(-hw, -hd);
            shape.lineTo(hw, -hd);
            shape.lineTo(hw, 0);
            shape.lineTo(0, 0);
            shape.lineTo(0, hd);
            shape.lineTo(-hw, hd);
            shape.closePath();
            var geo = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
            geo.rotateX(-Math.PI / 2);
            return geo;
        } else if (p.shape === "u-shape") {
            var shape = new THREE.Shape();
            var iw = hw * 0.4, id = hd * 0.5;
            shape.moveTo(-hw, -hd);
            shape.lineTo(hw, -hd);
            shape.lineTo(hw, hd);
            shape.lineTo(iw, hd);
            shape.lineTo(iw, id);
            shape.lineTo(-iw, id);
            shape.lineTo(-iw, hd);
            shape.lineTo(-hw, hd);
            shape.closePath();
            var geo = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
            geo.rotateX(-Math.PI / 2);
            return geo;
        }
        /* rectangular / square */
        return new THREE.BoxGeometry(p.width, thickness, p.depth);
    }

    function addGlassWall(group, mat, width, height, x, y, z, rotY) {
        var geo = new THREE.PlaneGeometry(width, height);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        if (rotY) mesh.rotation.y = rotY;
        group.add(mesh);
    }

    function updateReadouts() {
        var p = getParams();
        var mat = MATS[p.material] || MATS.rc;
        var totalH = p.floors * p.floorH;
        var floorArea = p.width * p.depth;

        var el;
        el = $("des-total-area"); if (el) el.textContent = floorArea.toFixed(0);
        el = $("des-total-height"); if (el) el.textContent = totalH.toFixed(1);

        /* rough weight estimate: volume * density * fill factor */
        var fill = 0.15; /* structural volume fraction */
        var weight = floorArea * totalH * mat.density * fill / 1000; /* tonnes */
        el = $("des-weight"); if (el) el.textContent = weight.toFixed(0);

        /* fundamental period (approximate: T ≈ 0.1 * N for RC, 0.08*N for steel) */
        var periodCoeff = p.material === "steel" ? 0.08 : p.material === "timber" ? 0.12 : 0.1;
        var period = periodCoeff * p.floors;
        el = $("des-period"); if (el) el.textContent = period.toFixed(2);
    }

    function assess() {
        var p = getParams();
        var mat = MATS[p.material] || MATS.rc;
        var fnd = FOUNDATIONS[p.foundation] || FOUNDATIONS.shallow;
        var totalH = p.floors * p.floorH;
        var score = 50; /* base */

        /* Material strength contribution */
        score += mat.strength * 15;

        /* Foundation bonus */
        score += fnd.bonus;

        /* Code compliance */
        if (p.code === "none") score -= 20;
        else score += 5;

        /* Lateral system */
        if (p.lateral === "dual") score += 8;
        else if (p.lateral === "shear-wall") score += 5;
        else if (p.lateral === "braced-frame") score += 4;

        /* Penalties */
        /* Irregularity */
        var irreg = "Regular";
        var irregCls = "low";
        if (p.shape === "l-shape" || p.shape === "u-shape") {
            score -= 8;
            irreg = "Irregular";
            irregCls = "moderate";
        }

        /* Soft story */
        var softRisk = "Low";
        var softCls = "low";
        if (p.floors > 4 && p.floorH > 4) {
            score -= 5;
            softRisk = "Moderate";
            softCls = "moderate";
        }

        /* Overturning */
        var aspectRatio = totalH / Math.min(p.width, p.depth);
        var overturn = "OK";
        var overturnCls = "low";
        if (aspectRatio > 4) {
            score -= 12;
            overturn = "High Risk";
            overturnCls = "high";
        } else if (aspectRatio > 3) {
            score -= 5;
            overturn = "Caution";
            overturnCls = "moderate";
        }

        /* Foundation match */
        var foundMatch = "Good";
        var foundCls = "low";
        if (p.floors > fnd.maxFloors) {
            score -= 15;
            foundMatch = "Undersized";
            foundCls = "high";
        }

        /* code compliance */
        var codeLbl = p.code === "none" ? "Non-compliant" : "Compliant";
        var codeCls = p.code === "none" ? "high" : "low";

        score = Math.max(0, Math.min(100, Math.round(score)));

        /* Update DOM */
        var el;
        el = $("des-score-num"); if (el) el.textContent = score;

        /* color the circle */
        var circle = $("des-score-circle");
        if (circle) {
            if (score >= 70) circle.style.borderColor = "#22c55e";
            else if (score >= 45) circle.style.borderColor = "#eab308";
            else circle.style.borderColor = "#ef4444";
        }

        el = $("des-f-irreg"); if (el) { el.textContent = irreg; el.className = "rating-badge " + irregCls; }
        el = $("des-f-soft"); if (el) { el.textContent = softRisk; el.className = "rating-badge " + softCls; }
        el = $("des-f-overturn"); if (el) { el.textContent = overturn; el.className = "rating-badge " + overturnCls; }
        el = $("des-f-found"); if (el) { el.textContent = foundMatch; el.className = "rating-badge " + foundCls; }
        el = $("des-f-code"); if (el) { el.textContent = codeLbl; el.className = "rating-badge " + codeCls; }

        /* store for report */
        var matObj = MATS[p.material] || MATS.rc;
        var fndObj2 = FOUNDATIONS[p.foundation] || FOUNDATIONS.shallow;
        window._designerResult = window._designerResult || {};
        window._designerResult.params = p;
        window._designerResult.score = score;
        window._designerResult.floors = p.floors;
        window._designerResult.material = matObj.name;
        window._designerResult.foundation = fndObj2.label;
        window._designerResult.lateral = p.lateral;
        window._designerResult.shape = p.shape;
        window._designerResult.width = p.width;
        window._designerResult.depth = p.depth;
        window._designerResult.totalHeight = p.floors * p.floorH;
        window._designerResult.factors = { irregularity: irreg, softStory: softRisk, overturning: overturn, foundation: foundMatch, code: codeLbl };
    }

    function wireControls() {
        var fields = ["des-floors", "des-floor-h", "des-width", "des-depth", "des-shape",
            "des-material", "des-foundation", "des-lateral", "des-code", "des-name"];
        fields.forEach(function (id) {
            var el = $(id);
            if (el) {
                el.addEventListener("input", function () { draw3D(); updateReadouts(); });
                /* selects fire "change" not "input" on mobile */
                if (el.tagName === "SELECT") {
                    el.addEventListener("change", function () { draw3D(); updateReadouts(); });
                }
            }
        });

        /* Validate numeric fields — reject null, 0, or negative */
        var numericFields = ["des-floors", "des-floor-h", "des-width", "des-depth"];
        numericFields.forEach(function (id) {
            var el = $(id);
            if (!el) return;
            el.addEventListener("blur", function () {
                var v = parseFloat(el.value);
                if (!v || v <= 0 || isNaN(v)) {
                    el.style.borderColor = "#ef4444";
                    el.style.boxShadow = "0 0 0 3px rgba(239,68,68,0.15)";
                    /* show inline message */
                    var msg = el.parentNode.querySelector(".field-error");
                    if (!msg) {
                        msg = document.createElement("span");
                        msg.className = "field-error";
                        msg.style.cssText = "color:#ef4444;font-size:0.75rem;display:block;margin-top:2px;";
                        el.parentNode.appendChild(msg);
                    }
                    msg.textContent = "Input should be a valid number greater than 0";
                } else {
                    el.style.borderColor = "";
                    el.style.boxShadow = "";
                    var msg = el.parentNode.querySelector(".field-error");
                    if (msg) msg.remove();
                }
            });
        });

        var assessBtn = $("des-assess-btn");
        if (assessBtn) assessBtn.addEventListener("click", function () { assess(); draw3D(); updateReadouts(); });

        /* Magnitude slider */
        var magSlider = $("des-quake-mag");
        var magVal = $("des-quake-mag-val");
        if (magSlider) {
            magSlider.addEventListener("input", function () {
                if (magVal) magVal.textContent = parseFloat(magSlider.value).toFixed(1);
            });
        }

        var quakeBtn = $("des-quake-btn");
        if (quakeBtn) quakeBtn.addEventListener("click", function () {
            startDesignerQuake();
        });
    }

    window.initDesignerTab = function () {
        if (inited) return;
        inited = true;
        container = $("designer-3d-container");
        canvas = $("designer-canvas");
        initScene();
        wireControls();
        draw3D();
        updateReadouts();
    };
})();
