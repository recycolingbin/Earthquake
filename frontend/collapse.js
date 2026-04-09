/* ═══════════════════════════════════════════════════
   Collapse Lab – GLB building, earthquake shake,
   collapse at M≥8.5, damage heatmap, dust particles,
   shake timeline, slow-mo replay, stats panel
   ═══════════════════════════════════════════════════ */
(function () {
    "use strict";

    var $ = function (id) { return document.getElementById(id); };

    /* DOM refs - resolved lazily in init so the tab is visible */
    var canvas, container, overlay;
    var magSlider, magVal, durSlider, durVal, crackSlider, crackVal;
    var runBtn, resetBtn, replayBtn;
    var resultBar, stateValue, stateRating, statusBadge, simStatus;
    var heatmapLegend;

    function resolveDOM() {
        canvas = $("collapse-3d-canvas");
        container = $("collapse-3d-container");
        overlay = $("collapse-overlay");
        magSlider = $("collapse-magnitude");
        magVal = $("collapse-magnitude-val");
        durSlider = $("collapse-duration");
        durVal = $("collapse-duration-val");
        crackSlider = $("collapse-crack");
        crackVal = $("collapse-crack-val");
        runBtn = $("collapse-run-btn");
        resetBtn = $("collapse-reset-btn");
        replayBtn = $("collapse-replay-btn");
        resultBar = $("collapse-result-bar");
        stateValue = $("collapse-state-value");
        stateRating = $("collapse-state-rating");
        statusBadge = $("collapse-status-badge");
        simStatus = $("collapse-sim-status");
        heatmapLegend = $("collapse-heatmap-legend");
    }

    /* ── state ── */
    var scene, camera, renderer, controls;
    var modelGroup = null;
    var pieces = [];
    var pieceData = [];
    var groundMesh = null;
    var magnitude = 6.0;
    var duration = 18;
    var crackHeight = 0.45;
    var simRunning = false;
    var simElapsed = 0;
    var collapsed = false;
    var inited = false;
    var modelBBox = null;
    var lastModelUrl = "project1.glb";

    /* replay state */
    var replayMode = false;
    var replayFrames = [];
    var replayIdx = 0;
    var REPLAY_SLOW = 4;

    /* dust particles */
    var dustCanvas, dustCtx;
    var dustParticles = [];
    var DUST_MAX = 200;

    /* shake timeline */
    var shakeCanvas, shakeCtx;
    var shakeData = [];
    var SHAKE_MAX = 400;

    /* tracking */
    var peakVelocity = 0;
    var peakKineticEnergy = 0;

    var COLLAPSE_THRESHOLD = 8.0;
    var floorPiece = null;  /* the 'Plane' mesh from the model */
    var GRAVITY = -9.81;
    var DT = 1 / 60;

    /* progressive collapse */
    var collapseWaveY = 999;   /* current Y level of the collapse wave (sweeps downward) */
    var collapseWaveSpeed = 0; /* units/sec the wave descends */
    var IBL_ENV_URL = (document.querySelector('meta[name="ibl-env"]') || {}).content || "";
    IBL_ENV_URL = (IBL_ENV_URL || "").trim();
    var collapseEnvPromise = null;

    function configurePbrRenderer(r) {
        if (!r || !window.THREE) return;

        if ("outputColorSpace" in r && THREE.SRGBColorSpace) {
            r.outputColorSpace = THREE.SRGBColorSpace;
        } else if ("outputEncoding" in r && THREE.sRGBEncoding) {
            r.outputEncoding = THREE.sRGBEncoding;
        }

        if ("toneMapping" in r && THREE.ACESFilmicToneMapping !== undefined) {
            r.toneMapping = THREE.ACESFilmicToneMapping;
        }
        if ("toneMappingExposure" in r) {
            r.toneMappingExposure = 1.0;
        }
    }

    /* Scale down imported PointLight / SpotLight so Blender candela values
       don't blow out the scene in the legacy Three.js light pipeline.      */
    function tameImportedLights(root) {
        if (!root) return;
        root.traverse(function (child) {
            if (child.isPointLight || child.isSpotLight) {
                child.intensity = Math.min(child.intensity / 100, 2);
                child.distance = child.distance || 50;
                child.decay = 2;
            }
        });
    }

    function tuneGltfMaterials(root) {
        if (!root || !window.THREE || !renderer) return;

        var maxAniso = renderer.capabilities && renderer.capabilities.getMaxAnisotropy
            ? renderer.capabilities.getMaxAnisotropy()
            : 1;

        function markColorTexture(tx) {
            if (!tx) return;
            if ("colorSpace" in tx && THREE.SRGBColorSpace) {
                tx.colorSpace = THREE.SRGBColorSpace;
            } else if ("encoding" in tx && THREE.sRGBEncoding) {
                tx.encoding = THREE.sRGBEncoding;
            }
            if ("anisotropy" in tx) tx.anisotropy = Math.min(8, maxAniso);
            tx.needsUpdate = true;
        }

        function tuneTexture(tx) {
            if (!tx) return;
            if ("anisotropy" in tx) tx.anisotropy = Math.min(8, maxAniso);
            tx.needsUpdate = true;
        }

        root.traverse(function (child) {
            if (!child.isMesh || !child.material) return;

            var mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach(function (mat) {
                if (!mat) return;

                markColorTexture(mat.map);
                markColorTexture(mat.emissiveMap);

                tuneTexture(mat.normalMap);
                tuneTexture(mat.roughnessMap);
                tuneTexture(mat.metalnessMap);
                tuneTexture(mat.aoMap);

                mat.needsUpdate = true;
            });
        });
    }

    function loadScriptOnce(src, id) {
        var existing = id ? document.getElementById(id) : null;
        if (existing) {
            if (existing.dataset.loaded === "1") return Promise.resolve(true);
            existing.remove();
        }

        return new Promise(function (resolve, reject) {
            var s = document.createElement("script");
            if (id) s.id = id;
            s.src = src;
            s.async = true;
            s.onload = function () {
                s.dataset.loaded = "1";
                resolve(true);
            };
            s.onerror = function () { reject(new Error("Failed to load " + src)); };
            document.head.appendChild(s);
        });
    }

    function ensureRgbeloader() {
        if (!window.THREE) return Promise.resolve(false);
        if (THREE.RGBELoader) return Promise.resolve(true);

        if (window.__seismosafeRgbeloaderPromise) {
            return window.__seismosafeRgbeloaderPromise;
        }

        var rev = String(THREE.REVISION || "");
        var version = /^\d+$/.test(rev) ? "0." + rev + ".0" : "0.160.0";
        var sources = [
            "https://cdn.jsdelivr.net/npm/three@" + version + "/examples/js/loaders/RGBELoader.js",
            "https://unpkg.com/three@" + version + "/examples/js/loaders/RGBELoader.js",
        ];

        window.__seismosafeRgbeloaderPromise = (async function () {
            for (var i = 0; i < sources.length; i++) {
                var src = sources[i];
                try {
                    await loadScriptOnce(src, "three-rgbe-loader");
                    if (THREE.RGBELoader) return true;
                } catch (err) {
                    console.warn("[IBL] RGBELoader source failed:", src, (err && err.message) || err);
                }
            }
            return !!THREE.RGBELoader;
        })();

        return window.__seismosafeRgbeloaderPromise;
    }

    function applyEnvironmentMap(targetScene, activeRenderer, texture) {
        if (!targetScene || !activeRenderer || !texture || !window.THREE || !THREE.PMREMGenerator) return false;

        var pmrem = new THREE.PMREMGenerator(activeRenderer);
        if (pmrem.compileEquirectangularShader) pmrem.compileEquirectangularShader();
        var envRT = pmrem.fromEquirectangular(texture);
        targetScene.environment = envRT.texture;
        pmrem.dispose();
        if (texture.dispose) texture.dispose();
        return true;
    }

    function loadSceneEnvironment(targetScene, activeRenderer) {
        if (!IBL_ENV_URL || !targetScene || !activeRenderer || !window.THREE) {
            return Promise.resolve(false);
        }
        if (collapseEnvPromise) return collapseEnvPromise;

        var path = IBL_ENV_URL.split("?")[0].toLowerCase();
        var isHdr = path.endsWith(".hdr") || path.endsWith(".rgbe");

        collapseEnvPromise = new Promise(function (resolve) {
            var onError = function (err) {
                console.warn("[IBL] Environment map load failed:", (err && err.message) || err);
                resolve(false);
            };

            if (isHdr) {
                ensureRgbeloader()
                    .then(function (ok) {
                        if (!ok || !THREE.RGBELoader) {
                            onError(new Error("RGBELoader unavailable"));
                            return;
                        }

                        new THREE.RGBELoader().load(
                            IBL_ENV_URL,
                            function (hdrTexture) {
                                resolve(applyEnvironmentMap(targetScene, activeRenderer, hdrTexture));
                            },
                            undefined,
                            onError
                        );
                    })
                    .catch(onError);
                return;
            }

            new THREE.TextureLoader().load(
                IBL_ENV_URL,
                function (texture) {
                    texture.mapping = THREE.EquirectangularReflectionMapping;
                    resolve(applyEnvironmentMap(targetScene, activeRenderer, texture));
                },
                undefined,
                onError
            );
        });

        return collapseEnvPromise;
    }

    /* ═══════════════════════════════════════════════════
       Scene setup
       ═══════════════════════════════════════════════════ */
    function initScene() {
        if (!canvas || !window.THREE) { console.warn('[Collapse] canvas or THREE missing'); return; }
        var w = container.clientWidth;
        var h = container.clientHeight;
        /* Force sensible fallback — tab may have just become visible */
        if (w < 50) w = 600;
        if (h < 50) h = 420;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x05070f);
        scene.fog = new THREE.FogExp2(0x05070f, 0.006);

        camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 2000);
        camera.position.set(14, 10, 18);

        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(w, h);
        renderer.shadowMap.enabled = true;
        configurePbrRenderer(renderer);

        controls = new THREE.OrbitControls(camera, canvas);
        controls.enableDamping = true;
        controls.target.set(0, 4, 0);
        controls.update();

        scene.add(new THREE.AmbientLight(0xffffff, 0.3));
        scene.add(new THREE.HemisphereLight(0xffffff, 0x202b3e, 1.0));
        var dir = new THREE.DirectionalLight(0xffffff, 2.0);
        dir.position.set(10, 25, 12);
        dir.castShadow = true;
        dir.shadow.mapSize.set(1024, 1024);
        scene.add(dir);
        var fill = new THREE.DirectionalLight(0x8899bb, 0.7);
        fill.position.set(-10, 15, -10);
        scene.add(fill);

        var gGeo = new THREE.PlaneGeometry(60, 60);
        var gMat = new THREE.MeshPhongMaterial({ color: 0x1e293b, side: THREE.DoubleSide });
        groundMesh = new THREE.Mesh(gGeo, gMat);
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.receiveShadow = true;
        scene.add(groundMesh);

        scene.add(new THREE.GridHelper(60, 30, 0x334155, 0x1f2937));

        loadSceneEnvironment(scene, renderer).then(function (ok) {
            if (ok) console.info("[IBL] Environment map enabled for collapse viewer");
        });

        window.addEventListener("resize", onResize);
        tick();
    }

    function onResize() {
        if (!renderer || !camera) return;
        var w = container.clientWidth || 600;
        var h = container.clientHeight || 420;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        if (dustCanvas) {
            dustCanvas.width = w;
            dustCanvas.height = h;
        }
    }

    /* ═══════════════════════════════════════════════════
       Dust Particles (2D overlay)
       ═══════════════════════════════════════════════════ */
    function initDust() {
        dustCanvas = $("collapse-dust-canvas");
        if (!dustCanvas) return;
        dustCanvas.width = container.clientWidth || 600;
        dustCanvas.height = container.clientHeight || 420;
        dustCtx = dustCanvas.getContext("2d");
        dustParticles = [];
    }

    function spawnDust(x, y, count) {
        if (!dustCtx) return;
        for (var i = 0; i < count; i++) {
            dustParticles.push({
                x: x + (Math.random() - 0.5) * 80,
                y: y + (Math.random() - 0.5) * 40,
                vx: (Math.random() - 0.5) * 3,
                vy: -Math.random() * 2 - 0.5,
                life: 1.0,
                decay: 0.005 + Math.random() * 0.015,
                size: 2 + Math.random() * 6,
                color: Math.random() > 0.5 ? "180,160,140" : "160,150,130",
            });
        }
        if (dustParticles.length > DUST_MAX) {
            dustParticles.splice(0, dustParticles.length - DUST_MAX);
        }
    }

    function updateDust() {
        if (!dustCtx || !dustCanvas) return;
        var w = dustCanvas.width, h = dustCanvas.height;
        dustCtx.clearRect(0, 0, w, h);

        for (var i = dustParticles.length - 1; i >= 0; i--) {
            var p = dustParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy -= 0.02;
            p.life -= p.decay;
            if (p.life <= 0) { dustParticles.splice(i, 1); continue; }
            dustCtx.beginPath();
            dustCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            dustCtx.fillStyle = "rgba(" + p.color + "," + (p.life * 0.5) + ")";
            dustCtx.fill();
        }
    }

    /* ═══════════════════════════════════════════════════
       Shake Timeline Canvas
       ═══════════════════════════════════════════════════ */
    function initShakeCanvas() {
        shakeCanvas = $("collapse-shake-canvas");
        if (shakeCanvas) shakeCtx = shakeCanvas.getContext("2d");
        shakeData = [];
        drawShakeTimeline();
    }

    function drawShakeTimeline() {
        if (!shakeCtx || !shakeCanvas) return;
        var w = shakeCanvas.width, h = shakeCanvas.height;
        var ctx = shakeCtx;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "#0a0e1a";
        ctx.fillRect(0, 0, w, h);

        /* grid */
        ctx.strokeStyle = "rgba(148,163,184,0.08)";
        ctx.lineWidth = 1;
        for (var y = 0; y < h; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
        for (var x = 0; x < w; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }

        /* centre line */
        ctx.strokeStyle = "rgba(239,68,68,0.3)";
        ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();

        if (shakeData.length < 2) {
            ctx.fillStyle = "#64748b";
            ctx.font = "11px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("Run simulation to see shake timeline", w / 2, h / 2 - 8);
            return;
        }

        /* waveform */
        var step = w / SHAKE_MAX;
        ctx.beginPath();
        ctx.strokeStyle = "#f97316";
        ctx.lineWidth = 1.5;
        shakeData.forEach(function (v, i) {
            var xx = i * step;
            var yy = h / 2 - v * (h * 0.4);
            i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy);
        });
        ctx.stroke();

        /* glow */
        ctx.beginPath();
        ctx.strokeStyle = "rgba(249,115,22,0.25)";
        ctx.lineWidth = 4;
        shakeData.forEach(function (v, i) {
            var xx = i * step;
            var yy = h / 2 - v * (h * 0.4);
            i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy);
        });
        ctx.stroke();

        /* collapse marker */
        if (collapsed) {
            var collapseTime = 1.5;
            var cx = (collapseTime / duration) * SHAKE_MAX * step;
            if (cx < w) {
                ctx.strokeStyle = "rgba(239,68,68,0.6)";
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 3]);
                ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = "#ef4444";
                ctx.font = "bold 9px Inter, sans-serif";
                ctx.textAlign = "left";
                ctx.fillText("COLLAPSE", cx + 4, 14);
            }
        }

        ctx.fillStyle = "#64748b";
        ctx.font = "10px Inter, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("Ground Accel.", 6, 14);

        var last = shakeData[shakeData.length - 1];
        ctx.fillStyle = "#f97316";
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "right";
        ctx.fillText((last * 10).toFixed(2) + " g", w - 6, 14);
    }

    /* ═══════════════════════════════════════════════════
       Load GLB model
       ═══════════════════════════════════════════════════ */
    function loadModel(urlOrFile) {
        if (!window.THREE || !THREE.GLTFLoader) { console.error("[Collapse] THREE or GLTFLoader not loaded"); return; }
        clearModel();
        if (overlay) {
            overlay.style.display = "flex";
            var txt = overlay.querySelector(".viewer-overlay-text");
            if (txt) txt.textContent = "Loading model...";
        }
        if (statusBadge) statusBadge.textContent = "Loading";
        console.info("[Collapse] loadModel:", typeof urlOrFile === "string" ? urlOrFile : "File object");

        var loader = new THREE.GLTFLoader();
        try {
            if (THREE.DRACOLoader) {
                var dracoLoader = new THREE.DRACOLoader();
                dracoLoader.setDecoderPath('lib/draco/');
                loader.setDRACOLoader(dracoLoader);
            }
        } catch (e) {
            console.warn('[Collapse] DRACOLoader init failed (non-fatal):', e.message);
        }

        var onLoad = function (gltf) {
            console.info('[Collapse] GLB loaded, processing...');
            var root = gltf.scene;
            tuneGltfMaterials(root);
            tameImportedLights(root);

            /* --- Preserve original GLB materials, store orig color for heatmap reset --- */
            var meshCount = 0;
            floorPiece = null;
            root.traverse(function (child) {
                if (child.isMesh) {
                    var isFloor = child.name === 'Plane' || (child.parent && child.parent.name === 'Empty');
                    /* Clone material so each mesh can be tinted independently */
                    if (child.material) {
                        child.material = child.material.clone();
                        child.material._origColor = child.material.color.getHex();
                    }
                    if (isFloor) {
                        if (child.material) child.material._isFloor = true;
                        child.castShadow = false;
                        child.receiveShadow = true;
                        floorPiece = child;
                        console.info('[Collapse] Identified floor mesh:', child.name);
                    } else {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                    meshCount++;
                }
            });
            console.info('[Collapse] Found', meshCount, 'meshes (' + (floorPiece ? '1 floor + ' + (meshCount - 1) + ' pieces' : 'no floor detected') + ')');

            /* --- Compute bounding box in world space, then normalize --- */
            root.updateMatrixWorld(true);
            var box = new THREE.Box3().setFromObject(root);
            var size = box.getSize(new THREE.Vector3());
            var center = box.getCenter(new THREE.Vector3());
            console.info('[Collapse] Raw bbox size:', size.x.toFixed(4), size.y.toFixed(4), size.z.toFixed(4));
            console.info('[Collapse] Raw bbox center:', center.x.toFixed(4), center.y.toFixed(4), center.z.toFixed(4));

            /* Center horizontally, sit on ground */
            root.position.x -= center.x;
            root.position.z -= center.z;
            root.position.y -= box.min.y;

            /* Recompute and scale to fit ~12 units */
            root.updateMatrixWorld(true);
            var box2 = new THREE.Box3().setFromObject(root);
            var size2 = box2.getSize(new THREE.Vector3());
            var maxDim = Math.max(size2.x, size2.y, size2.z);
            if (maxDim < 0.001) maxDim = 1; /* safety */
            var TARGET_SIZE = 14;
            var s = TARGET_SIZE / maxDim;
            console.info('[Collapse] maxDim:', maxDim.toFixed(4), '→ scale:', s.toFixed(4));

            root.scale.multiplyScalar(s);

            /* Final reposition after scale */
            root.updateMatrixWorld(true);
            var box3 = new THREE.Box3().setFromObject(root);
            var center3 = box3.getCenter(new THREE.Vector3());
            root.position.x -= center3.x;
            root.position.z -= center3.z;
            root.position.y -= box3.min.y;

            root.updateMatrixWorld(true);
            modelBBox = new THREE.Box3().setFromObject(root);
            var finalSize = modelBBox.getSize(new THREE.Vector3());
            console.info('[Collapse] Final bbox size:', finalSize.x.toFixed(2), finalSize.y.toFixed(2), finalSize.z.toFixed(2));

            modelGroup = new THREE.Group();
            modelGroup.add(root);
            scene.add(modelGroup);

            pieces = [];
            pieceData = [];
            root.traverse(function (child) {
                if (child.isMesh && child !== floorPiece) {
                    pieces.push(child);
                }
            });

            /* Hide the scene's built-in ground plane – the model has its own floor */
            if (groundMesh && floorPiece) {
                groundMesh.visible = false;
            }

            var bboxHeight = Math.max(modelBBox.max.y - modelBBox.min.y, 0.01);
            pieces.forEach(function (mesh) {
                mesh.updateWorldMatrix(true, false);
                var wp = new THREE.Vector3();
                mesh.getWorldPosition(wp);
                var wq = new THREE.Quaternion();
                mesh.getWorldQuaternion(wq);
                mesh.geometry.computeBoundingBox();
                var gc = mesh.geometry.boundingBox.getCenter(new THREE.Vector3());
                pieceData.push({
                    origPos: wp.clone(),
                    origQuat: wq.clone(),
                    origLocalPos: mesh.position.clone(),
                    origLocalQuat: mesh.quaternion.clone(),
                    origLocalScale: mesh.scale.clone(),
                    origParent: mesh.parent,
                    velocity: new THREE.Vector3(0, 0, 0),
                    angVel: new THREE.Vector3(0, 0, 0),
                    detached: false,
                    grounded: false,
                    damage: 0,
                    geomCenter: gc.clone(),
                    crackAmount: 0,
                    heightNorm: Math.max(0, Math.min(1, (wp.y - modelBBox.min.y) / bboxHeight)),
                });
            });

            fitCamera(modelGroup);
            onResize();
            if (overlay) overlay.style.display = "none";
            if (statusBadge) statusBadge.textContent = "Ready";
            if (simStatus) simStatus.textContent = "Loaded " + pieces.length + " pieces \u2013 threshold: " + COLLAPSE_THRESHOLD;
            console.info('[Collapse] Ready: ' + pieces.length + ' meshes');
        };

        var onProgress = function (xhr) {
            if (xhr.lengthComputable) {
                var pct = Math.round(xhr.loaded / xhr.total * 100);
                if (overlay) {
                    var txt = overlay.querySelector('.viewer-overlay-text');
                    if (txt) txt.textContent = 'Loading model... ' + pct + '%';
                }
            }
        };

        if (typeof urlOrFile === "string") {
            lastModelUrl = urlOrFile;
            loader.load(urlOrFile, onLoad, onProgress, function (err) {
                console.error("[Collapse] GLB load error", err);
                if (overlay) overlay.querySelector(".viewer-overlay-text").textContent = "Failed to load model";
                if (statusBadge) statusBadge.textContent = "Error";
            });
        } else {
            lastModelUrl = null;
            var reader = new FileReader();
            reader.onload = function (e) {
                loader.parse(e.target.result, "", onLoad, function (err) {
                    console.error("[Collapse] GLB parse error", err);
                    if (overlay) overlay.querySelector(".viewer-overlay-text").textContent = "Failed to parse model";
                    if (statusBadge) statusBadge.textContent = "Error";
                });
            };
            reader.readAsArrayBuffer(urlOrFile);
        }
    }

    function clearModel() {
        if (modelGroup) {
            scene.remove(modelGroup);
            modelGroup.traverse(function (c) {
                if (c.geometry) c.geometry.dispose();
                if (c.material) {
                    if (Array.isArray(c.material)) c.material.forEach(function (m) { m.dispose(); });
                    else c.material.dispose();
                }
            });
        }
        modelGroup = null;
        pieces = [];
        pieceData = [];
        modelBBox = null;
    }

    function fitCamera(obj) {
        if (!camera || !controls) return;
        var box = new THREE.Box3().setFromObject(obj);
        var size = box.getSize(new THREE.Vector3());
        var center = box.getCenter(new THREE.Vector3());
        var maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim < 0.01) maxDim = 10;
        var dist = maxDim / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5))) * 1.0;
        camera.position.set(center.x + dist * 0.45, center.y + dist * 0.35, center.z + dist * 0.55);
        camera.near = 0.01;
        camera.far = Math.max(dist * 30, 2000);
        camera.updateProjectionMatrix();
        controls.target.copy(center);
        controls.update();
        console.info('[Collapse] Camera fitted: dist=' + dist.toFixed(2) + ' target=(' + center.x.toFixed(2) + ',' + center.y.toFixed(2) + ',' + center.z.toFixed(2) + ')');
    }

    /* ═══════════════════════════════════════════════════
       Damage heatmap – color meshes by stress/height
       ═══════════════════════════════════════════════════ */
    function updateDamageHeatmap(shakeIntensity) {
        if (!modelBBox || pieces.length === 0) return;
        var bboxSize = modelBBox.getSize(new THREE.Vector3());
        var bboxMinY = modelBBox.min.y;
        var DAMAGE_VISIBLE = 0.05;
        var anyDamage = false;

        pieces.forEach(function (mesh, i) {
            var pd = pieceData[i];
            mesh.updateWorldMatrix(true, false);
            var wp = new THREE.Vector3();
            mesh.getWorldPosition(wp);

            var heightNorm = Math.min(Math.max((wp.y - bboxMinY) / bboxSize.y, 0), 1);
            var stress = heightNorm * shakeIntensity * 2 * (0.5 + crackHeight);
            pd.damage = Math.min(Math.max(pd.damage, stress), 1);

            if (pd.detached) pd.damage = 1;

            /* Below threshold → keep original material color */
            if (pd.damage < DAMAGE_VISIBLE) return;
            anyDamage = true;

            /* original → yellow(0.5) → red(1) — blend from original color */
            var d = pd.damage;
            var origR = ((mesh.material._origColor >> 16) & 255) / 255;
            var origG = ((mesh.material._origColor >> 8) & 255) / 255;
            var origB = (mesh.material._origColor & 255) / 255;
            var r, g, b;
            if (d < 0.5) {
                var t = d * 2;
                r = origR + (0.918 - origR) * t;
                g = origG + (0.702 - origG) * t;
                b = origB + (0.031 - origB) * t;
            } else {
                var t = (d - 0.5) * 2;
                r = 0.918 + (0.937 - 0.918) * t;
                g = 0.702 + (0.267 - 0.702) * t;
                b = 0.031 + (0.267 - 0.031) * t;
            }

            if (mesh.material) {
                mesh.material.color.setRGB(r, g, b);
                mesh.material.emissive = mesh.material.emissive || new THREE.Color();
                mesh.material.emissive.setRGB(d * 0.15, 0, 0);
            }
        });

        if (heatmapLegend) heatmapLegend.style.display = anyDamage ? "block" : "none";
    }

    function resetDamageColors() {
        pieces.forEach(function (mesh, i) {
            pieceData[i].damage = 0;
            if (mesh.material && mesh.material._origColor !== undefined) {
                mesh.material.color.setHex(mesh.material._origColor);
                if (mesh.material.emissive) mesh.material.emissive.setRGB(0, 0, 0);
            }
        });
        if (heatmapLegend) heatmapLegend.style.display = "none";
    }

    /* ═══════════════════════════════════════════════════
       Earthquake & Collapse Physics
       ═══════════════════════════════════════════════════ */
    function startSim() {
        if (!modelGroup || pieces.length === 0) return;
        simRunning = true;
        simElapsed = 0;
        collapsed = false;
        collapseWaveY = 999;
        collapseWaveSpeed = 0;
        collapseStartTime = 0;
        replayMode = false;
        replayFrames = [];
        peakVelocity = 0;
        peakKineticEnergy = 0;
        shakeData = [];
        dustParticles = [];

        resetPiecePhysics();
        resetDamageColors();

        resultBar.style.display = "flex";
        stateValue.textContent = "Shaking...";
        stateRating.innerHTML = "";
        statusBadge.textContent = "Shaking";
        simStatus.textContent = "M" + magnitude.toFixed(1) + " \u2014 " + duration + "s";
        if (replayBtn) replayBtn.style.display = "none";
        updateStatsPanel();
    }

    function resetPiecePhysics() {
        for (var i = 0; i < pieces.length; i++) {
            var pd = pieceData[i];
            var mesh = pieces[i];
            /* Reparent back to original parent if detached */
            if (pd.detached && pd.origParent) {
                scene.remove(mesh);
                pd.origParent.add(mesh);
            }
            mesh.position.copy(pd.origLocalPos);
            mesh.quaternion.copy(pd.origLocalQuat);
            mesh.scale.copy(pd.origLocalScale);
            pd.velocity.set(0, 0, 0);
            pd.angVel.set(0, 0, 0);
            pd.detached = false;
            pd.grounded = false;
            pd.damage = 0;
            pd.crackAmount = 0;
        }
    }

    function stepSimulation() {
        if (!simRunning || !modelGroup) return;
        simElapsed += DT;

        var progress = simElapsed / duration;
        /* Exponential scaling: M1→~0.01, M5→0.25, M8→0.64, M10→1.0 */
        var magScale = Math.pow(magnitude / 10, 2);
        var envelope = Math.sin(Math.PI * Math.min(progress * 2, 1));
        var shakeIntensity = magScale * envelope;

        /* ground shake – move the whole modelGroup */
        var freq1 = 8 + magnitude * 0.5;
        var freq2 = 5.3 + magnitude * 0.3;

        if (!collapsed) {
            var dx = Math.sin(simElapsed * freq1) * shakeIntensity * 0.6;
            var dz = Math.cos(simElapsed * freq2) * shakeIntensity * 0.45;
            modelGroup.position.x = dx;
            modelGroup.position.z = dz;
            if (groundMesh) {
                groundMesh.position.x = dx * 0.3;
                groundMesh.position.z = dz * 0.3;
            }

            var accel = Math.sin(simElapsed * freq1) * shakeIntensity;
            shakeData.push(accel);
            if (shakeData.length > SHAKE_MAX) shakeData.shift();

            /* Track shake energy — keep peak */
            var shakeSpeed = Math.sqrt(dx * dx + dz * dz) / DT;
            if (shakeSpeed > peakVelocity) peakVelocity = shakeSpeed;
            var shakeKE = 0.5 * pieces.length * shakeSpeed * shakeSpeed;
            if (shakeKE > peakKineticEnergy) peakKineticEnergy = shakeKE;
        }

        /* crack formation – shrink pieces to reveal fracture gaps */
        if (magnitude >= 6 && simElapsed > 0.3) {
            var crackRate = shakeIntensity * 0.8 * (0.5 + crackHeight);
            for (var ci = 0; ci < pieces.length; ci++) {
                var cpd = pieceData[ci];
                if (cpd.detached) continue;
                var heightFactor = 0.3 + cpd.heightNorm * 0.7;
                var maxCrack = collapsed ? 1.0 : 0.35;
                cpd.crackAmount = Math.min(cpd.crackAmount + crackRate * heightFactor * DT, maxCrack);
                /* scale reduction centered on geometry centroid */
                var f = 1 - cpd.crackAmount * 0.12;
                var cm = pieces[ci];
                var gc = cpd.geomCenter;
                var os = cpd.origLocalScale;
                cm.scale.set(os.x * f, os.y * f, os.z * f);
                cm.position.set(
                    cpd.origLocalPos.x + os.x * gc.x * (1 - f),
                    cpd.origLocalPos.y + os.y * gc.y * (1 - f),
                    cpd.origLocalPos.z + os.z * gc.z * (1 - f)
                );
            }
        }

        /* trigger collapse – starts the progressive wave */
        if (magnitude >= COLLAPSE_THRESHOLD && !collapsed && simElapsed > 1.2) {
            startCollapse();
        }

        /* progressive collapse wave – hybrid: wave + crack damage */
        if (collapsed && collapseWaveY > collapseWaveFloor) {
            collapseWaveY -= collapseWaveSpeed * DT;
            for (var wi = 0; wi < pieces.length; wi++) {
                var pd = pieceData[wi];
                if (pd.detached) continue;
                /* detach when wave reaches AND piece is cracked enough */
                if (pd.origPos.y >= collapseWaveY && pd.crackAmount > 0.1) {
                    detachPiece(wi);
                }
                /* heavily cracked pieces break off before the wave */
                else if (pd.crackAmount > 0.55) {
                    detachPiece(wi);
                }
            }
        }

        /* keep shaking floor during collapse */
        if (collapsed) {
            var shakeDecay = Math.max(0, 1 - (simElapsed - collapseStartTime) / (duration * 0.6));
            var dxc = Math.sin(simElapsed * freq1) * shakeIntensity * 0.5 * shakeDecay;
            var dzc = Math.cos(simElapsed * freq2) * shakeIntensity * 0.35 * shakeDecay;
            modelGroup.position.x = dxc;
            modelGroup.position.z = dzc;
            if (groundMesh) {
                groundMesh.position.x = dxc * 0.3;
                groundMesh.position.z = dzc * 0.3;
            }
            var accelC = Math.sin(simElapsed * freq1) * shakeIntensity * shakeDecay;
            shakeData.push(accelC);
            if (shakeData.length > SHAKE_MAX) shakeData.shift();

            /* Track shake energy during collapse */
            var collapseShakeSpeed = Math.sqrt(dxc * dxc + dzc * dzc) / DT;
            if (collapseShakeSpeed > peakVelocity) peakVelocity = collapseShakeSpeed;
        }

        /* damage heatmap */
        updateDamageHeatmap(shakeIntensity);

        /* animate detached pieces – all in WORLD space now */
        if (collapsed) {
            var frameKE = 0;
            for (var pi = 0; pi < pieces.length; pi++) {
                var pd = pieceData[pi];
                if (!pd.detached || pd.grounded) continue;
                var mesh = pieces[pi];

                /* gravity */
                pd.velocity.y += GRAVITY * DT;

                /* integrate position (world space) */
                mesh.position.x += pd.velocity.x * DT;
                mesh.position.y += pd.velocity.y * DT;
                mesh.position.z += pd.velocity.z * DT;

                /* slow rotation */
                mesh.rotation.x += pd.angVel.x * DT;
                mesh.rotation.z += pd.angVel.z * DT;

                /* air drag */
                pd.velocity.x *= 0.999;
                pd.velocity.z *= 0.999;

                /* track stats — keep peak KE */
                var speed = pd.velocity.length();
                if (speed > peakVelocity) peakVelocity = speed;
                frameKE += 0.5 * speed * speed;

                /* ground collision – position.y IS world Y now */
                if (mesh.position.y <= 0.02) {
                    mesh.position.y = 0.02;
                    if (pd.velocity.y < -0.8) {
                        /* bounce */
                        pd.velocity.y *= -0.08;
                        pd.velocity.x *= 0.6;
                        pd.velocity.z *= 0.6;
                        pd.angVel.multiplyScalar(0.3);
                        /* dust on impact */
                        if (dustCanvas && camera) {
                            var sp = new THREE.Vector3(mesh.position.x, 0.1, mesh.position.z).project(camera);
                            spawnDust((sp.x * 0.5 + 0.5) * dustCanvas.width, (-sp.y * 0.5 + 0.5) * dustCanvas.height, 5);
                        }
                    } else {
                        /* friction-based settling */
                        pd.velocity.y = 0;
                        pd.velocity.x *= 0.90;
                        pd.velocity.z *= 0.90;
                        pd.angVel.multiplyScalar(0.88);
                        if (Math.abs(pd.velocity.x) < 0.04 && Math.abs(pd.velocity.z) < 0.04 &&
                            pd.angVel.length() < 0.05) {
                            pd.velocity.set(0, 0, 0);
                            pd.angVel.set(0, 0, 0);
                            pd.grounded = true;
                        }
                    }
                }
            }
            if (frameKE > peakKineticEnergy) peakKineticEnergy = frameKE;
        }

        /* dust during shaking (pre-collapse) */
        if (simRunning && !collapsed && magnitude >= 6) {
            if (Math.random() < magnitude * 0.02) {
                var sw = dustCanvas ? dustCanvas.width : 600;
                var sh = dustCanvas ? dustCanvas.height : 420;
                spawnDust(sw * 0.3 + Math.random() * sw * 0.4, sh * 0.5 + Math.random() * sh * 0.3, 2);
            }
        }

        /* record replay frame */
        if (collapsed) {
            var frameState = [];
            for (var fi = 0; fi < pieces.length; fi++) {
                var m = pieces[fi];
                frameState.push({
                    px: m.position.x, py: m.position.y, pz: m.position.z,
                    rx: m.rotation.x, ry: m.rotation.y, rz: m.rotation.z
                });
            }
            replayFrames.push(frameState);
        }

        updateDust();
        drawShakeTimeline();
        updateStatsPanel();

        /* Don't end if pieces are still falling */
        if (simElapsed >= duration) {
            if (collapsed) {
                var allSettled = true;
                for (var si = 0; si < pieceData.length; si++) {
                    if (pieceData[si].detached && !pieceData[si].grounded) { allSettled = false; break; }
                }
                if (allSettled) finishSim();
            } else {
                finishSim();
            }
        }
    }

    var collapseStartTime = 0;
    var collapseWaveFloor = 0;

    function startCollapse() {
        collapsed = true;
        collapseStartTime = simElapsed;
        statusBadge.textContent = "COLLAPSE";
        stateValue.textContent = "Collapsing!";

        if (!modelBBox) return;
        var bboxSize = modelBBox.getSize(new THREE.Vector3());

        /* Wave sweeps from top to bottom over ~3 seconds */
        collapseWaveY = modelBBox.max.y + 0.1;
        collapseWaveFloor = modelBBox.min.y - 1;
        collapseWaveSpeed = bboxSize.y / (4.0 - crackHeight * 2.0);

        console.info('[Collapse] Progressive collapse: top=' + collapseWaveY.toFixed(2) +
            ', floor=' + collapseWaveFloor.toFixed(2) + ', speed=' + collapseWaveSpeed.toFixed(2));
    }

    function detachPiece(index) {
        var mesh = pieces[index];
        var pd = pieceData[index];
        pd.detached = true;

        /* Reparent mesh to SCENE in world coordinates */
        mesh.updateWorldMatrix(true, false);
        var wp = new THREE.Vector3();
        var wq = new THREE.Quaternion();
        var ws = new THREE.Vector3();
        mesh.matrixWorld.decompose(wp, wq, ws);

        /* Remove from model hierarchy */
        mesh.parent.remove(mesh);

        /* Set world transform directly */
        mesh.position.copy(wp);
        mesh.quaternion.copy(wq);
        mesh.scale.copy(ws);

        /* Add to scene root – now position IS world position */
        scene.add(mesh);

        /* Collapse velocity: DOWN + inherit building shake momentum */
        var lateral = 0.15 + Math.random() * 0.3;
        var shakeFreq1 = 8 + magnitude * 0.5;
        var shakeFreq2 = 5.3 + magnitude * 0.3;
        var shakeVx = Math.cos(simElapsed * shakeFreq1) * magnitude * 0.012;
        var shakeVz = -Math.sin(simElapsed * shakeFreq2) * magnitude * 0.009;
        pd.velocity.set(
            (Math.random() - 0.5) * lateral + shakeVx,
            -0.3 - Math.random() * 0.6,
            (Math.random() - 0.5) * lateral + shakeVz
        );
        pd.detachTime = simElapsed;
        pd.angVel.set(
            (Math.random() - 0.5) * 0.8,
            (Math.random() - 0.5) * 0.3,
            (Math.random() - 0.5) * 0.8
        );

        /* dust puff at detach point */
        if (dustCanvas && camera) {
            var sp = wp.clone().project(camera);
            var cx = (sp.x * 0.5 + 0.5) * dustCanvas.width;
            var cy = (-sp.y * 0.5 + 0.5) * dustCanvas.height;
            spawnDust(cx, cy, 3);
        }
    }

    function finishSim() {
        simRunning = false;

        /* Compute average damage from actual piece simulation data */
        var avgDamage = 0;
        if (pieceData.length > 0) {
            for (var di = 0; di < pieceData.length; di++) avgDamage += pieceData[di].damage;
            avgDamage /= pieceData.length;
        }

        var state, cls;
        if (collapsed) { state = "Collapsed"; cls = "high"; }
        else if (avgDamage > 0.5) { state = "Heavy Damage"; cls = "moderate"; }
        else if (avgDamage > 0.15) { state = "Moderate Damage"; cls = "moderate"; }
        else { state = "Minor / None"; cls = "low"; }

        stateValue.textContent = state;
        stateRating.innerHTML = '<span class="rating-badge ' + cls + '">' + (cls === "high" ? "Collapse" : cls === "moderate" ? "Damaged" : "Safe") + '</span>';
        statusBadge.textContent = "Done";
        simStatus.textContent = "Simulation complete \u2013 " + state;

        /* Expose state for Report tab */
        var dmgIdx = collapsed ? Math.round(75 + avgDamage * 25) : Math.round(avgDamage * 70);
        window._collapseState = {
            magnitude: magnitude,
            pga: Math.pow(magnitude / 10, 2) * 0.6,
            damageIndex: dmgIdx,
            maxDrift: collapsed ? 4.5 : avgDamage * 3.0,
            maxAccel: Math.pow(magnitude / 10, 2) * 0.8,
            stories: pieces.length || 33,
            material: "Cell-Fracture (GLB)"
        };

        if (!collapsed && modelGroup) modelGroup.position.set(0, 0, 0);
        if (groundMesh) groundMesh.position.set(0, 0, 0);

        /* show replay button if there was a collapse */
        if (collapsed && replayFrames.length > 0 && replayBtn) {
            replayBtn.style.display = "inline-flex";
        }

        updateStatsPanel();
    }

    /* ═══════════════════════════════════════════════════
       Slow-Mo Replay
       ═══════════════════════════════════════════════════ */
    function startReplay() {
        if (replayFrames.length === 0) return;
        replayMode = true;
        replayIdx = 0;
        statusBadge.textContent = "Replay";
        simStatus.textContent = "Slow-motion replay...";
    }

    function stepReplay() {
        if (!replayMode || replayFrames.length === 0) return;

        var frame = replayFrames[replayIdx];
        if (!frame) { stopReplay(); return; }

        pieces.forEach(function (mesh, i) {
            if (i < frame.length) {
                mesh.position.x = frame[i].px;
                mesh.position.y = frame[i].py;
                mesh.position.z = frame[i].pz;
                mesh.rotation.x = frame[i].rx;
                mesh.rotation.y = frame[i].ry;
                mesh.rotation.z = frame[i].rz;
            }
        });

        /* advance slowly */
        replayIdx += Math.max(1, Math.round(1 / REPLAY_SLOW));
        if (replayIdx >= replayFrames.length) stopReplay();
    }

    function stopReplay() {
        replayMode = false;
        statusBadge.textContent = "Done";
        simStatus.textContent = "Replay finished";
    }

    /* ═══════════════════════════════════════════════════
       Stats Panel
       ═══════════════════════════════════════════════════ */
    function updateStatsPanel() {
        var elTotal = $("cs-pieces-total");
        var elDetached = $("cs-pieces-detached");
        var elGrounded = $("cs-pieces-grounded");
        var elMaxV = $("cs-max-velocity");
        var elEnergy = $("cs-energy");
        var elCrack = $("cs-crack-pct");

        if (elTotal) elTotal.textContent = pieces.length || "\u2014";

        var detached = 0, grounded = 0;
        pieceData.forEach(function (pd) {
            if (pd.detached) detached++;
            if (pd.grounded) grounded++;
        });

        if (elDetached) elDetached.textContent = detached || "\u2014";
        if (elGrounded) elGrounded.textContent = grounded || "\u2014";
        if (elMaxV) elMaxV.textContent = peakVelocity > 0 ? peakVelocity.toFixed(1) : "\u2014";
        if (elEnergy) elEnergy.textContent = peakKineticEnergy > 0.001 ? peakKineticEnergy.toFixed(2) : "\u2014";
        if (elCrack) elCrack.textContent = Math.round(crackHeight * 100) + "%";
    }

    /* ═══════════════════════════════════════════════════
       Reset
       ═══════════════════════════════════════════════════ */
    function resetAll() {
        simRunning = false;
        simElapsed = 0;
        collapsed = false;
        replayMode = false;
        replayFrames = [];
        peakVelocity = 0;
        peakKineticEnergy = 0;
        shakeData = [];
        dustParticles = [];

        /* Remove detached pieces from scene (they were reparented during collapse) */
        for (var ri = 0; ri < pieces.length; ri++) {
            if (pieceData[ri] && pieceData[ri].detached) {
                scene.remove(pieces[ri]);
            }
        }

        if (modelGroup) {
            scene.remove(modelGroup);
            modelGroup = null;
        }
        pieces = [];
        pieceData = [];
        modelBBox = null;

        if (groundMesh) groundMesh.position.set(0, 0, 0);

        resultBar.style.display = "none";
        statusBadge.textContent = "Ready";
        simStatus.textContent = "Magnitude threshold: " + COLLAPSE_THRESHOLD;
        if (replayBtn) replayBtn.style.display = "none";
        if (heatmapLegend) heatmapLegend.style.display = "none";

        updateStatsPanel();
        drawShakeTimeline();
        if (dustCtx && dustCanvas) dustCtx.clearRect(0, 0, dustCanvas.width, dustCanvas.height);

        loadModel(lastModelUrl || "project1.glb");
    }

    /* ═══════════════════════════════════════════════════
       Render loop
       ═══════════════════════════════════════════════════ */
    function tick() {
        requestAnimationFrame(tick);

        if (replayMode) {
            stepReplay();
        } else {
            stepSimulation();
        }

        controls && controls.update();
        renderer && renderer.render(scene, camera);
    }

    /* ═══════════════════════════════════════════════════
       Wire controls
       ═══════════════════════════════════════════════════ */
    function wireControls() {
        if (magSlider) magSlider.addEventListener("input", function () {
            magnitude = parseFloat(magSlider.value);
            magVal.textContent = magnitude.toFixed(1);
        });
        if (durSlider) durSlider.addEventListener("input", function () {
            duration = parseFloat(durSlider.value);
            durVal.textContent = duration;
        });
        if (crackSlider) crackSlider.addEventListener("input", function () {
            crackHeight = parseFloat(crackSlider.value);
            crackVal.textContent = Math.round(crackHeight * 100);
        });
        if (runBtn) runBtn.addEventListener("click", startSim);
        if (resetBtn) resetBtn.addEventListener("click", resetAll);
        if (replayBtn) replayBtn.addEventListener("click", startReplay);
    }

    /* ═══════════════════════════════════════════════════
       Public init
       ═══════════════════════════════════════════════════ */
    window.initCollapseTab = function () {
        if (inited) return;
        inited = true;
        console.info('[Collapse] Initializing...');
        resolveDOM();
        if (!canvas || !container) {
            console.error('[Collapse] DOM elements not found, aborting');
            inited = false;
            return;
        }
        initScene();
        initDust();
        initShakeCanvas();
        wireControls();
        loadModel("project1.glb");
    };
})();
