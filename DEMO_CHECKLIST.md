# Over-the-Shoulder — Pre-Demo Checklist

## 30 Minutes Before

- [ ] Plug in **earphones** (prevents mic echo; the AI will hear itself otherwise)
- [ ] Charge phone to **> 80 %**
- [ ] Enable **mobile hotspot** on phone as backup internet
- [ ] Do a quick **mobile-data-only test**: disable WiFi, open the tunnel URL, tap Start
- [ ] Record a **90-second backup video** of the full demo flow on the phone — keep it in your camera roll in case the live session fails

## 5 Minutes Before

- [ ] On laptop: `node server.js` → verify `http://localhost:3000` in terminal
- [ ] `./cloudflared tunnel --url http://localhost:3000` → copy the HTTPS URL
- [ ] Open HTTPS URL on phone in mobile browser (Chrome / Safari)
- [ ] Tap **▶ Start coaching** → status pill should turn green (Listening)
- [ ] Say **"Hello"** → verify coach speaks back (green → blue → green pill)
- [ ] Check **lighting**: router / object clearly visible in camera, no glare
- [ ] Have props ready: router, cables (one to plug in wrong port)
- [ ] Run `npm test` on laptop once to confirm all acceptance tests pass

## 90-Second Demo Script

| Time | Action |
|------|--------|
| 0:00 | _"Raise your hand if you've ever followed a video tutorial and got completely stuck."_ |
| 0:10 | Tap **▶ Start coaching**. Point camera at the router. Say: _"Help me set this router up."_ |
| 0:30 | **Deliberately plug cable into WAN port** → coach interrupts: _"Stop, that's the WAN port!"_ |
| 0:50 | Switch to Hindi mid-sentence: _"यह केबल कहाँ लगाऊँ?"_ → coach replies in Hindi |
| 1:05 | Say _"Set a 1-minute timer"_ → countdown timer appears on screen |
| 1:15 | Tap **📸 Mark step**, then **📘 Save my guide** → show numbered steps with screenshots |
| 1:25 | Close: _"A personal expert for anyone who can't afford a technician — in their own language."_ |

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Network drop mid-demo | Switch to mobile hotspot; keep backup video ready |
| Echo / feedback loop | Always use earphones during demo |
| API quota exhausted | Run `npm test` night before; if it fails, regenerate API key |
| Tunnel URL changes | Restart cloudflared and re-copy the URL before demo |
| Coach doesn't interrupt | Pause for 2 seconds after plugging in wrong port; proactive audio needs a moment |
| Guide empty / blank | Ensure session was at least 30 seconds with speech before tapping Save |
