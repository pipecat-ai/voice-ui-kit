import { usePipecatClientTransportState } from "@pipecat-ai/client-react";
import {
  Button,
  ConnectButton,
  ControlBar,
  ControlBarDivider,
  type PipecatBaseChildProps,
  TranscriptOverlay,
  UserAudioControl,
} from "@pipecat-ai/voice-ui-kit";
import { PlasmaVisualizer } from "@pipecat-ai/voice-ui-kit/webgl";
import { LogOutIcon } from "lucide-react";

export const App = ({
  handleConnect,
  handleDisconnect,
}: Partial<PipecatBaseChildProps>) => {
  const transportState = usePipecatClientTransportState();
  return (
    <main className="relative flex flex-col gap-0 h-full w-full justify-end items-center">
      <PlasmaVisualizer />

      <div className="absolute inset-0 flex flex-col gap-4 items-center justify-center">
        <TranscriptOverlay participant="remote" className="max-w-md" />
      </div>

      {transportState === "ready" ? (
        <div className="relative z-10 h-1/2 flex flex-col w-full items-center justify-center">
          <ControlBar size="xl" shadow="xlong" withGradientBorder rounded="xl">
            <UserAudioControl size="lg" variant="outline" />
            <ControlBarDivider />
            <Button
              size="lg"
              isIcon={true}
              variant="outline"
              onClick={() => handleDisconnect?.()}
            >
              <LogOutIcon />
            </Button>
          </ControlBar>
        </div>
      ) : (
        <div className="absolute w-full h-full flex items-center justify-center">
          <ConnectButton size="xl" onConnect={() => handleConnect?.()} />
        </div>
      )}
    </main>
  );
};
