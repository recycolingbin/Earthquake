### Step 1: Download & Unzip
Download the whole project folder (Civil or SeismoSafe or whatever it's called) → unzip it somewhere easy, like  
`C:\SeismoSafe`

Final path should look like this:
```
C:\SeismoSafe\backend\
C:\SeismoSafe\frontend\
```

### Step 2: Open TWO Command Windows (Very Important!)

Press **Win + R** → type `cmd` → Enter  
Do this TWICE → you now have **2 black windows**

### Step 3: Start the Backend (Window #1)

In the **first** cmd window, copy-paste these lines ONE BY ONE (press Enter after each):

```cmd
cd C:\SeismoSafe\backend
python -m venv .venv
.venv\Scripts\activate
pip install fastapi uvicorn python-multipart httpx
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You will see something like:
```
Application startup complete.
Uvicorn running on http://0.0.0.0:8000
```

**DO NOT CLOSE THIS WINDOW EVER!** Keep it open forever.

### Step 4: Start the Frontend (Window #2)

In the **second** cmd window, copy-paste this:

```cmd
cd C:\SeismoSafe\frontend
python -m http.server 5173 --bind 0.0.0.0
```

You will see:
```
Serving HTTP on :: port 5173
```

**DO NOT CLOSE THIS WINDOW EITHER!**

### Step 5: Find Your IP (So Others Can Connect)

Open a **third** cmd (or press Win + R → cmd again) and type:

```cmd
ipconfig
```

Look for something like:
```
IPv4 Address. . . . . . . . . . . : 192.168.1.69
or 172.16.x.x or 10.x.x.x
```

That number (example: 192.168.1.69) is your magic number.

### Step 6: Open the App

On your own computer, open browser → type:

http://localhost:5173

or directly:

http://127.0.0.1:5173

→ It should work!

### Step 7: Tell Your Teammates (They Do NOTHING Except This)

Tell everyone on the same WiFi:

"Open browser and go to:"

http://YOUR_IP_HERE:5173

Example:
http://192.168.1.69:5173

That’s it. They can use it immediately. No install, no Python, nothing.

### Bonus: If Windows Firewall Blocks It (Very Common)

When it asks “Do you want to allow Python through firewall?” → Click **Allow**

If teammates still can't connect, run this once (right-click Start → Windows PowerShell Admin):

```powershell
New-NetFirewallRule -DisplayName "SeismoSafe All Ports" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8000,5173
```

Done.

### Summary – The Stupid Cheat Sheet (Copy This to Your Team)

```
1. Host runs these 2 commands (keep windows open):

Backend:
cd C:\SeismoSafe\backend
.venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

Frontend:
cd C:\SeismoSafe\frontend
python -m http.server 5173 --bind 0.0.0.0

2. Host types ipconfig → gives everyone the IPv4 number

3. Everyone just opens: http://THAT_NUMBER:5173

DONE. NOBODY INSTALLS ANYTHING.
```

You are now the hero of the civil engineering team. Go drink coffee. ☕🌍

---

## Publish Online With Your Domain

If you already own a domain, the most reliable setup is:
- `Frontend` served by Nginx
- `Backend` (FastAPI/Uvicorn) running as a system service
- `Nginx` reverse proxy `/api/*` to the backend
- `HTTPS` via Let's Encrypt

This repo is already prepared for that flow:
- On localhost, frontend calls `http://localhost:8000`
- On a real domain, frontend calls `/api` on the same domain

### 1. Point domain DNS to your server

In your domain DNS panel:
- Create `A` record for `@` -> `YOUR_SERVER_PUBLIC_IP`
- Optional: create `A` record for `www` -> `YOUR_SERVER_PUBLIC_IP`

Wait for DNS propagation (usually a few minutes, can be longer).

### 2. SSH into your Linux server and install stack

```bash
sudo apt update
sudo apt install -y python3 python3-venv nginx certbot python3-certbot-nginx
```

### 3. Deploy backend

```bash
sudo mkdir -p /opt/seismosafe
sudo chown "$USER":"$USER" /opt/seismosafe
cd /opt/seismosafe

# clone your repo
git clone <YOUR_GIT_REPO_URL> .

cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn python-multipart httpx
```

Create `/etc/systemd/system/seismosafe-backend.service`:

```ini
[Unit]
Description=SeismoSafe FastAPI Backend
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/opt/seismosafe/backend
Environment="PATH=/opt/seismosafe/backend/.venv/bin"
ExecStart=/opt/seismosafe/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable seismosafe-backend
sudo systemctl start seismosafe-backend
sudo systemctl status seismosafe-backend
```

### 4. Deploy frontend + Nginx config

Copy frontend files to web root:

```bash
sudo mkdir -p /var/www/seismosafe
sudo cp -r /opt/seismosafe/frontend/* /var/www/seismosafe/
```

Create `/etc/nginx/sites-available/seismosafe`:

```nginx
server {
	server_name yourdomain.com www.yourdomain.com;

	root /var/www/seismosafe;
	index index.html;

	location / {
		try_files $uri $uri/ /index.html;
	}

	location /api/ {
		proxy_pass http://127.0.0.1:8000/;
		proxy_set_header Host $host;
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header X-Forwarded-Proto $scheme;
	}
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/seismosafe /etc/nginx/sites-enabled/seismosafe
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Enable HTTPS (SSL)

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

After success, open:
- `https://yourdomain.com`

### 6. Update after code changes

```bash
cd /opt/seismosafe
git pull

# backend updates
cd /opt/seismosafe/backend
source .venv/bin/activate
pip install -r requirements.txt || true
sudo systemctl restart seismosafe-backend

# frontend updates
sudo cp -r /opt/seismosafe/frontend/* /var/www/seismosafe/
sudo systemctl reload nginx
```

---

## Deploy Without VPS (Render Free Tier)

If you do not want monthly VPS cost, use Render. This repo works well on Render with 2 services:
- Backend: Python Web Service (FastAPI)
- Frontend: Static Site (plain HTML/CSS/JS)

Important correction for this repo:
- It is **not** Vite/React in the current codebase.
- Frontend has no `package.json`, so no `npm run build` is required.
- Backend start command is `uvicorn app.main:app ...` (not `main:app`).

### A. Backend on Render

1. Push this repo to GitHub.
2. In Render dashboard: `New` -> `Web Service`.
3. Select this repo.
4. Configure:
	- Name: `seismosafe-backend`
	- Root Directory: `backend`
	- Runtime: `Python`
	- Build Command: `pip install -r requirements.txt`
	- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Deploy and copy the backend URL (example: `https://seismosafe-backend.onrender.com`).

### B. Frontend on Render

1. In Render dashboard: `New` -> `Static Site`.
2. Select same repo.
3. Configure:
	- Name: `seismosafe-frontend`
	- Root Directory: `frontend`
	- Build Command: leave empty
	- Publish Directory: `.`
4. Deploy.

### C. Connect Frontend to Backend

Edit `frontend/index.html` and set this meta tag:

```html
<meta name="api-base" content="https://seismosafe-backend.onrender.com" />
```

Then commit and redeploy frontend.

### D. Connect Your Domain

In Render for frontend service:
1. `Settings` -> `Custom Domains` -> add your domain (example: `seismictibet.com`).
2. Render shows DNS records.
3. Add those records in your domain DNS panel.
4. Wait for SSL provisioning, then open your domain.

### E. Notes About Free Tier

- Backend may sleep when idle; first request after idle can be slower.
- For heavy GLTF assets, do not bundle all large files directly in app deploy if possible.

