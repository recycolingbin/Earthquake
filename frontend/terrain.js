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
        controls.target.set(0, 0, 0);
        controls.update();

        // Lights
        const amb = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(amb);
        const dir = new THREE.DirectionalLight(0xffffff, 1.0);
        dir.position.set(60, 80, 40);
        scene.add(dir);

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
                const dist = maxDim * 1.5;

                controls.target.copy(center);
                camera.position.set(
                    center.x + dist * 0.5,
                    center.y + size.y * 1.2 + dist * 0.4,
                    center.z + dist * 0.5
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
})();
