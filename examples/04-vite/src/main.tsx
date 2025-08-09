import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import {
  Card,
  CardContent,
  ConnectButton,
  ErrorCard,
  FullScreenContainer,
  PipecatAppBase,
  SpinLoader,
} from "@pipecat-ai/voice-ui-kit";

import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <FullScreenContainer>
      <PipecatAppBase
        connectParams={{
          connectionUrl: "/api/offer",
        }}
        transportType="smallwebrtc"
        noThemeProvider
      >
        {({ client, handleConnect, handleDisconnect, error }) =>
          !client ? (
            <SpinLoader />
          ) : error ? (
            <ErrorCard>{error}</ErrorCard>
          ) : (
            <Card>
              <CardContent>
                <ConnectButton
                  onConnect={handleConnect}
                  onDisconnect={handleDisconnect}
                />
              </CardContent>
            </Card>
          )
        }
      </PipecatAppBase>
    </FullScreenContainer>
  </StrictMode>,
);
