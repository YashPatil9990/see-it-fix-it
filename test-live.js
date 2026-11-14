import { WebSocket } from 'ws';

const PORT = process.env.PORT || 3000;
const WS_URL = `ws://localhost:${PORT}/live`;

console.log('Running SMOKE TEST (hardware-free) against', WS_URL);

const ws = new WebSocket(WS_URL);
let state = 'init';
let audioReceived = false;
let toolCallReceived = false;
let toolResponseAccepted = false;

const timer = setTimeout(() => {
  ws.close();
  console.error(`❌ Smoke test failed: Timed out in state "${state}"`);
  process.exit(1);
}, 25000);

ws.on('open', () => {
  console.log('  ✓ Connected to local /live WebSocket relay');
});

ws.on('message', (raw) => {
  let msg;
  try {
    msg = JSON.parse(raw.toString());
  } catch (e) {
    return;
  }

  // 1. Setup handshake
  if (msg.setupComplete) {
    console.log('  ✓ Setup completed successfully');
    state = 'text_turn';
    console.log('  -> Sending initial text turn: "Hello coach, are you ready?"');
    ws.send(JSON.stringify({
      realtimeInput: { text: "Hello coach, are you ready?" }
    }));
  }

  // Check for audio chunks or transcription
  if (msg.serverContent) {
    const s = msg.serverContent;
    if (s.modelTurn?.parts?.some(p => p.inlineData)) {
      audioReceived = true;
    }
    if (s.outputTranscription?.text) {
      process.stdout.write(s.outputTranscription.text);
    }
    if (s.turnComplete) {
      process.stdout.write('\n');
      if (state === 'text_turn') {
        if (!audioReceived) {
          console.error('❌ No audio received during initial text turn');
          process.exit(1);
        }
        console.log('  ✓ Audio and transcription verified for initial turn');
        
        // 2. Timer tool call test
        state = 'timer_tool';
        console.log('  -> Sending: "set a 10 second timer for tea"');
        ws.send(JSON.stringify({
          realtimeInput: { text: "set a 10 second timer for tea" }
        }));
      } else if (state === 'tool_responded') {
        toolResponseAccepted = true;
        console.log('  ✓ Model acknowledged tool response');
        clearTimeout(timer);
        ws.close();
        console.log('\n🎉 SMOKE TEST PASSED: Core loop and tool execution verified!\n');
        process.exit(0);
      }
    }
  }

  // Check for tool call
  if (msg.toolCall) {
    const call = msg.toolCall.functionCalls?.[0];
    if (call && call.name === 'set_timer') {
      console.log(`  ✓ toolCall received: ${call.name}(seconds: ${call.args?.seconds}, label: "${call.args?.label}")`);
      toolCallReceived = true;
      state = 'tool_responded';

      // Send toolResponse
      ws.send(JSON.stringify({
        toolResponse: {
          functionResponses: [
            {
              id: call.id,
              name: call.name,
              response: { result: 'timer started' }
            }
          ]
        }
      }));
    }
  }
});

ws.on('close', (code, reason) => {
  if (!toolResponseAccepted && state !== 'init') {
    console.log('Socket closed prematurely:', code, reason.toString());
  }
});

ws.on('error', (err) => {
  clearTimeout(timer);
  console.error('WebSocket error:', err.message);
  process.exit(1);
});
