const noise = new SimplexNoise();

let scene, camera, renderer, controls, group;
let ball, particles;

init();
animate();

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  camera.position.set(0, 25, 110);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x000000, 1);
  document.getElementById("canvas-container").appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.9;
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 0.7;
  controls.minDistance = 20;
  controls.maxDistance = 500;
  controls.enablePan = true;

  group = new THREE.Group();
  group.position.set(35, 0, 0);
  scene.add(group);

  // Create noise ball
  var ballGeo = new THREE.IcosahedronGeometry(15, 20);
  var ballMat = new THREE.MeshBasicMaterial({
    color: 0xb0b0b0,
    wireframe: true,
    transparent: true,
    opacity: 0.7
  });
  ball = new THREE.Mesh(ballGeo, ballMat);
  group.add(ball);

  // Create particles - larger and brighter
  var particleCount = 2000;
  var particleGeo = new THREE.BufferGeometry();
  var positions = new Float32Array(particleCount * 3);
  var colors = new Float32Array(particleCount * 3);

  for (var i = 0; i < particleCount; i++) {
    var i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 400;
    positions[i3 + 1] = (Math.random() - 0.5) * 400;
    positions[i3 + 2] = (Math.random() - 0.5) * 400;
    colors[i3] = 0.2 + Math.random() * 0.3;
    colors[i3 + 1] = 0.5 + Math.random() * 0.4;
    colors[i3 + 2] = 0.8 + Math.random() * 0.2;
  }

  particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  var particleMat = new THREE.PointsMaterial({
    size: 0.6,
    vertexColors: true,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });

  particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  var light = new THREE.PointLight(0x38bdf8, 1.5, 800);
  light.position.set(80, 120, 100);
  scene.add(light);

  window.addEventListener("resize", onResize);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

var noiseOffset = 0;
var particleCount = 2000;

function animate() {
  requestAnimationFrame(animate);

  var t = performance.now() * 0.001;
  noiseOffset += 0.002;

  group.rotation.y += 0.001;
  deformBall(ball, t);

  // Animate particles
  var posArray = particles.geometry.attributes.position.array;
  for (var j = 0; j < particleCount; j++) {
    var j3 = j * 3;
    posArray[j3 + 1] += Math.sin(noiseOffset + posArray[j3] * 0.003) * 0.05;
    posArray[j3] += Math.cos(noiseOffset + posArray[j3 + 2] * 0.003) * 0.03;
  }
  particles.geometry.attributes.position.needsUpdate = true;
  particles.rotation.y += 0.0002;
  particles.rotation.x += 0.0001;

  controls.update();
  renderer.render(scene, camera);
}

function deformBall(mesh, time) {
  var pos = mesh.geometry.attributes.position;
  var radius = 35;

  for (var i = 0; i < pos.count; i++) {
    var x = pos.getX(i);
    var y = pos.getY(i);
    var z = pos.getZ(i);

    var len = Math.hypot(x, y, z) || 1;
    var nx = x / len;
    var ny = y / len;
    var nz = z / len;

    var n = noise.noise3D(
      nx * 2.1 + time * 0.085,
      ny * 1.1 + time * 0.12,
      nz * 1.7 + time * 0.095
    );

    var scale = 1 + n * 0.11;

    pos.setXYZ(i, nx * radius * scale, ny * radius * scale, nz * radius * scale);
  }

  pos.needsUpdate = true;
  mesh.geometry.computeVertexNormals();
}
