# 👁 Over-the-Shoulder
> **Real-Time Multimodal AR Vision Coach • Powered by Gemini Live API**

[![Gemini Live API](https://img.shields.io/badge/Gemini_Live-3.1_Flash-blue?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![WebSockets](https://img.shields.io/badge/Streaming-Bidirectional_PCM-orange?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
[![Zero Frameworks](https://img.shields.io/badge/Frontend-Vanilla_JS_%2B_Canvas_AR-purple?style=for-the-badge)]()

---

## 💡 About The Project

Ever tried fixing a router, assembling furniture, or cooking a tricky recipe while following a video tutorial? 
Tutorial videos are blind: they can't see when you're about to plug a cable into the wrong port or burn the garlic.

**Over-the-Shoulder** is an AI expert standing right behind you. Point your camera at your real-world workspace, and the coach watches continuously, speaks in your language (English, Hindi, Marathi, etc.), catches mistakes in real time, and paints AR target circles directly onto physical ports and components.

```
       ┌────────────────────────┐
       │   YOUR SMARTPHONE / PC │
       │  Camera (1 FPS JPEGs)  │
       │  Microphone (16kHz PCM)│
       └───────────▲────────────┘
                   │
         Bidirectional WebSocket
                   │
       ┌───────────▼────────────┐
       │     NODE.JS RELAY      │
       │  (server.js - Express) │
       │  • Keeps API key safe  │
       │  • Manages session ID  │
       └───────────▲────────────┘
                   │
          BidiGenerateContent
                   │
       ┌───────────▼────────────┐
       │    GEMINI LIVE API     │
       │  (gemini-3.1-flash)    │
       │  • Vision Understanding│
       │  • Proactive Audio     │
       │  • Tool Calling        │
       └────────────────────────┘
```

---

## ⚡ Key Capabilities

| Capability | What it Does |
|---|---|
| **🎯 AR Reticle Highlights** | Highlights physical ports and parts in real-time (`highlight(x, y, label)`) with accurate camera aspect-ratio projection. |
| **🚨 Instant Proactive Intervention** | Watches your hands and cables. If you aim for the wrong socket, the coach immediately interrupts you before you plug it in. |
| **📊 Dynamic Step Tracker** | Displays a top floating progress pill (`update_progress(step, total, title)`) keeping multi-step tasks organized. |
| **⚠️ Active Safety Banner** | Flashes a full-width hazard banner (`show_safety_warning(message)`) before you touch mains wiring, chemicals, or steam. |
| **⏱ Spoken Countdown Timers** | Voice-triggers real-time timers (`set_timer(seconds, label)`) for glue drying, water simmering, or router rebooting. |
| **📘 Instant Illustrated Manual** | Post-session synthesizer (`/api/guide`) extracts key screenshots and builds a shareable step-by-step PDF/WhatsApp guide. |

---

## 🛠 Prerequisites

- **Node.js** v18.0.0 or higher
- A **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/apikey)

---

## 🚀 Setup & Installation

### 1. Clone & Install
```bash
git clone https://github.com/your-username/over-the-shoulder.git
cd over-the-shoulder
npm install
```

### 2. Configure Environment
Create your `.env` file from the example:
```bash
cp .env.example .env
```
Open `.env` and insert your Gemini API key:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
LIVE_MODEL=gemini-3.1-flash-live-preview
GUIDE_MODEL=gemini-3.5-flash-lite
PORT=3000
```

### 3. Launch the Server
```bash
npm start
```
The application will be live at:
👉 **`http://localhost:3000`**

---

## 📱 Running on Mobile (Camera & Audio)

Modern mobile browsers (Safari on iOS and Chrome on Android) strictly require a **Secure Context (HTTPS)** to grant camera and microphone access.

### Option A: Instant HTTPS Tunnel (Recommended)
In a second terminal window, run either:
```bash
# Using localtunnel
npx --yes localtunnel --port 3000
```
*or*
```bash
# Using ngrok
npx ngrok http 3000
```
Open the generated `https://...` URL on your phone's browser. Camera and mic permissions will prompt automatically.

---

### Option B: Direct Wi-Fi on Android Chrome (No Tunnel)
1. Ensure your phone and laptop are connected to the same Wi-Fi.
2. Find your laptop's local IP (e.g. `192.168.1.5`).
3. On phone Chrome, navigate to:
   ```
   chrome://flags/#unsafely-treat-insecure-origin-as-secure
   ```
4. Add `http://192.168.1.5:3000`, select **Enabled**, and tap **Relaunch**.
5. Open `http://192.168.1.5:3000` and tap **▶ Start processing**.

---

## 📂 Project Architecture

```
over-the-shoulder/
├── server.js          # Express server + WebSocket proxy to Gemini Live
├── prompt.txt         # Coach persona, proactivity rules & safety refusals
├── public/
│   └── index.html     # Spatial AR HUD, audio pipeline, and canvas overlay
├── test.js            # Automated test suite (Vision, Audio, Tools, Safety)
└── package.json       # Project dependencies (express, ws, dotenv)
```

---

## 🧪 Running Automated Tests

Run the full acceptance test suite:
```bash
npm test
```
Tests verify:
- ✅ Vision frame ingestion & audio streaming
- ✅ Structured guide generation (`/api/guide`)
- ✅ Function calling (`set_timer`, `highlight`, `update_progress`, `show_safety_warning`)
- ✅ Multilingual switching (Hindi, Marathi, English)
- ✅ Strict safety refusal (LPG gas, high voltage)
