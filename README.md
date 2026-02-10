# SeismoSafe 🌍# SeismoSafe — Setup Guide# SeismoSafe — Seismic Terrain & Building Risk Analysis# SeismoSafe — Seismic Terrain & Building Risk Analysis# SeismoSafe MVP



A web application for 3D terrain visualization, seismic risk analysis, and building assessment using Three.js and FastAPI.



## OverviewA simple web app for terrain visualization and seismic risk analysis.



SeismoSafe is a minimal proof-of-concept for terrain visualization, building definition, seismic risk analysis, and SAP2000 structural analysis file generation.



## ✨ Features---A web application for 3D terrain visualization, seismic risk analysis, and building assessment using Three.js and FastAPI.



- **3D Terrain Preview** — Interactive Three.js viewer with GLTF model support (50x scaled)

- **GeoTIFF Drag & Drop** — Upload terrain elevation data (.tif files)

- **Slope Analysis** — Automatic terrain slope derivation from elevation data## 🖥️ For Teammates (Easy Access)

- **Seismic Risk Scoring** — Building vulnerability assessment based on site conditions

- **SAP2000 Export** — Generate structural analysis input files (.s2k)

- **Interactive 3D Background** — Animated morphing noise ball with 2000 floating particles

- **Custom Pixel Font** — Retro 04B30 font styling on home page**You don't need to install anything!** Just open this link in your browser:---A web application for 3D terrain visualization, seismic risk analysis, and building assessment using Three.js and FastAPI.Minimal proof-of-concept for terrain ingest, simple building definition, SAP2000 text export, and risk scoring.



## 📋 Prerequisites



- **Python 3.8+** — Required for backend and frontend server```

- **Modern Web Browser** — Chrome, Firefox, Edge (WebGL support required)

http://[HOST_IP]:5173

## 🚀 Quick Start

```## 🎯 Features

### For Users (Easy Access)



You don't need to install anything! Just ask the person running the server for the IP address and open this link in your browser:

> Ask the person running the server for the IP address (e.g., `http://192.168.1.100:5173`)

```

http://[HOST_IP]:5173

```

That's it! You can now use SeismoSafe.- **3D Terrain Preview** — Interactive Three.js viewer with GLTF model support (50x scaled)---## What’s here

Example: `http://192.168.1.100:5173`



### For the Host (Person Running the Server)

---- **GeoTIFF Drag & Drop** — Upload terrain elevation data (.tif files only)

#### Step 1: Open Command Prompt



Press `Win + R`, type `cmd`, press Enter.

## 🔧 For the Host (Person Running the Server)- **Slope Analysis** — Automatic terrain slope derivation from elevation data- **backend/**: FastAPI service with endpoints for terrain upload (stub slope factor), SAP2000 .s2k export, and heuristic risk score.

#### Step 2: Navigate to the Project Folder



```cmd

cd c:\Users\LYM803\Downloads\Develop\Civil\frontend### What You Need- **Seismic Risk Scoring** — Building vulnerability assessment based on site conditions

```

- Python installed on your computer

#### Step 3: Start the Frontend Server

- Download the project folder- **SAP2000 Export** — Generate structural analysis input files (.s2k)## 🎯 Features- **frontend/index.html**: Minimal landing page with project tagline and a link to the app.

```cmd

python -m http.server 5173 --bind 0.0.0.0

```

### Step 1: Open Command Prompt- **Interactive 3D Background** — Animated morphing noise ball with 2000 floating particles

Keep this window open! Don't close it.



#### Step 4: Find Your IP Address

Press `Win + R`, type `cmd`, press Enter.- **Custom Pixel Font** — Retro 04B30 font styling on home page and navigation- **frontend/app.html**: Full UI (terrain upload, building/risk, 3D preview, instructions) using the shared `style.css`, `main.js`, and local Three.js libs in `lib/`.

Open another Command Prompt and type:



```powershell

ipconfig### Step 2: Go to the Project Folder

```



Look for your IPv4 address (e.g., `192.168.1.100`) and share it with teammates.

```---- **3D Terrain Preview** — Interactive Three.js viewer with GLTF model support (50x scaled)

#### Step 5: Share with Teammates

cd c:\Users\LYM803\Downloads\Develop\Civil\frontend

Tell your teammates to open this in their browser:

```

```

http://[YOUR_IP]:5173

```

### Step 3: Start the Server## 📋 Prerequisites- **GeoTIFF Drag & Drop** — Upload terrain elevation data (.tif files only)## Quick start

## 📁 Project Structure



```

Civil/```

├── README.md                 # This file

├── backend/python -m http.server 5173 --bind 0.0.0.0

│   └── app/

│       ├── __init__.py```- **Python 3.8+** — Required for backend and frontend server- **Slope Analysis** — Automatic terrain slope derivation from elevation data

│       └── main.py           # FastAPI service with terrain upload, slope analysis, risk scoring, SAP2000 export

└── frontend/

    ├── index.html            # Home page with project info

    ├── app.html              # Full UI with 3D viewer and controlsKeep this window open! Don't close it.- **Modern Web Browser** — Chrome, Firefox, Edge (WebGL support required)

    ├── main.js               # Frontend logic

    ├── script.js             # Background animation script

    ├── style.css             # Styling

    ├── noise-background.html # Iframe for 3D background visualizer### Step 4: Find Your IP Address- **Seismic Risk Scoring** — Building vulnerability assessment based on site conditions### Backend (FastAPI)

    └── lib/

        ├── three.min.js      # Three.js r152

        ├── OrbitControls.js  # Camera controls

        └── GLTFLoader.js     # GLTF model loaderOpen another Command Prompt and type:---

```



## 🛠️ Backend Setup (FastAPI)

```- **SAP2000 Export** — Generate structural analysis input files (.s2k)```powershell

The backend provides endpoints for terrain upload, risk scoring, and SAP2000 export.

ipconfig

### Step 1: Create Virtual Environment

```## 🚀 Quick Start (Local Development)

```powershell

cd backend

python -m venv .venv

.\.venv\Scripts\activateLook for a line like:- **Interactive 3D Background** — Animated morphing noise ball with 2000 floating particlescd backend

```

```

### Step 2: Install Dependencies

IPv4 Address. . . . . . . : 192.168.1.100### 1. Clone / Download the Project

```powershell

pip install fastapi uvicorn python-multipart httpx```

```

- **Custom Pixel Font** — Retro 04B30 font styling on home page and navigationpython -m venv .venv

### Step 3: Start the Server

That number (e.g., `192.168.1.100`) is your IP address.

```powershell

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000```powershell

```

### Step 5: Share with Teammates

✅ Backend available at: **http://localhost:8000**  

📖 API docs available at: **http://localhost:8000/docs**cd c:\Users\LYM803\Downloads\Develop\Civil.\.venv\Scripts\activate



## 🌐 API EndpointsTell your teammates to open this in their browser:



| Method | Endpoint | Description |```

|--------|----------|-------------|

| `POST` | `/terrain/upload` | Upload terrain file (form-data) with optional `slope_hint_degrees` |```

| `POST` | `/analysis/risk-score` | Calculate seismic risk score from building/site JSON |

| `POST` | `/analysis/export-sap2000` | Generate SAP2000 `.s2k` export file |http://192.168.1.100:5173---pip install -r requirements.txt

| `GET`  | `/health` | Service health check |

```

### Sample Request Payload

### 2. Start the Backend (FastAPI)

```json

{(Replace `192.168.1.100` with your actual IP)

  "building": {

    "name": "Concept Model",uvicorn app.main:app --reload --port 8000

    "stories": 5,

    "bay_width_m": 6,---

    "bay_depth_m": 6,

    "story_height_m": 3.2,```powershell

    "material": "RC",

    "importance_factor": 1.0## ❓ Troubleshooting

  },

  "site": {cd backend## 📋 Prerequisites```

    "site_class": "D",

    "slope_degrees": 8,### "Teammates can't connect"

    "pga_g": 0.25,

    "seismic_zone": "Z3"python -m venv .venv

  }

}1. Make sure you're on the same WiFi network

```

2. Windows may ask to allow Python through firewall — click **Allow**.\.venv\Scripts\activate

## 🖱️ Usage Guide

3. Try turning off Windows Firewall temporarily

### Home Page (index.html)

pip install fastapi uvicorn python-multipart httpx- **Python 3.8+** — Required for backend and frontend serverAPI docs will be available at http://localhost:8000/docs.

- View the interactive 3D noise ball background

- Click and drag the ball to rotate it### "Python not found"

- Navigate to different sections via the menu

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

### Terrain Preview (app.html)

Download Python from: https://www.python.org/downloads/

1. **Drag & Drop GeoTIFF** — Drop a `.tif` file onto the dropzone

2. **3D Model** — The model displays automatically```- **Modern Web Browser** — Chrome, Firefox, Edge (WebGL support required)

3. **Orbit Controls** — Click and drag to rotate, scroll to zoom

During install, check the box that says **"Add Python to PATH"**

### Building & Risk Analysis



1. **Enter Building Properties** — Define stories, bay width, material, etc.

2. **Define Site Conditions** — Set site class, slope, PGA, seismic zone---

3. **Calculate Risk** — Get heuristic risk score

4. **Export to SAP2000** — Generate `.s2k` file for structural analysis✅ Backend available at: **http://localhost:8000**  ### Frontend (static)



## ⚙️ Configuration## 📱 How to Use the App



### Change API Port📖 API docs available at: **http://localhost:8000/docs**



Edit `API_BASE` in `frontend/main.js`:1. **Home Page** — See the interactive 3D ball, click and drag to rotate



```javascript2. **Terrain** — Drag & drop a .tif terrain file---Use any static server. Example with Python:

const API_BASE = "http://localhost:8000";

```3. **Building_Risk** — Enter building info for risk analysis



### Change Frontend Port### 3. Start the Frontend (Static Server)



```powershell---

python -m http.server <YOUR_PORT> --bind 0.0.0.0

``````powershell



## ❓ Troubleshooting## 📞 Need Help?



### "Teammates can't connect"Open a **new terminal** and run:



1. Make sure you're on the same WiFi networkContact the project developer for assistance.

2. Windows may ask to allow Python through firewall — click **Allow**

3. Try turning off Windows Firewall temporarily## 🚀 Quick Startcd frontend



### "Python not found"```powershell



Download Python from: https://www.python.org/downloads/cd frontendpython -m http.server 5173



During install, check the box that says **"Add Python to PATH"**python -m http.server 5173 --bind 0.0.0.0



## 📝 Notes & Next Steps```### 1. Clone / Download the Project```



- Terrain slope and risk model are simplified placeholders; replace with real DEM parsing

- SAP2000 export is a minimal stub; extend with elements, load cases, and combos

- For production: add authentication, PostgreSQL/PostGIS, job queue, and validation✅ Frontend available at: **http://localhost:5173**Open http://localhost:5173 in the browser.



## 🛠️ Tech Stack



- **Frontend**: Three.js r152, HTML5, CSS3, Vanilla JavaScript---```powershell- Landing: `index.html`

- **Backend**: Python, FastAPI, Uvicorn

- **3D Features**: GLTFLoader, OrbitControls, SimplexNoise (CDN)

- **File Parsing**: GeoTIFF.js, DXF-Parser

## 👥 Teammate Access (Same Network)cd c:\Users\LYM803\Downloads\Develop\Civil- Full app: `app.html`

## 📄 License



[Add your license here]

To let teammates access the system from their computers:```

## 👥 Contributing



[Add contribution guidelines here]

### Step 1: Find Your IP AddressUpdate `API_BASE` in `frontend/main.js` if you change ports.

## 📞 Need Help?



Contact the project developer for assistance.

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
