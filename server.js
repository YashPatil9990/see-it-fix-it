import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { readFileSync } from 'fs';

const {
  GEMINI_API_KEY,
  LIVE_MODEL = 'gemini-3.1-flash-live-preview',
  GUIDE_MODEL = 'gemini-3.5-flash-lite',
  PORT = 3000,
  DEMO_PASSCODE = '',
  MAX_SESSION_MINUTES = 10
} = process.env;

if (!GEMINI_API_KEY) { console.error('Set GEMINI_API_KEY in .env'); process.exit(1); }

// Redact GEMINI_API_KEY from any logs, errors, or URLs
const redact = (s) => (typeof s === 'string' && GEMINI_API_KEY ? s.replaceAll(GEMINI_API_KEY, '[REDACTED]') : s);

const SYSTEM_PROMPT = readFileSync('./prompt.txt', 'utf8');
const UPSTREAM_URL = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=' + GEMINI_API_KEY;

const app = express();
app.use(express.json({ limit: '25mb' }));
app.use(express.static('public'));

// ---- Health check endpoint (Phase 6 / Render) ----
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: Math.round(process.uptime()), model: LIVE_MODEL });
});

// ---- Guide generator: transcript + screenshots -> structured JSON ----
app.post('/api/guide', async (req, res) => {
  try {
    if (DEMO_PASSCODE) {
      const code = req.headers['x-passcode'] || req.query.passcode || req.body?.passcode;
      if (code !== DEMO_PASSCODE) {
        return res.status(401).json({ error: 'Unauthorized: invalid passcode' });
      }
    }

    const { transcript = '', shots = [] } = req.body;
    if (!transcript.trim()) {
      return res.status(400).json({ error: 'Session transcript is empty. Start a coaching session first.' });
    }

    console.log(`[Guide] Generating guide: ${shots.length} shots, ${transcript.length} chars transcript...`);
    const parts = [{ text:
      `Turn this coaching session into a clear reusable step-by-step manual. Use only what happened.
Write in the language the user mainly spoke. Include safety notes and mistakes caught.
For each step, set shotIndex to the best matching screenshot index (or -1). Screenshots are in order with timestamps: ${shots.map((s,i)=>i+':'+s.t).join(', ')}.
TRANSCRIPT:\n${transcript}` }];
    shots.forEach(s => parts.push({ inlineData: { mimeType: 'image/jpeg', data: s.b64 } }));
    const schema = { type: 'OBJECT', required: ['title','steps'], properties: {
      title: { type: 'STRING' }, summary: { type: 'STRING' },
      toolsNeeded: { type: 'ARRAY', items: { type: 'STRING' } },
      safetyNotes: { type: 'ARRAY', items: { type: 'STRING' } },
      steps: { type: 'ARRAY', items: { type: 'OBJECT', required: ['instruction'], properties: {
        instruction: { type: 'STRING' }, tip: { type: 'STRING' },
        timestamp: { type: 'STRING' }, shotIndex: { type: 'INTEGER' } } } } } };
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GUIDE_MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
      body: JSON.stringify({ contents: [{ role: 'user', parts }],
        generationConfig: { responseMimeType: 'application/json', responseSchema: schema } }) });
    const j = await r.json();
    if (!r.ok) {
      console.error('[Guide] API error:', r.status, redact(JSON.stringify(j)));
      return res.status(r.status).json(j);
    }
    const result = JSON.parse(j.candidates[0].content.parts[0].text);
    console.log(`[Guide] Generated: "${result.title}" with ${result.steps?.length || 0} steps`);
    res.json(result);
  } catch (e) {
    console.error('[Guide] Error:', redact(String(e)));
    res.status(500).json({ error: redact(String(e)) });
  }
});

// ---- Live relay: browser <-> server <-> Gemini (key never leaves server) ----
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/live' });

wss.on('connection', (client, req) => {
  // Passcode verification
  if (DEMO_PASSCODE) {
    const url = new URL(req.url, 'http://localhost');
    const code = url.searchParams.get('passcode') || req.headers['sec-websocket-protocol'];
    if (code !== DEMO_PASSCODE) {
      client.close(4401, 'Unauthorized passcode');
      return;
    }
  }

  // Max session lifetime (e.g. 10 minutes)
  const maxMs = (Number(MAX_SESSION_MINUTES) || 10) * 60 * 1000;
  const sessionTimer = setTimeout(() => {
    console.log(`[Session] Max session limit reached (${MAX_SESSION_MINUTES} min)`);
    client.close(1000, 'Max session time reached');
  }, maxMs);

  let upstream;
  let resumptionHandle = null;
  const queue = [];

  function connectUpstream() {
    upstream = new WebSocket(UPSTREAM_URL);

    upstream.on('open', () => {
      const setupMsg = {
        model: `models/${LIVE_MODEL}`,
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
        },
        proactivity: { proactiveAudio: true },
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        tools: [
          { functionDeclarations: [{ name: 'set_timer',
            description: 'Start a countdown timer for the user.',
            parameters: { type: 'OBJECT', required: ['seconds','label'], properties: {
              seconds: { type: 'INTEGER' }, label: { type: 'STRING' } } } }] }
        ],
        inputAudioTranscription: {}, outputAudioTranscription: {},
        contextWindowCompression: { slidingWindow: {} }
      };

      if (resumptionHandle) {
        setupMsg.resumptionHandle = resumptionHandle;
      }

      upstream.send(JSON.stringify({ setup: setupMsg }));
      queue.splice(0).forEach(m => upstream.send(m));
    });

    upstream.on('message', (d) => {
      const str = d.toString();
      try {
        const parsed = JSON.parse(str);
        if (parsed.sessionResumptionUpdate?.resumptionHandle) {
          resumptionHandle = parsed.sessionResumptionUpdate.resumptionHandle;
        }
        if (parsed.goAway) {
          console.log('[Upstream] Received GoAway, session will resume on next connection');
        }
      } catch (e) {}

      if (client.readyState === 1) client.send(str);
    });

    upstream.on('close', (c, r) => {
      console.log('upstream closed', c, redact(r.toString()));
      if (client.readyState === 1 && c !== 1000 && resumptionHandle) {
        console.log('[Upstream] Attempting server-side resumption...');
        setTimeout(connectUpstream, 1000);
      } else {
        client.close();
      }
    });

    upstream.on('error', (e) => {
      console.error('upstream error', redact(e.message));
    });
  }

  connectUpstream();

  client.on('message', (d) => {
    if (upstream && upstream.readyState === 1) {
      upstream.send(d.toString());
    } else {
      queue.push(d.toString());
    }
  });

  client.on('close', () => {
    clearTimeout(sessionTimer);
    if (upstream) upstream.close();
  });
});

server.listen(PORT, () => console.log(`http://localhost:${PORT}`));
