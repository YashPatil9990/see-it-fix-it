# Setup
1. `cp .env.example .env` and paste your key from https://aistudio.google.com/apikey
2. `npm install && npm start` -> http://localhost:3000
3. Phone testing needs HTTPS (camera/mic): `npx ngrok http 3000` (or `cloudflared tunnel --url http://localhost:3000`) and open the https URL on your phone.
4. Before the hackathon, verify on https://ai.google.dev/gemini-api/docs/live-api: model name (LIVE_MODEL), session limits, whether googleSearch can be combined with function declarations in your model (if the connection closes at setup, remove one tool).
5. Never commit .env. Deploy to Cloud Run/Render/Railway with GEMINI_API_KEY as an env var.

# 90-second demo
0:00 "Raise your hand if you've ever followed a video and got stuck."
0:10 Start coaching, show router + cables. Say "Help me set it up."
0:30 Deliberately plug into the wrong port -> coach interrupts.
0:50 Switch to Hindi/Marathi mid-sentence.
1:05 "Simmer/restart for 1 minute" -> timer appears.
1:15 Tap Save my guide -> show the manual with screenshots.
1:25 Close: "A personal expert for anyone who can't afford a technician, in their own language."

# Risks
- Network: record a backup video; test on mobile data; keep one tested demo task.
- Echo: use earphones during demo (speaker audio can retrigger the mic).
- Safety: keep the disclaimer in the UI and the refusal rules in prompt.txt.
