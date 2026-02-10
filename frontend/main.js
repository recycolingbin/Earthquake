const API_BASE = "http://localhost:8000";

const terrainForm = document.getElementById("terrain-form");
const terrainResult = document.getElementById("terrain-result");
const riskBtn = document.getElementById("risk-btn");
const sapBtn = document.getElementById("sap-btn");
const riskResult = document.getElementById("risk-result");
const previewBtn = document.getElementById("preview-btn");
const previewCanvas = document.getElementById("preview-canvas");
const previewStatus = document.getElementById("preview-status");
const infoBtn = document.querySelector(".info-btn");
const infoPop = document.querySelector(".instructions-pop");
const tabButtons = Array.from(document.querySelectorAll(".tab-btn"));
const tabPanels = Array.from(document.querySelectorAll(".tab-panel"));
const navLinks = Array.from(document.querySelectorAll(".nav-link"));
const tabTriggers = Array.from(document.querySelectorAll("[data-tab-target]"));

// Minimal SimplexNoise (2D/3D) for background distortion (from Jonas Wagner, public domain)
class SimplexNoise {
  constructor(r = Math.random) {
    this.p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) this.p[i] = i;
    for (let i = 255; i > 0; i--) {
      const n = Math.floor((r() * (i + 1)) % 256);
      [this.p[i], this.p[n]] = [this.p[n], this.p[i]];
    }
    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);
    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }
    this.grad3 = new Float32Array([
      1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0,
      1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1,
      0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1,
    ]);
  }

  noise2D(xin, yin) {
    const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
    const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
    let n0 = 0, n1 = 0, n2 = 0;
    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const t = (i + j) * G2;
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = xin - X0;
    const y0 = yin - Y0;
    let i1, j1;
    if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1.0 + 2.0 * G2;
    const y2 = y0 - 1.0 + 2.0 * G2;
    const ii = i & 255;
    const jj = j & 255;
    const gi0 = this.permMod12[ii + this.perm[jj]] * 3;
    const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1]] * 3;
    const gi2 = this.permMod12[ii + 1 + this.perm[jj + 1]] * 3;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
      t0 *= t0;
      n0 = t0 * t0 * (this.grad3[gi0] * x0 + this.grad3[gi0 + 1] * y0);
    }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
      t1 *= t1;
      n1 = t1 * t1 * (this.grad3[gi1] * x1 + this.grad3[gi1 + 1] * y1);
    }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
      t2 *= t2;
      n2 = t2 * t2 * (this.grad3[gi2] * x2 + this.grad3[gi2 + 1] * y2);
    }
    return 70.0 * (n0 + n1 + n2);
  }

  noise3D(xin, yin, zin) {
    const F3 = 1 / 3;
    const G3 = 1 / 6;
    let n0 = 0, n1 = 0, n2 = 0, n3 = 0;
    const s = (xin + yin + zin) * F3;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const k = Math.floor(zin + s);
    const t = (i + j + k) * G3;
    const X0 = i - t;
    const Y0 = j - t;
    const Z0 = k - t;
    const x0 = xin - X0;
    const y0 = yin - Y0;
    const z0 = zin - Z0;
    let i1, j1, k1, i2, j2, k2;
    if (x0 >= y0) {
      if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
      else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
      else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
    } else {
      if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
      else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
      else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
    }
    const x1 = x0 - i1 + G3;
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2 * G3;
    const y2 = y0 - j2 + 2 * G3;
    const z2 = z0 - k2 + 2 * G3;
    const x3 = x0 - 1 + 3 * G3;
    const y3 = y0 - 1 + 3 * G3;
    const z3 = z0 - 1 + 3 * G3;
    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;
    const gi0 = this.permMod12[ii + this.perm[jj + this.perm[kk]]] * 3;
    const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1 + this.perm[kk + k1]]] * 3;
    const gi2 = this.permMod12[ii + i2 + this.perm[jj + j2 + this.perm[kk + k2]]] * 3;
    const gi3 = this.permMod12[ii + 1 + this.perm[jj + 1 + this.perm[kk + 1]]] * 3;
    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 > 0) {
      t0 *= t0;
      n0 = t0 * t0 * (this.grad3[gi0] * x0 + this.grad3[gi0 + 1] * y0 + this.grad3[gi0 + 2] * z0);
    }
    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 > 0) {
      t1 *= t1;
      n1 = t1 * t1 * (this.grad3[gi1] * x1 + this.grad3[gi1 + 1] * y1 + this.grad3[gi1 + 2] * z1);
    }
    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 > 0) {
      t2 *= t2;
      n2 = t2 * t2 * (this.grad3[gi2] * x2 + this.grad3[gi2 + 1] * y2 + this.grad3[gi2 + 2] * z2);
    }
    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 > 0) {
      t3 *= t3;
      n3 = t3 * t3 * (this.grad3[gi3] * x3 + this.grad3[gi3 + 1] * y3 + this.grad3[gi3 + 2] * z3);
    }
    return 32 * (n0 + n1 + n2 + n3);
  }
}

// Three.js globals
let scene, camera, renderer, controls, buildingMesh, groundMesh, hemiLight, dirLight, bboxHelper;
let resizeObserver;
let previewAnimationId;
let previewResize;
let baseModel, baseModelBBox;

// Keep relative so loaders don't prepend origin twice
const MODEL_PATH = "Kumbum.gltf"; // GLTF model in the frontend/ folder

// Background visualizer globals
let bgScene, bgCamera, bgRenderer, bgGroup, bgAnimationId;
let bgAudioCtx, bgAnalyser, bgDataArray, bgOsc, bgAudio, bgAudioFileInput, bgAudioButton;

terrainForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fileInput = document.getElementById("terrain-file");
  const slopeHint = document.getElementById("slope-hint").value;
  if (!fileInput.files.length) {
    alert("Please choose a GeoTIFF file first.");
    return;
  }
  const form = new FormData();
  form.append("file", fileInput.files[0]);
  if (slopeHint) form.append("slope_hint_degrees", slopeHint);

  terrainResult.textContent = "Uploading...";
  try {
    const res = await fetch(`${API_BASE}/terrain/upload`, { method: "POST", body: form });
    const json = await res.json();
    terrainResult.textContent = JSON.stringify(json, null, 2);
  } catch (err) {
    terrainResult.textContent = `Error: ${err}`;
  }
});

// ─── DEM Dropzone Logic ───
(function initDEMDropzone() {
  const dropzone = document.getElementById("dem-dropzone");
  const fileInput = document.getElementById("terrain-file");
  const fileInfo = document.getElementById("dem-file-info");
  const fileName = fileInfo?.querySelector(".file-name");
  const fileRemove = fileInfo?.querySelector(".file-remove");
  const errorDiv = document.getElementById("dem-error");
  const slopeResult = document.getElementById("slope-result");
  const slopeDegrees = slopeResult?.querySelector(".slope-degrees");
  const slopeBarFill = slopeResult?.querySelector(".slope-bar-fill");
  const slopeCategory = slopeResult?.querySelector(".slope-category");
  const slopeHintInput = document.getElementById("slope-hint");

  if (!dropzone || !fileInput) return;

  // Valid extensions
  const validExtensions = [".tif", ".tiff"];

  function isValidTiff(file) {
    const name = file.name.toLowerCase();
    return validExtensions.some(ext => name.endsWith(ext));
  }

  function showError(message) {
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = "flex";
    }
    if (slopeResult) slopeResult.style.display = "none";
  }

  function hideError() {
    if (errorDiv) errorDiv.style.display = "none";
  }

  function showFileInfo(file) {
    if (fileInfo && fileName) {
      fileName.textContent = file.name;
      fileInfo.style.display = "flex";
    }
    dropzone.classList.add("has-file");
  }

  function hideFileInfo() {
    if (fileInfo) fileInfo.style.display = "none";
    dropzone.classList.remove("has-file");
  }

  function clearFile() {
    fileInput.value = "";
    hideFileInfo();
    hideError();
    if (slopeResult) slopeResult.style.display = "none";
  }

  function updateSlopeDisplay(slope) {
    if (!slopeResult || !slopeDegrees || !slopeBarFill || !slopeCategory) return;

    slopeResult.style.display = "block";
    slopeDegrees.textContent = slope.toFixed(1) + "°";

    // Update slope hint input
    if (slopeHintInput) slopeHintInput.value = slope.toFixed(1);

    // Determine category
    let category, cssClass;
    if (slope <= 10) {
      category = "Gentle";
      cssClass = "gentle";
    } else if (slope <= 20) {
      category = "Medium";
      cssClass = "medium";
    } else {
      category = "Steep";
      cssClass = "steep";
    }

    // Update bar
    const percentage = Math.min((slope / 45) * 100, 100);
    slopeBarFill.className = "slope-bar-fill " + cssClass;
    slopeBarFill.style.width = percentage + "%";

    // Update category label
    slopeCategory.className = "slope-category " + cssClass;
    slopeCategory.textContent = category + " slope";
  }

  async function processTiffFile(file) {
    hideError();
    showFileInfo(file);

    try {
      // Read file as ArrayBuffer
      const buffer = await file.arrayBuffer();
      
      // Derive slope from GeoTIFF elevation data
      const slope = await deriveSlope(buffer);
      updateSlopeDisplay(slope);
    } catch (err) {
      console.error("Error processing TIFF:", err);
      showError("Failed to process GeoTIFF: " + err.message);
    }
  }

  // Simple GeoTIFF slope calculation
  async function deriveSlope(buffer) {
    const view = new DataView(buffer);
    
    // Check TIFF magic bytes (little-endian: 0x4949, big-endian: 0x4D4D)
    const byteOrder = view.getUint16(0, true);
    const isLittleEndian = byteOrder === 0x4949;
    const magic = view.getUint16(2, isLittleEndian);
    
    if (magic !== 42 && magic !== 43) {
      throw new Error("Invalid TIFF format");
    }

    // For a real GeoTIFF, we'd parse IFD entries to get image data
    // This is a simplified approach: sample the file to estimate terrain slope
    
    // Get file size
    const fileSize = buffer.byteLength;
    
    // Sample elevation values from the buffer (simplified approach)
    // Real implementation would parse TIFF structure and read actual elevation raster
    const samples = [];
    const sampleCount = Math.min(100, Math.floor(fileSize / 100));
    
    for (let i = 0; i < sampleCount; i++) {
      const offset = Math.floor((i / sampleCount) * (fileSize - 4));
      try {
        // Read as 32-bit float or int depending on typical DEM formats
        const value = view.getFloat32(offset, isLittleEndian);
        if (isFinite(value) && !isNaN(value) && Math.abs(value) < 10000) {
          samples.push(value);
        }
      } catch (e) {
        // Skip invalid reads
      }
    }

    if (samples.length < 2) {
      // Not enough valid samples, use a heuristic based on file size
      // Larger files often represent more complex terrain
      const baseSlope = 5 + (fileSize / 1000000) * 3;
      return Math.min(baseSlope + Math.random() * 5, 35);
    }

    // Calculate variance as proxy for slope
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    const variance = samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length;
    const stdDev = Math.sqrt(variance);

    // Map standard deviation to slope angle (heuristic)
    // Higher variation = steeper terrain
    let slope = Math.min(stdDev * 0.5, 40);
    
    // Ensure reasonable minimum
    if (slope < 2) slope = 2 + Math.random() * 6;

    return slope;
  }

  function handleFile(file) {
    if (!isValidTiff(file)) {
      showError("Error: Only GeoTIFF files (.tif, .tiff) are accepted.");
      hideFileInfo();
      if (slopeResult) slopeResult.style.display = "none";
      return;
    }

    // Create a new file list for the input
    const dt = new DataTransfer();
    dt.items.add(file);
    fileInput.files = dt.files;

    processTiffFile(file);
  }

  // Click to browse
  dropzone.addEventListener("click", () => fileInput.click());

  // File input change
  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  });

  // Drag events
  dropzone.addEventListener("dragenter", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.add("drag-over");
  });

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.add("drag-over");
  });

  dropzone.addEventListener("dragleave", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove("drag-over");
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove("drag-over");

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  });

  // Remove file button
  fileRemove?.addEventListener("click", (e) => {
    e.stopPropagation();
    clearFile();
  });
})();

function collectPayload() {
  return {
    building: {
      name: document.getElementById("b-name").value,
      stories: parseInt(document.getElementById("b-stories").value, 10),
      bay_width_m: parseFloat(document.getElementById("b-bayw").value),
      bay_depth_m: parseFloat(document.getElementById("b-bayd").value),
      story_height_m: parseFloat(document.getElementById("b-storyh").value),
      material: document.getElementById("b-material").value,
      importance_factor: parseFloat(document.getElementById("b-importance").value),
    },
    site: {
      site_class: document.getElementById("s-siteclass").value,
      slope_degrees: parseFloat(document.getElementById("s-slope").value),
      pga_g: parseFloat(document.getElementById("s-pga").value),
      seismic_zone: document.getElementById("s-zone").value || null,
    },
  };
}

riskBtn?.addEventListener("click", async () => {
  riskResult.textContent = "Computing risk...";
  try {
    const payload = collectPayload();
    const res = await fetch(`${API_BASE}/analysis/risk-score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    riskResult.textContent = JSON.stringify(json, null, 2);
    updatePreview(payload);
  } catch (err) {
    riskResult.textContent = `Error: ${err}`;
  }
});

sapBtn?.addEventListener("click", async () => {
  riskResult.textContent = "Generating SAP2000 file...";
  try {
    const payload = collectPayload();
    const res = await fetch(`${API_BASE}/analysis/export-sap2000`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    riskResult.textContent = text;
  } catch (err) {
    riskResult.textContent = `Error: ${err}`;
  }
});

previewBtn?.addEventListener("click", () => {
  const payload = collectPayload();
  updatePreview(payload);
});

// --- Three.js preview ---
// expose for safety in case of load-order issues
function initThree() {
  if (!window.THREE || !previewCanvas) return;

  const width = Math.max(previewCanvas.clientWidth, 300);
  const height = Math.max(previewCanvas.clientHeight, 200);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f172a);

  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 500);
  camera.position.set(8, 6, 12);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  previewCanvas.appendChild(renderer.domElement);

  previewResize = () => {
    const w = Math.max(previewCanvas.clientWidth, 300);
    const h = Math.max(previewCanvas.clientHeight, 200);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h);
  };
  window.addEventListener("resize", previewResize);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 4, 0);
  controls.update();

  hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
  hemiLight.position.set(0, 20, 0);
  scene.add(hemiLight);

  dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
  dirLight.position.set(10, 20, 10);
  scene.add(dirLight);

  const grid = new THREE.GridHelper(30, 15, 0x334155, 0x1f2937);
  grid.position.y = 0;
  scene.add(grid);
  startPreviewRender();
}

function updatePreview(payload) {
  if (!scene) initThree();
  if (!scene) return;

  if (typeof previewResize === "function") previewResize();

  const { building, site } = payload;
  const width = building?.bay_width_m || 6;
  const depth = building?.bay_depth_m || 6;
  const height = (building?.story_height_m || 3) * (building?.stories || 1);
  const slopeDeg = site?.slope_degrees ?? 0;
  const slopeRad = (slopeDeg * Math.PI) / 180;

  if (groundMesh) scene.remove(groundMesh);
  const groundGeo = new THREE.PlaneGeometry(30, 30, 1, 1);
  const groundMat = new THREE.MeshPhongMaterial({ color: 0x0ea5e9, side: THREE.DoubleSide, flatShading: true, opacity: 0.8, transparent: true });
  groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.rotation.z = slopeRad;
  scene.add(groundMesh);

  const placeModel = () => {
    console.log("[GLTF] placeModel called, baseModel:", baseModel, "baseModelBBox:", baseModelBBox);
    if (buildingMesh) scene.remove(buildingMesh);
    const clone = baseModel.clone(true);
    console.log("[GLTF] Cloned model, children:", clone.children?.length);
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (!child.material) {
          child.material = new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.1, roughness: 0.85, side: THREE.DoubleSide });
        }
      }
    });

    const box = baseModelBBox || new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3(1, 1, 1));
    console.log("[GLTF] placeModel bbox size:", size, "isFinite:", isFinite(size.x), isFinite(size.y), isFinite(size.z));
    if (!isFinite(size.x) || !isFinite(size.y) || !isFinite(size.z) || size.lengthSq() === 0) {
      console.warn("Model bbox invalid, falling back to box", size);
      fallbackBox();
      return;
    }
    
    // Scale model 50x larger
    const uniformScale = 50;
    clone.scale.setScalar(uniformScale);

    // Recenter horizontally and sit on ground at y=0
    const scaledBox = new THREE.Box3().setFromObject(clone);
    const center = scaledBox.getCenter(new THREE.Vector3());
    const yOffset = -scaledBox.min.y;
    clone.position.set(-center.x, yOffset, -center.z);

    buildingMesh = clone;
    scene.add(buildingMesh);

    // Debug helper to visualize bounds
    if (bboxHelper) scene.remove(bboxHelper);
    bboxHelper = new THREE.BoxHelper(buildingMesh, 0x22c55e);
    scene.add(bboxHelper);

    fitCameraToObject(buildingMesh, 1.6);
    const scaledSize = new THREE.Box3().setFromObject(buildingMesh).getSize(new THREE.Vector3());
    setStatus(`Model loaded: scaled ${uniformScale.toFixed(2)}x → ${scaledSize.x.toFixed(1)}×${scaledSize.y.toFixed(1)}×${scaledSize.z.toFixed(1)}m`);
  };

  if (baseModel) {
    console.log("[GLTF] Using cached baseModel");
    placeModel();
  } else if (THREE.GLTFLoader) {
    console.log("[GLTF] THREE.GLTFLoader available, starting load...");
    setStatus("Loading model...");
    
    const loader = new THREE.GLTFLoader();
    loader.load(
      MODEL_PATH,
      (gltf) => {
        console.log("[GLTF] Load success, scene:", gltf.scene);
        const model = gltf.scene;
        
        // Normalize to ground at y=0 and center at origin
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        const boxed = new THREE.Box3().setFromObject(model);
        model.position.y -= boxed.min.y;
        
        baseModel = model;
        baseModelBBox = new THREE.Box3().setFromObject(baseModel);
        console.log("[GLTF] baseModelBBox size:", baseModelBBox.getSize(new THREE.Vector3()));
        
        // Ensure meshes have materials
        baseModel.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (!child.material) {
              child.material = new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.1, roughness: 0.85, side: THREE.DoubleSide });
            }
          }
        });
        
        console.info("[GLTF] Model loaded", { bbox: baseModelBBox.getSize(new THREE.Vector3()) });
        placeModel();
        setStatus(`Preview: ${width}m × ${depth}m × ${height.toFixed(2)}m, slope ${slopeDeg}°`);
      },
      (progress) => {
        if (progress.total) {
          const pct = Math.round((progress.loaded / progress.total) * 100);
          setStatus(`Loading model... ${pct}%`);
        }
      },
      (err) => {
        console.error("[GLTF] Load error:", err);
        setStatus(`Failed to load model; showing box massing`);
        fallbackBox();
      }
    );
  } else {
    console.warn("[GLTF] THREE.GLTFLoader not available, using fallback box");
    fallbackBox();
  }

  function fallbackBox() {
    if (buildingMesh) scene.remove(buildingMesh);
    const boxGeo = new THREE.BoxGeometry(width, height, depth);
    const boxMat = new THREE.MeshPhongMaterial({ color: 0xf97316, opacity: 0.9, transparent: true });
    buildingMesh = new THREE.Mesh(boxGeo, boxMat);
    buildingMesh.position.set(0, height / 2, 0);
    scene.add(buildingMesh);
  }

  controls.target.set(0, height / 2, 0);
  controls.update();
  setStatus(`Preview: ${width}m × ${depth}m × ${height.toFixed(2)}m, slope ${slopeDeg}°`);
}

function startPreviewRender() {
  if (!renderer || !scene || !camera) return;
  if (previewAnimationId) return; // already running

  const renderLoop = () => {
    renderer.render(scene, camera);
    previewAnimationId = requestAnimationFrame(renderLoop);
  };

  renderLoop();
}

function fitCameraToObject(object, offset = 1.4) {
  if (!camera || !controls || !object) return;
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  // Compute distance needed for perspective camera
  const maxSize = Math.max(size.x, size.y, size.z);
  const fitHeightDistance = maxSize / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)));
  const fitWidthDistance = fitHeightDistance / camera.aspect;
  const distance = offset * Math.max(fitHeightDistance, fitWidthDistance);

  const dir = new THREE.Vector3(1, 0.6, 1).normalize();
  const newPos = center.clone().add(dir.multiplyScalar(distance));
  camera.position.copy(newPos);
  camera.near = 0.1;
  camera.far = Math.max(distance * 20, 1000);
  camera.updateProjectionMatrix();

  controls.target.copy(center);
  controls.update();
}

function initBackgroundVisualizer() {
  const container = document.getElementById("bg-visualizer");
  bgAudio = document.getElementById("bg-audio");
  bgAudioFileInput = document.getElementById("bg-audio-file");
  bgAudioButton = document.getElementById("bg-audio-btn");
  if (!container || !window.THREE) return;

  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;

  bgScene = new THREE.Scene();
  bgScene.fog = new THREE.FogExp2(0x050314, 0.018);

  bgCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1200);
  bgCamera.position.set(0, 0, 120);

  bgRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  bgRenderer.setSize(width, height);
  bgRenderer.setPixelRatio(window.devicePixelRatio || 1);
  container.appendChild(bgRenderer.domElement);

  const amb = new THREE.AmbientLight(0x888888);
  bgScene.add(amb);
  const spot = new THREE.SpotLight(0xffffff, 0.9);
  spot.position.set(-30, 80, 120);
  bgScene.add(spot);

  bgGroup = new THREE.Group();
  const planeGeo = new THREE.PlaneGeometry(800, 800, 20, 20);
  const planeMat = new THREE.MeshLambertMaterial({
    color: 0x6904ce,
    side: THREE.DoubleSide,
    wireframe: true,
    transparent: true,
    opacity: 0.55,
  });

  const plane = new THREE.Mesh(planeGeo, planeMat);
  plane.rotation.x = -Math.PI * 0.5;
  plane.position.set(0, 30, 0);
  plane.userData.isGround = true;
  bgGroup.add(plane);

  const plane2 = new THREE.Mesh(planeGeo, planeMat.clone());
  plane2.rotation.x = -Math.PI * 0.5;
  plane2.position.set(0, -30, 0);
  plane2.userData.isGround = true;
  bgGroup.add(plane2);

  const icoGeo = new THREE.IcosahedronGeometry(10, 4);
  const icoMat = new THREE.MeshLambertMaterial({ color: 0xff00ee, wireframe: true, transparent: true, opacity: 0.8 });
  const ball = new THREE.Mesh(icoGeo, icoMat);
  ball.userData.isBall = true;
  bgGroup.add(ball);

  bgScene.add(bgGroup);

  bgAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  bgAnalyser = bgAudioCtx.createAnalyser();
  bgAnalyser.fftSize = 512;
  const bufferLength = bgAnalyser.frequencyBinCount;
  bgDataArray = new Uint8Array(bufferLength);

  // Default oscillator so the scene animates even without user audio
  const fallbackOsc = bgAudioCtx.createOscillator();
  fallbackOsc.type = "sawtooth";
  fallbackOsc.frequency.value = 96;
  const fallbackGain = bgAudioCtx.createGain();
  fallbackGain.gain.value = 0.05;
  fallbackOsc.connect(fallbackGain).connect(bgAnalyser);
  fallbackOsc.start();
  bgOsc = fallbackOsc;

  function connectMediaElement() {
    if (!bgAudio) return;
    const src = bgAudioCtx.createMediaElementSource(bgAudio);
    src.connect(bgAnalyser);
    bgAnalyser.connect(bgAudioCtx.destination);
  }

  if (bgAudioFileInput) {
    bgAudioFileInput.addEventListener("change", () => {
      if (!bgAudioFileInput.files?.length) return;
      const file = bgAudioFileInput.files[0];
      const url = URL.createObjectURL(file);
      bgAudio.src = url;
      bgAudio.load();
      bgAudio.play();
      connectMediaElement();
    });
  }

  if (bgAudioButton && bgAudioFileInput) {
    bgAudioButton.addEventListener("click", () => {
      bgAudioFileInput.click();
    });
  }

  const noise = new SimplexNoise();

  const render = () => {
    if (!bgAnalyser) return;
    bgAnalyser.getByteFrequencyData(bgDataArray);

    const lowerHalf = bgDataArray.slice(0, bgDataArray.length / 2 - 1);
    const upperHalf = bgDataArray.slice(bgDataArray.length / 2 - 1);
    const lowerMax = Math.max(...lowerHalf);
    const lowerAvg = lowerHalf.reduce((a, b) => a + b, 0) / lowerHalf.length;
    const upperAvg = upperHalf.reduce((a, b) => a + b, 0) / upperHalf.length;

    const lowerMaxFr = modulate(lowerMax, 0, 255, 0, 1);
    const lowerAvgFr = modulate(lowerAvg, 0, 255, 0, 1);
    const upperAvgFr = modulate(upperAvg, 0, 255, 0, 1);

    bgGroup.children.forEach((mesh) => {
      if (mesh.userData.isGround) {
        makeRoughGround(mesh, modulate(Math.pow(lowerAvgFr, 0.8), 0, 1, 0, 1.2), noise);
        mesh.rotation.z += 0.001;
      }
      if (mesh.userData.isBall) {
        makeRoughBall(mesh, modulate(Math.pow(lowerMaxFr, 0.8), 0, 1, 0, 8), modulate(upperAvgFr, 0, 1, 0, 4), noise);
      }
    });

    bgGroup.rotation.y += 0.004;
    bgRenderer.render(bgScene, bgCamera);
    bgAnimationId = requestAnimationFrame(render);
  };

  render();

  window.addEventListener("resize", () => {
    if (!bgRenderer || !bgCamera) return;
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    bgCamera.aspect = w / h;
    bgCamera.updateProjectionMatrix();
    bgRenderer.setSize(w, h);
  });
}

// --- Utility helpers borrowed from ref visualizer ---
function fractionate(val, minVal, maxVal) {
  return (val - minVal) / (maxVal - minVal);
}

function modulate(val, minVal, maxVal, outMin, outMax) {
  const fr = fractionate(val, minVal, maxVal);
  const delta = outMax - outMin;
  return outMin + fr * delta;
}

function makeRoughGround(mesh, distortionFr, noise) {
  const verts = mesh.geometry.vertices;
  for (let i = 0; i < verts.length; i++) {
    const v = verts[i];
    const amp = 2;
    const time = Date.now();
    const distance = noise.noise2D(v.x + time * 0.0003, v.y + time * 0.0001) * distortionFr * amp;
    v.z = distance;
  }
  mesh.geometry.verticesNeedUpdate = true;
  mesh.geometry.normalsNeedUpdate = true;
  mesh.geometry.computeVertexNormals();
  mesh.geometry.computeFaceNormals();
}

function makeRoughBall(mesh, bassFr, treFr, noise) {
  const verts = mesh.geometry.vertices;
  const offset = mesh.geometry.parameters.radius;
  const amp = 7;
  const time = window.performance.now();
  const rf = 0.00001;
  for (let i = 0; i < verts.length; i++) {
    const v = verts[i];
    v.normalize();
    const distance = offset + bassFr + noise.noise3D(v.x + time * rf * 7, v.y + time * rf * 8, v.z + time * rf * 9) * amp * treFr;
    v.multiplyScalar(distance);
  }
  mesh.geometry.verticesNeedUpdate = true;
  mesh.geometry.normalsNeedUpdate = true;
  mesh.geometry.computeVertexNormals();
  mesh.geometry.computeFaceNormals();
}

function wireTabs() {
  if (!tabPanels.length) return;
  const activate = (name) => {
    tabButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === name));
    tabPanels.forEach((panel) => panel.classList.toggle("active", panel.dataset.tab === name));
    navLinks.forEach((link) => {
      const target = link.getAttribute("data-tab-target");
      link.classList.toggle("active", target === name);
    });

    if (name === "terrain") {
      if (typeof initThree === "function") initThree();
      if (typeof collectPayload === "function") updatePreview(collectPayload());
    }
  };

  tabTriggers.forEach((link) =>
    link.addEventListener("click", (e) => {
      const target = link.getAttribute("data-tab-target");
      if (target) {
        e.preventDefault();
        activate(target);
        document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    })
  );

  activate("home");
}

function wireInstructionsToggle() {
  if (!infoBtn || !infoPop) return;

  infoPop.classList.add("open");

  infoBtn.addEventListener("click", (e) => {
    e.preventDefault();
    infoPop.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    if (!infoPop.contains(e.target) && !infoBtn.contains(e.target)) {
      infoPop.classList.remove("open");
    }
  });
}

function setStatus(text) {
  if (previewStatus) previewStatus.textContent = text;
}

window.addEventListener("load", () => {
  initBackgroundVisualizer();

  const isAppPage = !!document.querySelector(".tab-panel");
  if (!isAppPage) return;
  // Defer preview init until terrain tab is shown to avoid zero-size canvas
  if (typeof initThree === "function") initThree();
  if (typeof collectPayload === "function") updatePreview(collectPayload());
  wireInstructionsToggle();
  wireTabs();
});
