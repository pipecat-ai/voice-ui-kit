import { UserAudioControl } from "./components/pipecat/user-audio-control";

export default function App() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6">
      <h1 className="text-lg font-semibold">voice-ui-kit demo</h1>
      <UserAudioControl />
    </main>
  );
}
