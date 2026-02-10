# SeismoSafe — Setup Guide# SeismoSafe — Seismic Terrain & Building Risk Analysis# SeismoSafe — Seismic Terrain & Building Risk Analysis# SeismoSafe MVP



A simple web app for terrain visualization and seismic risk analysis.



---A web application for 3D terrain visualization, seismic risk analysis, and building assessment using Three.js and FastAPI.



## 🖥️ For Teammates (Easy Access)



**You don't need to install anything!** Just open this link in your browser:---A web application for 3D terrain visualization, seismic risk analysis, and building assessment using Three.js and FastAPI.Minimal proof-of-concept for terrain ingest, simple building definition, SAP2000 text export, and risk scoring.



```

http://[HOST_IP]:5173

```## 🎯 Features



> Ask the person running the server for the IP address (e.g., `http://192.168.1.100:5173`)



That's it! You can now use SeismoSafe.- **3D Terrain Preview** — Interactive Three.js viewer with GLTF model support (50x scaled)---## What’s here



---- **GeoTIFF Drag & Drop** — Upload terrain elevation data (.tif files only)



## 🔧 For the Host (Person Running the Server)- **Slope Analysis** — Automatic terrain slope derivation from elevation data- **backend/**: FastAPI service with endpoints for terrain upload (stub slope factor), SAP2000 .s2k export, and heuristic risk score.



### What You Need- **Seismic Risk Scoring** — Building vulnerability assessment based on site conditions

- Python installed on your computer

- Download the project folder- **SAP2000 Export** — Generate structural analysis input files (.s2k)## 🎯 Features- **frontend/index.html**: Minimal landing page with project tagline and a link to the app.



### Step 1: Open Command Prompt- **Interactive 3D Background** — Animated morphing noise ball with 2000 floating particles



Press `Win + R`, type `cmd`, press Enter.- **Custom Pixel Font** — Retro 04B30 font styling on home page and navigation- **frontend/app.html**: Full UI (terrain upload, building/risk, 3D preview, instructions) using the shared `style.css`, `main.js`, and local Three.js libs in `lib/`.



### Step 2: Go to the Project Folder



```---- **3D Terrain Preview** — Interactive Three.js viewer with GLTF model support (50x scaled)

cd c:\Users\LYM803\Downloads\Develop\Civil\frontend

```



### Step 3: Start the Server## 📋 Prerequisites- **GeoTIFF Drag & Drop** — Upload terrain elevation data (.tif files only)## Quick start



```

python -m http.server 5173 --bind 0.0.0.0

```- **Python 3.8+** — Required for backend and frontend server- **Slope Analysis** — Automatic terrain slope derivation from elevation data



Keep this window open! Don't close it.- **Modern Web Browser** — Chrome, Firefox, Edge (WebGL support required)



### Step 4: Find Your IP Address- **Seismic Risk Scoring** — Building vulnerability assessment based on site conditions### Backend (FastAPI)



Open another Command Prompt and type:---



```- **SAP2000 Export** — Generate structural analysis input files (.s2k)```powershell

ipconfig

```## 🚀 Quick Start (Local Development)



Look for a line like:- **Interactive 3D Background** — Animated morphing noise ball with 2000 floating particlescd backend

```

IPv4 Address. . . . . . . : 192.168.1.100### 1. Clone / Download the Project

```

- **Custom Pixel Font** — Retro 04B30 font styling on home page and navigationpython -m venv .venv

That number (e.g., `192.168.1.100`) is your IP address.

```powershell

### Step 5: Share with Teammates

cd c:\Users\LYM803\Downloads\Develop\Civil.\.venv\Scripts\activate

Tell your teammates to open this in their browser:

```

```

http://192.168.1.100:5173---pip install -r requirements.txt

```

### 2. Start the Backend (FastAPI)

(Replace `192.168.1.100` with your actual IP)

uvicorn app.main:app --reload --port 8000

---

```powershell

## ❓ Troubleshooting

cd backend## 📋 Prerequisites```

### "Teammates can't connect"

python -m venv .venv

1. Make sure you're on the same WiFi network

2. Windows may ask to allow Python through firewall — click **Allow**.\.venv\Scripts\activate

3. Try turning off Windows Firewall temporarily

pip install fastapi uvicorn python-multipart httpx- **Python 3.8+** — Required for backend and frontend serverAPI docs will be available at http://localhost:8000/docs.

### "Python not found"

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

Download Python from: https://www.python.org/downloads/

```- **Modern Web Browser** — Chrome, Firefox, Edge (WebGL support required)

During install, check the box that says **"Add Python to PATH"**



---

✅ Backend available at: **http://localhost:8000**  ### Frontend (static)

## 📱 How to Use the App

📖 API docs available at: **http://localhost:8000/docs**

1. **Home Page** — See the interactive 3D ball, click and drag to rotate

2. **Terrain** — Drag & drop a .tif terrain file---Use any static server. Example with Python:

3. **Building_Risk** — Enter building info for risk analysis

### 3. Start the Frontend (Static Server)

---

```powershell

## 📞 Need Help?

Open a **new terminal** and run:

Contact the project developer for assistance.

## 🚀 Quick Startcd frontend

```powershell

cd frontendpython -m http.server 5173

python -m http.server 5173 --bind 0.0.0.0

```### 1. Clone / Download the Project```



✅ Frontend available at: **http://localhost:5173**Open http://localhost:5173 in the browser.



---```powershell- Landing: `index.html`



## 👥 Teammate Access (Same Network)cd c:\Users\LYM803\Downloads\Develop\Civil- Full app: `app.html`



To let teammates access the system from their computers:```



### Step 1: Find Your IP AddressUpdate `API_BASE` in `frontend/main.js` if you change ports.



Run this command on the host machine:### 2. Start the Backend (FastAPI)



```powershell## Endpoints (summary)

ipconfig

``````powershell- `POST /terrain/upload` — form-data file + optional `slope_hint_degrees`; returns slope factor.



Look for **IPv4 Address** under your active network adapter (e.g., `192.168.1.100`).cd backend- `POST /analysis/risk-score` — JSON with `building` and `site` fields; returns heuristic risk score.



### Step 2: Start Servers with Network Bindingpython -m venv .venv- `POST /analysis/export-sap2000` — JSON with `building` and `site`; returns minimal `.s2k` text.



**Backend** (allows external connections):.\.venv\Scripts\activate- `GET /health` — service status.

```powershell

cd backendpip install fastapi uvicorn python-multipart httpx

.\.venv\Scripts\activate

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000uvicorn app.main:app --reload --port 8000### Sample payload

```

``````json

**Frontend** (allows external connections):

```powershell{

cd frontend

python -m http.server 5173 --bind 0.0.0.0✅ Backend available at: **http://localhost:8000**    "building": {

```

📖 API docs available at: **http://localhost:8000/docs**    "name": "Concept Model",

### Step 3: Update API Base URL

    "stories": 5,

Edit `frontend/main.js` and change `API_BASE` to your IP:

### 3. Start the Frontend (Static Server)    "bay_width_m": 6,

```javascript

const API_BASE = "http://192.168.1.100:8000";  // Replace with your IP    "bay_depth_m": 6,

```

Open a **new terminal** and run:    "story_height_m": 3.2,

### Step 4: Allow Through Windows Firewall

    "material": "RC",

Run PowerShell as **Administrator**:

```powershell    "importance_factor": 1.0

```powershell

# Allow backend portcd frontend  },

New-NetFirewallRule -DisplayName "SeismoSafe Backend" -Direction Inbound -Port 8000 -Protocol TCP -Action Allow

python -m http.server 5173  "site": {

# Allow frontend port

New-NetFirewallRule -DisplayName "SeismoSafe Frontend" -Direction Inbound -Port 5173 -Protocol TCP -Action Allow```    "site_class": "D",

```

    "slope_degrees": 8,

### Step 5: Teammates Access

✅ Frontend available at: **http://localhost:5173**    "pga_g": 0.25,

Teammates can now open in their browser:

    "seismic_zone": "Z3"

- **Frontend**: `http://192.168.1.100:5173`

- **API Docs**: `http://192.168.1.100:8000/docs`---  }



> ⚠️ Replace `192.168.1.100` with your actual IP address from Step 1.}



---## 📁 Project Structure```



## 📁 Project Structure



``````## Notes and next steps

Civil/

├── README.md                 # This fileCivil/- Terrain slope and risk model are simplified placeholders; replace with real DEM parsing and code-based checks.

├── backend/

│   └── app/├── README.md                 # This file- SAP2000 export is a minimal text stub; extend with elements, load cases, and combos.

│       ├── __init__.py

│       └── main.py           # FastAPI application├── backend/- For production, add auth, persistence (Postgres/PostGIS), job queue, and validation guardrails.

└── frontend/

    ├── index.html            # Home page with navigation│   └── app/

    ├── app.html              # Full terrain/building app│       ├── __init__.py

    ├── main.js               # Three.js 3D preview + GeoTIFF handling│       └── main.py           # FastAPI application

    ├── script.js             # Interactive 3D noise ball + particles└── frontend/

    ├── style.css             # Custom styling with 04B30 font    ├── index.html            # Home page with navigation

    ├── noise-background.html # Iframe for 3D background visualizer    ├── app.html              # Full terrain/building app

    └── lib/    ├── main.js               # Three.js 3D preview + GeoTIFF handling

        ├── three.min.js      # Three.js r152    ├── script.js             # Interactive 3D noise ball + particles

        ├── OrbitControls.js  # Camera controls    ├── style.css             # Custom styling with 04B30 font

        ├── GLTFLoader.js     # GLTF model loader    ├── noise-background.html # Iframe for 3D background visualizer

        ├── dxf-parser.js     # DXF file parsing    └── lib/

        └── geotiff.js        # GeoTIFF parsing        ├── three.min.js      # Three.js r152

```        ├── OrbitControls.js  # Camera controls

        ├── GLTFLoader.js     # GLTF model loader

---        ├── dxf-parser.js     # DXF file parsing

        └── geotiff.js        # GeoTIFF parsing

## 🌐 API Endpoints```



| Method | Endpoint | Description |---

|--------|----------|-------------|

| `POST` | `/terrain/upload` | Upload terrain file (form-data) with optional `slope_hint_degrees` |## 🌐 API Endpoints

| `POST` | `/analysis/risk-score` | Calculate seismic risk score from building/site JSON |

| `POST` | `/analysis/export-sap2000` | Generate SAP2000 `.s2k` export file || Method | Endpoint | Description |

| `GET`  | `/health` | Service health check ||--------|----------|-------------|

| `POST` | `/terrain/upload` | Upload terrain file (form-data) with optional `slope_hint_degrees` |

### Sample Request Payload| `POST` | `/analysis/risk-score` | Calculate seismic risk score from building/site JSON |

| `POST` | `/analysis/export-sap2000` | Generate SAP2000 `.s2k` export file |

```json| `GET`  | `/health` | Service health check |

{

  "building": {### Sample Request Payload

    "name": "Concept Model",

    "stories": 5,```json

    "bay_width_m": 6,{

    "bay_depth_m": 6,  "building": {

    "story_height_m": 3.2,    "name": "Concept Model",

    "material": "RC",    "stories": 5,

    "importance_factor": 1.0    "bay_width_m": 6,

  },    "bay_depth_m": 6,

  "site": {    "story_height_m": 3.2,

    "site_class": "D",    "material": "RC",

    "slope_degrees": 8,    "importance_factor": 1.0

    "pga_g": 0.25,  },

    "seismic_zone": "Z3"  "site": {

  }    "site_class": "D",

}    "slope_degrees": 8,

```    "pga_g": 0.25,

    "seismic_zone": "Z3"

---  }

}

## 🖱️ Usage Guide```



### Home Page (index.html)---

- View the interactive 3D noise ball background

- Click and drag the ball to rotate it## 🖱️ Usage Guide

- Navigate to different sections via the menu

### Home Page (index.html)

### Terrain Preview (app.html)- View the interactive 3D noise ball background

1. **Drag & Drop GeoTIFF** — Drop a `.tif` file onto the dropzone- Click and drag the ball to rotate it

2. **3D Model** — The Kumbum.gltf model displays automatically- Navigate to different sections via the menu

3. **Orbit Controls** — Click and drag to rotate, scroll to zoom

### Terrain Preview (app.html)

---1. **Drag & Drop GeoTIFF** — Drop a `.tif` file onto the dropzone

2. **3D Model** — The Kumbum.gltf model displays automatically

## ⚙️ Configuration3. **Orbit Controls** — Click and drag to rotate, scroll to zoom



### Change API Port---

Edit `API_BASE` in `frontend/main.js`:

```javascript## ⚙️ Configuration

const API_BASE = "http://localhost:8000";

```### Change API Port

Edit `API_BASE` in `frontend/main.js`:

### Change Frontend Port```javascript

```powershellconst API_BASE = "http://localhost:8000";

python -m http.server <YOUR_PORT> --bind 0.0.0.0```

```

### Change Frontend Port

---```powershell

python -m http.server <YOUR_PORT>

## 📝 Notes & Next Steps```



- Terrain slope and risk model are simplified placeholders; replace with real DEM parsing---

- SAP2000 export is a minimal stub; extend with elements, load cases, and combos

- For production: add authentication, PostgreSQL/PostGIS, job queue, and validation## 📝 Notes & Next Steps



---- Terrain slope and risk model are simplified placeholders; replace with real DEM parsing

- SAP2000 export is a minimal stub; extend with elements, load cases, and combos

## 🛠️ Tech Stack- For production: add authentication, PostgreSQL/PostGIS, job queue, and validation



- **Frontend**: Three.js r152, HTML5, CSS3, Vanilla JavaScript---

- **Backend**: Python, FastAPI, Uvicorn

- **3D Features**: GLTFLoader, OrbitControls, SimplexNoise (CDN)## 🛠️ Tech Stack

- **File Parsing**: GeoTIFF.js, DXF-Parser

- **Frontend**: Three.js r152, HTML5, CSS3, Vanilla JavaScript
- **Backend**: Python, FastAPI, Uvicorn
- **3D Features**: GLTFLoader, OrbitControls, SimplexNoise (CDN)
- **File Parsing**: GeoTIFF.js, DXF-Parser
