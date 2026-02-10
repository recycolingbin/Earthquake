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

