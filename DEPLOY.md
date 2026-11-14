# Deploying Over-the-Shoulder to Render

## Prerequisites

- A [Render](https://render.com) account (free tier is enough)
- A GitHub account with this project pushed to a **public or private** repo

---

## Step 1 — Push to GitHub

```bash
cd over-the-shoulder
git init
git add .
git commit -m "Initial commit"
# Create a repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/over-the-shoulder.git
git push -u origin main
```

> **.env and node_modules are excluded** by `.gitignore` — your API key is safe.

---

## Step 2 — Connect to Render

1. Go to <https://dashboard.render.com>
2. Click **New → Web Service**
3. Click **Connect a repository** and select your `over-the-shoulder` repo
4. Render will detect `render.yaml` automatically — click **Apply**

---

## Step 3 — Set the API Key

1. In Render dashboard → your service → **Environment**
2. Click **Add Environment Variable**
3. Key: `GEMINI_API_KEY` | Value: *(paste your Gemini API key)*
4. Click **Save Changes** → Render redeploys automatically

> **Never commit the key.** Set it only via the dashboard.

Optional: set `DEMO_PASSCODE` the same way if you want to lock access during the event.

---

## Step 4 — Verify the Deploy

After the deploy finishes (usually ~2 minutes):

```
https://over-the-shoulder.onrender.com/health
```

You should see:
```json
{ "status": "ok", "uptime": 42, "model": "gemini-3.1-flash-live-preview" }
```

---

## Step 5 — Open on Your Phone

1. Open `https://over-the-shoulder.onrender.com` on your phone
2. Tap **▶ Start coaching** — the browser will ask for camera + mic permission
3. Status pill should turn green (Listening) within ~3 seconds

---

## WebSocket Behind HTTPS

Render terminates TLS for you. The client code already handles this:

```js
ws = new WebSocket(
  (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/live'
);
```

No extra config needed — `wss://` works automatically on the Render HTTPS domain.

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | ✅ Yes | — | Your Google Gemini API key |
| `LIVE_MODEL` | No | `gemini-3.1-flash-live-preview` | Model for the live session |
| `GUIDE_MODEL` | No | `gemini-3.5-flash-lite` | Model for guide generation |
| `MAX_SESSION_MINUTES` | No | `10` | Auto-disconnect after N minutes |
| `DEMO_PASSCODE` | No | _(empty = open)_ | Require a passcode on WS + /api/guide |
| `PORT` | No | `3000` | Set automatically by Render |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `/health` returns 503 | Build failed — check Render logs for npm errors |
| Camera / mic denied | HTTPS required — Render provides this automatically |
| Coach doesn't reply | Check GEMINI_API_KEY is set correctly in Environment tab |
| Free tier spins down after 15 min idle | Open the URL first to wake it; or upgrade to Starter plan |
