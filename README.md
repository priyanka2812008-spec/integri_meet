# IntegriMeet - Secure Technical Interview Platform

IntegriMeet is a real-time video meeting platform prototype focused on preventing cheating during technical interviews. It includes strict tab-switch detection, automated kicks, and a host dashboard for monitoring. 

*AI-powered system to detect hidden overlay-based cheating tools during online interviews and screen sharing.*

## 🚀 Features

- **WebRTC Video Rooms:** Real-time video/audio communication.
- **Zero-Tolerance Tab Monitoring:** Automatically kicks candidates who switch tabs or minimize the browser, immediately notifying the host.
- **Host Dashboard:** Live monitoring of participants and activity logs.
- **Collaborative Code Editor:** Real-time synchronized editor with syntax highlighting (Prism.js).
- **Security Alerts:** Automated detection of Copy-Paste actions and AI-based overlay simulation notifications.
- **Automated Alerts:** Sends a termination email alert (via Nodemailer) when a candidate is kicked.
- **AI Overlay Detection Simulator:** A Python/Flask module that demonstrates how AI would integrate to detect suspicious camera overlays (mocked for hackathon).

## 📁 Folder Structure

- `/client` - React & Vite frontend with Glassmorphism UI
- `/server` - Node.js Express & Socket.io backend
- `/ai-module` - Python Flask server for simulated AI detection

---

## ⚙️ Setup Instructions

### 1. Backend Server Setup
1. Open a terminal and navigate to the server folder: `cd server`
2. Install dependencies: `npm install`
3. Make sure MongoDB is running locally on port 27017, or edit `server/.env` with your own `MONGO_URI`.
4. (Optional) Provide real `EMAIL_USER` and `EMAIL_PASS` (App Password) in `.env` if you want real emails to be sent.
5. Start the server: `npm start` (Runs on `http://localhost:5000`)

### 2. Frontend Client Setup
1. Open a new terminal and navigate to the client folder: `cd client`
2. Install dependencies: `npm install`
3. Start the Vite dev server: `npm run dev` (Runs on `http://localhost:5173`)

### 3. AI Module Setup (Optional)
1. Open a new terminal and navigate to the ai-module folder: `cd ai-module`
2. Create and activate a python virtual environment, then `pip install -r requirements.txt`.
3. Run the python API: `python app.py` (Runs on `http://localhost:5001`)

---

## 🧪 Demo Scenario (How to Test)

1. Open your browser to the Client URL (`http://localhost:5173`).
2. **Join as Host:** Enter a Room ID and your email, select "Host", and click "Create / Monitor". You will be routed to the Host Dashboard.
3. Open an Incognito Window (or another browser) to the same Client URL.
4. **Join as Candidate:** Enter the same Room ID, name, email, select "Candidate", and join. Grant Camera/Mic permissions.
5. You should appear on the Host Dashboard as "Live".
6. **Trigger cheating mechanism:** Switch to another tab on the Candidate window or try to paste code in the editor.
7. **Result:**
   - Candidate is instantly disconnected and sees a "Terminated" alert.
   - Host Dashboard immediately shows the candidate as "Terminated - Tab switch detected" or "Security Alert: Code pasted".
   - An email is dispatched (check server console).
