# Function Calls + Thinking, Live

Example showing how to make a voice agent's function calls and thinking states visible in real time with the Voice UI Kit, in the spirit of [#151](https://github.com/pipecat-ai/voice-ui-kit/issues/151) (live debugging affordances during a call: tool calls, latency, errors).

The call is a mocked call-center scenario (a damaged-item refund), so the example runs with no backend. The mock emits the same shapes a pipecat server sends over RTVI: transcripts, thinking states, and function calls with `args` / `result` / `status`. While the scenario runs you see:

- `CircularWaveform` ring, bound to the active speaker track: a synthesized voice-like tone for the mock bot, your real microphone while the agent listens, plus the `isThinking` pulse while tools run
- `FunctionCallContent` chips per tool call, going from `started` to `completed`, with arguments, results and measured latency in a collapsible
- `MessageContainer` transcript entries and `Thinking` indicator
- live counters: tool calls, total tool latency, thinking passes

## Quick Start

```bash
# Build the voice-ui-kit package (required for workspace dependencies)
cd ../..
pnpm i
pnpm build

# Install dependencies
cd examples/06-function-calls
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) to view the example.

## Going live

To connect a real agent instead of the mock, replace `runCall()` in `src/main.tsx` with `PipecatAppBase` and a transport (see [examples/04-vite](../04-vite)), and feed the same components from the client's conversation and function-call events. The UI side needs no changes: the components consume plain `ConversationMessage` and `FunctionCallData` objects, so the mock and a live call are interchangeable.

The bot side of the ring is driven by a synthesized tone because browsers do not expose `speechSynthesis` as a media track; with a real server, pass the bot's audio track instead (a one-line swap, marked in the code).
