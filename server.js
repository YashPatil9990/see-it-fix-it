import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { readFileSync } from 'fs';

const { GEMINI_API_KEY, LIVE_MODEL = 'gemini-3.1-flash-live-preview',
        GUIDE_MODEL = 'gemini-3.8-flash', PORT = 3000 } = process.env;
if (!GEMINI_API_KEY) { console.error('Set GEMINI_API_KEY in .env'); process.exit(1); }

const SYSTEM_PROMPT = readFileSync('./prompt.txt', 'utf8');
const UPSTREAM = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=' + GEMINI_API_KEY;

const app = express();
app.use(express.json({ limit: '25mb' }));
app.use(express.static('public'));

// ---- Guide generator: transcript + screenshots -> structured JSON ----
app.post('/api/guide', async (req, res) => {
  try {
    const { transcript = '', shots = [] } = req.body; // shots: [{t:"01:20", b64:"..."}]
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
    if (!r.ok) return res.status(r.status).json(j);
    res.json(JSON.parse(j.candidates[0].content.parts[0].text));
  } catch (e) { console.error(e); res.status(500).json({ error: String(e) }); }
});

// ---- Live relay: browser <-> server <-> Gemini (key never leaves server) ----
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/live' });

wss.on('connection', (client) => {
  const upstream = new WebSocket(UPSTREAM);
  const queue = [];
  upstream.on('open', () => {
    upstream.send(JSON.stringify({ setup: {
      model: `models/${LIVE_MODEL}`,
      generationConfig: { responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } },
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      tools: [
        { functionDeclarations: [{ name: 'set_timer',
          description: 'Start a countdown timer for the user.',
          parameters: { type: 'OBJECT', required: ['seconds','label'], properties: {
            seconds: { type: 'INTEGER' }, label: { type: 'STRING' } } } }] }
      ],
      inputAudioTranscription: {}, outputAudioTranscription: {},
      contextWindowCompression: { slidingWindow: {} } } }));
    queue.splice(0).forEach(m => upstream.send(m));
  });
  // browser -> Gemini (audio, video frames, tool responses)
  client.on('message', (d) => upstream.readyState === 1 ? upstream.send(d.toString()) : queue.push(d.toString()));
  // Gemini -> browser
  upstream.on('message', (d) => client.readyState === 1 && client.send(d.toString()));
  upstream.on('close', (c, r) => { console.log('upstream closed', c, r.toString()); client.close(); });
  upstream.on('error', (e) => console.error('upstream error', e.message));
  client.on('close', () => upstream.close());
});

server.listen(PORT, () => console.log(`http://localhost:${PORT}`));
