/* terrain.js – loads tibetmodel.glb into the Terrain tab */
(function () {
    let renderer, scene, camera, controls, frameId;
    const canvas = document.getElementById('terrain-canvas');
    const wrap = document.getElementById('terrain-viewer-wrap');
    const loadingEl = document.getElementById('terrain-loading');
    if (!canvas || !wrap) return;

    function init() {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0d0d0d);

        renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.4;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        resize();

        camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 5000);
        camera.position.set(50, 40, 50);

        controls = new THREE.OrbitControls(camera, canvas);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.minDistance = 5;
        controls.maxDistance = 2000;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 1.0;
        controls.target.set(0, 0, 0);
        controls.update();

        // Lights
        const amb = new THREE.AmbientLight(0xffffff, 1.2);
        scene.add(amb);
        const hemi = new THREE.HemisphereLight(0xffffff, 0x303040, 1.0);
        scene.add(hemi);
        const dir = new THREE.DirectionalLight(0xffffff, 2.5);
        dir.position.set(60, 80, 40);
        scene.add(dir);
        const fill = new THREE.DirectionalLight(0xaabbcc, 1.0);
        fill.position.set(-40, 50, -30);
        scene.add(fill);

        loadModel();
        animate();
    }

    function loadModel() {
        const loader = new THREE.GLTFLoader();
        const dracoLoader = new THREE.DRACOLoader();
        dracoLoader.setDecoderPath('lib/draco/');
        loader.setDRACOLoader(dracoLoader);

        loader.load(
            'tibetmodel.glb',
            function (gltf) {
                const model = gltf.scene;

                // Debug: log model hierarchy to console
                console.log('GLB loaded. Child count:', model.children.length);
                model.traverse(function (child) {
                    if (child.isMesh) {
                        console.log('  Mesh:', child.name,
                            'geo verts:', child.geometry?.attributes?.position?.count,
                            'material:', child.material?.name || child.material?.type);
                        // Ensure meshes receive and cast shadows
                        child.castShadow = true;
                        child.receiveShadow = true;
                        // Fix double-sided rendering for imported models
                        if (child.material) {
                            child.material.side = THREE.DoubleSide;
                            child.material.transparent = true;
                            child.material.opacity = 1.0;
                        }
                    }
                });

                scene.add(model);

                // Auto-fit camera to model bounds
                const box = new THREE.Box3().setFromObject(model);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());

                console.log('Model bounds — center:', center, 'size:', size);

                const maxDim = Math.max(size.x, size.y, size.z);
                const dist = maxDim * 0.6;

                controls.target.copy(center);
                camera.position.set(
                    center.x + dist * 0.8,
                    center.y * 0.1 + size.y * 0.1 + dist * 0.1,
                    center.z + dist * 0.8
                );
                controls.update();

                camera.near = maxDim * 0.001;
                camera.far = maxDim * 20;
                camera.updateProjectionMatrix();

                // Update shadow camera to cover model
                scene.traverse(function (child) {
                    if (child.isDirectionalLight && child.castShadow) {
                        child.shadow.camera.left = -maxDim;
                        child.shadow.camera.right = maxDim;
                        child.shadow.camera.top = maxDim;
                        child.shadow.camera.bottom = -maxDim;
                        child.shadow.camera.far = maxDim * 5;
                        child.shadow.camera.updateProjectionMatrix();
                        child.position.set(
                            center.x + maxDim,
                            center.y + maxDim * 1.5,
                            center.z + maxDim * 0.5
                        );
                        child.target.position.copy(center);
                    }
                });

                if (loadingEl) loadingEl.style.display = 'none';

                // Wire up opacity slider
                var opSlider = document.getElementById('terrain-opacity-slider');
                var opVal = document.getElementById('terrain-opacity-val');
                if (opSlider) {
                    opSlider.addEventListener('input', function () {
                        var v = parseFloat(opSlider.value);
                        model.traverse(function (c) {
                            if (c.isMesh && c.material) {
                                c.material.opacity = v;
                            }
                        });
                        if (opVal) opVal.textContent = Math.round(v * 100) + '%';
                    });
                }

                tameImportedLights(model);
                initSectionViews(model, box, center, size);
            },
            undefined,
            function (err) {
                console.error('Failed to load tibetmodel.glb:', err);
                if (loadingEl) loadingEl.textContent = 'Failed to load 3D model.';
            }
        );
    }

    function resize() {
        if (!renderer) return;
        const w = wrap.clientWidth;
        const h = wrap.clientHeight || 500;
        renderer.setSize(w, h, false);
        if (camera) {
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        }
    }

    function animate() {
        frameId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }

    window.addEventListener('resize', resize);

    // ResizeObserver for container size changes
    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(resize).observe(wrap);
    }

    // Expose global init hook — called by main.js when terrain tab activates
    let started = false;
    window.initTerrainTab = function () {
        if (started) return;
        started = true;
        init();
    };

    /* Scale down imported PointLight / SpotLight so Blender candela values
       don't blow out the scene in the legacy Three.js light pipeline. */
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

    /* ═══════════════════════════════════════════════════
       Cross-section views (Section X & Section Y)
       Two small renderers each showing the model sliced
       by a movable clipping plane.
       ═══════════════════════════════════════════════════ */
    function initSectionViews(sourceModel, bbox, center, size) {
        var configs = [
            {
                canvasId: 'section-x-canvas', sliderId: 'section-x-slider', valueId: 'section-x-val',
                axis: 'x', normal: new THREE.Vector3(-1, 0, 0)
            },
            {
                canvasId: 'section-y-canvas', sliderId: 'section-y-slider', valueId: 'section-y-val',
                axis: 'z', normal: new THREE.Vector3(0, 0, -1)
            }
        ];

        configs.forEach(function (cfg) {
            var cvs = document.getElementById(cfg.canvasId);
            if (!cvs) return;

            var sScene = new THREE.Scene();
            sScene.background = new THREE.Color(0x0d0d0d);

            var sRenderer = new THREE.WebGLRenderer({ canvas: cvs, antialias: true });
            sRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            sRenderer.toneMapping = THREE.ACESFilmicToneMapping;
            sRenderer.toneMappingExposure = 1.4;
            sRenderer.localClippingEnabled = true;

            var w = cvs.clientWidth || 400;
            var h = cvs.clientHeight || 300;
            sRenderer.setSize(w, h, false);

            var sCamera = new THREE.PerspectiveCamera(45, w / h, 0.1, 5000);
            var maxDim = Math.max(size.x, size.y, size.z);
            var dist = maxDim * 0.375;

            if (cfg.axis === 'x') {
                sCamera.position.set(center.x + dist, center.y, center.z);
            } else {
                sCamera.position.set(center.x, center.y, center.z + dist);
            }
            sCamera.near = maxDim * 0.001;
            sCamera.far = maxDim * 20;
            sCamera.updateProjectionMatrix();

            var sControls = new THREE.OrbitControls(sCamera, cvs);
            sControls.target.copy(center);
            sControls.enableDamping = true;
            sControls.update();

            // Lighting
            sScene.add(new THREE.AmbientLight(0xffffff, 0.6));
            var sDir = new THREE.DirectionalLight(0xffffff, 1.0);
            sDir.position.set(center.x + maxDim, center.y + maxDim, center.z + maxDim);
            sScene.add(sDir);
            var sBack = new THREE.DirectionalLight(0x8899bb, 0.4);
            sBack.position.set(center.x - maxDim, center.y + maxDim * 0.5, center.z - maxDim);
            sScene.add(sBack);

            // Clipping plane
            var clipVal = cfg.axis === 'x' ? center.x : center.z;
            var clipPlane = new THREE.Plane(cfg.normal.clone(), clipVal);

            // Clone model and apply clipping to materials
            var clonedModel = sourceModel.clone(true);
            clonedModel.traverse(function (child) {
                if (child.isMesh && child.material) {
                    child.material = child.material.clone();
                    child.material.clippingPlanes = [clipPlane];
                    child.material.clipShadows = true;
                    child.material.side = THREE.DoubleSide;
                }
            });
            sScene.add(clonedModel);

            // Slider
            var slider = document.getElementById(cfg.sliderId);
            var valDisp = document.getElementById(cfg.valueId);
            if (slider) {
                var minV = cfg.axis === 'x' ? bbox.min.x : bbox.min.z;
                var maxV = cfg.axis === 'x' ? bbox.max.x : bbox.max.z;
                slider.min = minV;
                slider.max = maxV;
                slider.step = ((maxV - minV) / 100).toFixed(4);
                slider.value = (minV + maxV) / 2;
                if (valDisp) valDisp.textContent = Number(slider.value).toFixed(1);

                slider.addEventListener('input', function () {
                    clipPlane.constant = parseFloat(slider.value);
                    if (valDisp) valDisp.textContent = parseFloat(slider.value).toFixed(1);
                });
            }

            // Render loop
            (function animateSection() {
                requestAnimationFrame(animateSection);
                sControls.update();
                sRenderer.render(sScene, sCamera);
            })();

            // Resize
            function resizeSection() {
                var sw = cvs.clientWidth || 400;
                var sh = cvs.clientHeight || 300;
                sRenderer.setSize(sw, sh, false);
                sCamera.aspect = sw / sh;
                sCamera.updateProjectionMatrix();
            }
            window.addEventListener('resize', resizeSection);
        });
    }
})();
