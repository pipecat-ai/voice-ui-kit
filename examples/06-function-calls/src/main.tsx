import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Badge,
  Button,
  CircularWaveform,
  FullScreenContainer,
  FunctionCallContent,
  MessageContainer,
  Thinking,
} from "@pipecat-ai/voice-ui-kit";
import type { ConversationMessage, FunctionCallData } from "@pipecat-ai/voice-ui-kit";

import "./index.css";

type AgentState = "idle" | "listening" | "thinking" | "speaking";

type Step =
  | { kind: "status"; state: AgentState }
  | { kind: "say"; role: "user" | "assistant"; text: string }
  | { kind: "think"; text: string }
  | {
      kind: "tool";
      name: string;
      args: Record<string, unknown>;
      result: Record<string, unknown>;
      ms: number;
    }
  | { kind: "wait"; ms: number }
  | { kind: "end" };

type Entry =
  | { id: string; type: "message"; role: "user" | "assistant"; text: string; t: string }
  | { id: string; type: "think"; text: string; full: string; t: string }
  | { id: string; type: "tool"; call: FunctionCallData; ms?: number; t: string }
  | { id: string; type: "end"; t: string };

type Patch = { text?: string; call?: FunctionCallData; ms?: number };

/* The mock "server": one scripted support call (a damaged-item refund).
   Steps carry the same shapes a pipecat server emits over RTVI: transcripts,
   thinking states, and function calls with args / result / status. */
const SCENARIO: Step[] = [
  { kind: "status", state: "speaking" },
  {
    kind: "say",
    role: "assistant",
    text: "Thanks for calling Aurora Home and Garden support, this is Ava. How can I help you today?",
  },
  { kind: "status", state: "listening" },
  {
    kind: "say",
    role: "user",
    text: "Hi. My order AUR-4521 arrived yesterday and the desk lamp is broken. I want a refund.",
  },
  {
    kind: "think",
    text: "Damaged item claim. Policy: verify the caller before touching account data, then pull the order. Then check eligibility: delivered under 30 days, and damage claims ship no return.",
  },
  {
    kind: "tool",
    name: "verify_identity",
    args: { caller_ref: "+34 *** 417", method: "caller_id_match" },
    result: { verified: true, account: "D. Garcia" },
    ms: 420,
  },
  {
    kind: "tool",
    name: "lookup_order",
    args: { order_id: "AUR-4521" },
    result: {
      status: "delivered",
      delivered: "2026-10-28",
      items: ["desk lamp x1"],
      total: 39.9,
    },
    ms: 640,
  },
  {
    kind: "tool",
    name: "check_refund_policy",
    args: { order_id: "AUR-4521", reason: "damaged_on_arrival" },
    result: {
      eligible: true,
      window_days: 30,
      return_required: false,
      method: "original_payment",
    },
    ms: 380,
  },
  {
    kind: "think",
    text: "Caller verified, delivered 2 days ago, inside the 30-day window, and the damage exception applies. Approve a full refund to the original payment method, no return shipment needed.",
  },
  { kind: "status", state: "speaking" },
  {
    kind: "tool",
    name: "issue_refund",
    args: { order_id: "AUR-4521", amount: 39.9, method: "original_payment" },
    result: { refund_id: "RF-99120", eta_days: 3 },
    ms: 900,
  },
  {
    kind: "say",
    role: "assistant",
    text: "I'm really sorry about the lamp. I've verified your account and issued the full refund of 39.90 to your card, reference RF-99120. You should see it within 3 working days, and there's no need to send anything back.",
  },
  { kind: "status", state: "listening" },
  { kind: "say", role: "user", text: "Oh wow, that was fast. Thank you." },
  { kind: "status", state: "speaking" },
  {
    kind: "say",
    role: "assistant",
    text: "You're welcome. Is there anything else I can help you with today?",
  },
  { kind: "status", state: "listening" },
  { kind: "wait", ms: 2600 },
  { kind: "status", state: "speaking" },
  { kind: "say", role: "assistant", text: "Have a great day. Goodbye!" },
  { kind: "end" },
];

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

let seq = 0;
const nextId = () => `fc${++seq}`;

function pickVoice(): SpeechSynthesisVoice | null {
  try {
    const vs = speechSynthesis.getVoices();
    return (
      vs.find(
        (v) => /^en/i.test(v.lang) && /female|zira|aria|jenny|libby|sonia|samantha/i.test(v.name),
      ) ||
      vs.find((v) => /^en/i.test(v.lang)) ||
      null
    );
  } catch {
    return null;
  }
}

function speak(text: string): Promise<void> {
  return new Promise((resolve) => {
    const fallbackMs = 900 + text.length * 55;
    try {
      const u = new SpeechSynthesisUtterance(text);
      const v = pickVoice();
      if (v) u.voice = v;
      u.rate = 1.04;
      let done = false;
      const fin = () => {
        if (!done) {
          done = true;
          resolve();
        }
      };
      u.onend = fin;
      u.onerror = fin;
      speechSynthesis.speak(u);
      setTimeout(fin, 1500 + text.length * 95); // safety net if onend never fires
    } catch {
      setTimeout(resolve, fallbackMs);
    }
  });
}

/* ponytail: browsers give no MediaStreamTrack from speechSynthesis, so the
   mock bot's ring is driven by a synthesized voice-like tone (saw + flutter).
   A real pipecat server passes the actual bot audio track; swap it in and
   delete this. */
interface BotVoice {
  track: MediaStreamTrack;
  speakOn(): void;
  speakOff(): void;
}

function makeBotVoice(): BotVoice | null {
  const Ctx: typeof AudioContext | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  const ctx = new Ctx();
  const dest = ctx.createMediaStreamDestination();
  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.value = 175;
  const vib = ctx.createOscillator();
  vib.frequency.value = 5.3;
  const vibGain = ctx.createGain();
  vibGain.gain.value = 55;
  vib.connect(vibGain);
  vibGain.connect(osc.frequency);
  const amp = ctx.createGain();
  amp.gain.value = 0;
  const trem = ctx.createOscillator();
  trem.frequency.value = 7.1;
  const tremGain = ctx.createGain();
  tremGain.gain.value = 0;
  trem.connect(tremGain);
  tremGain.connect(amp.gain);
  osc.connect(amp);
  amp.connect(dest);
  osc.start();
  vib.start();
  trem.start();
  return {
    track: dest.stream.getAudioTracks()[0],
    speakOn: () => {
      amp.gain.setTargetAtTime(0.3, ctx.currentTime, 0.05);
      tremGain.gain.setTargetAtTime(0.14, ctx.currentTime, 0.05);
    },
    speakOff: () => {
      amp.gain.setTargetAtTime(0, ctx.currentTime, 0.09);
      tremGain.gain.setTargetAtTime(0, ctx.currentTime, 0.09);
    },
  };
}

async function runCall(io: {
  setState: (s: AgentState) => void;
  push: (e: Entry) => void;
  patch: (id: string, p: Patch) => void;
  voice: BotVoice | null;
  isStopped: () => boolean;
}): Promise<"done" | "stopped"> {
  const { setState, push, patch, voice, isStopped } = io;
  const t0 = performance.now();
  const stamp = () => `+${((performance.now() - t0) / 1000).toFixed(1)}s`;
  for (const step of SCENARIO) {
    if (isStopped()) return "stopped";
    if (step.kind === "status") {
      setState(step.state);
      await sleep(300);
    } else if (step.kind === "say") {
      push({ id: nextId(), type: "message", role: step.role, text: step.text, t: stamp() });
      if (step.role === "assistant") {
        setState("speaking");
        voice?.speakOn();
        await speak(step.text);
        voice?.speakOff();
      } else {
        await sleep(1600);
      }
    } else if (step.kind === "think") {
      setState("thinking");
      const id = nextId();
      push({ id, type: "think", text: "", full: step.text, t: stamp() });
      for (let i = 2; i <= step.text.length; i += 4) {
        if (isStopped()) return "stopped";
        patch(id, { text: step.text.slice(0, i) });
        await sleep(10);
      }
      patch(id, { text: step.text });
      await sleep(400);
    } else if (step.kind === "tool") {
      setState("thinking");
      const id = nextId();
      const call: FunctionCallData = {
        function_name: step.name,
        tool_call_id: id,
        args: step.args,
        status: "started",
      };
      push({ id, type: "tool", call, t: stamp() });
      const started = performance.now();
      await sleep(step.ms);
      patch(id, {
        call: { ...call, status: "completed", result: step.result },
        ms: Math.round(performance.now() - started),
      });
    } else if (step.kind === "wait") {
      await sleep(step.ms);
    } else {
      setState("idle");
      push({ id: nextId(), type: "end", t: stamp() });
      return "done";
    }
  }
  return "done";
}

export default function App() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [agentState, setAgentState] = useState<AgentState>("idle");
  const [running, setRunning] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [micTrack, setMicTrack] = useState<MediaStreamTrack | null>(null);
  const [error, setError] = useState("");
  const voiceRef = useRef<BotVoice | null>(null);
  const stopRef = useRef(false);
  const feedRef = useRef<HTMLDivElement | null>(null);

  const push = (entry: Entry) => setEntries((es) => [...es, entry]);
  const patch = (id: string, p: Patch) =>
    setEntries((es) => es.map((e): Entry => (e.id === id ? ({ ...e, ...p } as Entry) : e)));

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight });
  }, [entries]);

  async function start(): Promise<void> {
    stopRef.current = false;
    setEntries([]);
    setError("");
    setRunning(true);
    try {
      if (!voiceRef.current) voiceRef.current = makeBotVoice(); // user gesture: AudioContext allowed
    } catch (e) {
      setError(String(e));
    }
    await runCall({
      setState: setAgentState,
      push,
      patch,
      voice: voiceRef.current,
      isStopped: () => stopRef.current,
    });
    setRunning(false);
  }

  function stop(): void {
    stopRef.current = true;
    try {
      speechSynthesis.cancel();
    } catch {
      /* noop */
    }
    voiceRef.current?.speakOff();
    setRunning(false);
    setAgentState("idle");
  }

  async function toggleMic(): Promise<void> {
    if (micOn) {
      setMicOn(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicTrack(stream.getAudioTracks()[0] ?? null);
      setMicOn(true);
    } catch (e) {
      setError("Microphone unavailable: " + (e as Error).message);
    }
  }

  const tools = entries.filter((e) => e.type === "tool");
  const toolMs = tools.reduce((a, e) => a + (e.ms ?? 0), 0);
  const thoughts = entries.filter((e) => e.type === "think");
  const thinking = agentState === "thinking";
  // ring source: the bot's voice while it speaks, your mic while it listens
  const audioTrack =
    agentState === "speaking"
      ? (voiceRef.current?.track ?? null)
      : micOn && micTrack
        ? micTrack
        : null;
  const lastMsg = [...entries].reverse().find((e) => e.type === "message");

  return (
    <FullScreenContainer>
      <div className="ccb">
        <header className="ccb-explain">
          <div>
            <h1>Call Center Brain</h1>
            <p className="ccb-learn">
              <strong>What you'll learn:</strong> a voice agent's spoken answer is the last step
              of a pipeline you never hear. This simulated support call makes {tools.length || 4}{" "}
              function calls ({toolMs || 2340} ms of tool latency) and {thoughts.length || 2}{" "}
              thinking passes, none of it audible in the voice alone.
            </p>
            <p className="ccb-do">
              <strong>What to do:</strong> press <em>Start call</em>, watch the ring react to the
              voice, and expand any function-call chip to see the exact arguments and results the
              agent exchanged.
            </p>
          </div>
          <div className="ccb-stats">
            <Badge>{tools.length} tool calls</Badge>
            <Badge>{toolMs} ms tool latency</Badge>
            <Badge>{thoughts.length} thinking passes</Badge>
          </div>
        </header>

        <main className="ccb-grid">
          <section className="ccb-stage">
            <div className="ccb-orb">
              <CircularWaveform
                audioTrack={audioTrack}
                isThinking={thinking}
                numBars={72}
                sensitivity={1.4}
              />
            </div>
            <div className="ccb-status">
              <span className={"ccb-dot " + agentState} />
              {running ? agentState : "idle"} · {micOn ? "mic on" : "mic off"}
            </div>
            <div className="ccb-caption">
              {lastMsg
                ? `${lastMsg.role === "user" ? "caller" : "agent"}: ${lastMsg.text}`
                : "Press Start call to begin the simulated support line."}
            </div>
            <div className="ccb-controls">
              {running ? (
                <Button onClick={stop}>End call</Button>
              ) : (
                <Button onClick={start}>Start call</Button>
              )}
              <Button variant="outline" onClick={toggleMic}>
                {micOn ? "Mic: on" : "Enable mic"}
              </Button>
            </div>
            {error && <p className="ccb-err">{error}</p>}
          </section>

          <section className="ccb-brain">
            <h2>Agent trajectory</h2>
            <div className="ccb-feed" ref={feedRef}>
              {entries.map((e) => {
                const msg: ConversationMessage = {
                  role: e.type === "message" ? e.role : "system",
                  parts: [{ text: e.type === "message" ? e.text : "", final: true, createdAt: e.t }],
                  createdAt: e.t,
                };
                return (
                  <div key={e.id} className={"ccb-entry ccb-" + e.type}>
                    <div className="ccb-entry-meta">
                      <span className="ccb-t">{e.t}</span>
                      <span className="ccb-kind">
                        {e.type === "tool" ? "function call" : e.type}
                      </span>
                      {e.type === "tool" && e.ms != null && (
                        <span className="ccb-ms">{e.ms} ms</span>
                      )}
                    </div>
                    {e.type === "message" && <MessageContainer message={msg} />}
                    {e.type === "think" && (
                      <div className="ccb-think">
                        <em>{e.text}</em>
                      </div>
                    )}
                    {e.type === "tool" && <FunctionCallContent functionCall={e.call} />}
                    {e.type === "end" && <div className="ccb-end">call ended</div>}
                  </div>
                );
              })}
              {thinking && running && (
                <div className="ccb-live">
                  <Thinking />
                </div>
              )}
            </div>
          </section>
        </main>

        <footer className="ccb-foot">
          Built with{" "}
          <a href="https://github.com/pipecat-ai/voice-ui-kit" target="_blank" rel="noreferrer">
            voice-ui-kit
          </a>{" "}
          · the call is mocked in src/main.tsx; swap runCall() for a real pipecat server via
          PipecatAppBase (see examples/04-vite)
        </footer>
      </div>
    </FullScreenContainer>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
