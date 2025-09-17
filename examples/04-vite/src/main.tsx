import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";

import type { PipecatBaseChildProps } from "@pipecat-ai/voice-ui-kit";
import {
  Card,
  CardContent,
  ConnectButton,
  Divider,
  ErrorCard,
  FullScreenContainer,
  PipecatAppBase,
  SpinLoader,
  UserAudioControl,
  VoiceVisualizer,
} from "@pipecat-ai/voice-ui-kit";

import "./index.css";

export const App = ({
  client,
  handleConnect,
  handleDisconnect,
}: PipecatBaseChildProps) => {
  useEffect(() => {
    client?.initDevices();
  }, [client]);

  return (
    <Card size="lg" shadow="xlong" rounded="xl">
      <CardContent className="flex flex-col gap-4">
        <VoiceVisualizer
          participantType="bot"
          className="bg-accent rounded-lg"
        />
        <Divider />
        <div className="flex flex-col gap-4">
          <UserAudioControl size="lg" />
          <ConnectButton
            size="lg"
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
        </div>
      </CardContent>
    </Card>
  );
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <FullScreenContainer>
      <PipecatAppBase
        connectParams={{
          webrtcUrl: "/api/offer",
        }}
        transportType="smallwebrtc"
        noThemeProvider
      >
        {({
          client,
          handleConnect,
          handleDisconnect,
          error,
        }: PipecatBaseChildProps) =>
          !client ? (
            <SpinLoader />
          ) : error ? (
            <ErrorCard>{error}</ErrorCard>
          ) : (
            <App
              client={client}
              handleConnect={handleConnect}
              handleDisconnect={handleDisconnect}
            />
          )
        }
      </PipecatAppBase>
    </FullScreenContainer>
  </StrictMode>
);
