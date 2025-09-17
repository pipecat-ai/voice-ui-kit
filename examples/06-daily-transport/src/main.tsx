import { StrictMode } from "react";
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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <FullScreenContainer>
      <PipecatAppBase
        connectParams={{
          url: "https://your-domain.daily.co/your-room",
          token: "<YOUR_DAILY_ROOM_TOKEN>",
        }}
        transportType="daily"
        micEnabled={false} // Disable mic by default
        camEnabled={false} // Disable cam by default
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
            <Card
              size="lg"
              shadow="xlong"
              noGradientBorder={false}
              rounded="xl"
            >
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
          )
        }
      </PipecatAppBase>
    </FullScreenContainer>
  </StrictMode>
);
