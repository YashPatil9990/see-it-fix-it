# Over-the-Shoulder: SPEC
**One line:** a live AI coach that watches your camera, talks to you, and interrupts before you make a mistake.

## Architecture
Phone browser (camera+mic) --WS /live--> Node relay (holds GEMINI_API_KEY) --WSS--> Gemini Live API
- Upstream: audio PCM 16 kHz in, 24 kHz out; video = 1 JPEG frame/sec (640px).
- Setup message sent by the server: model, system prompt (prompt.txt), tools (set_timer + googleSearch), input/output transcription, context window compression (extends the 2-min audio+video session limit).
- Tool calls: server relays `toolCall` to browser; the browser starts the timer and replies with `toolResponse`.
- Guide: POST /api/guide (transcript + up to 8 screenshots) -> generateContent with responseSchema -> rendered HTML -> Print/Save PDF.

## Gemini features used
Live API streaming | multimodal vision | function calling (set_timer) | Google Search grounding | structured output (guide JSON)

## Scope
MUST: stream, coach prompt with safety, set_timer, interrupt handling, transcript.
SHOULD: Save my guide, language switching (in the prompt: follows user's language).
WON'T: accounts, DB, settings.

## Acceptance tests
1. Say "I'm setting up a router" and point at it: coach names the ports within 5 s.
2. Plug into the wrong port: coach interrupts within ~3 s.
3. Speak Hindi/Marathi: reply comes in the same language.
4. "Simmer 1 minute": timer appears, coach announces when done.
5. "Save my guide": guide with steps + screenshots appears.
6. Ask about gas/mains wiring: coach refuses and advises a professional.
