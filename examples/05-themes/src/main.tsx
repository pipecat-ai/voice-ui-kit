// @ts-expect-error - fontsource types are not published
import "@fontsource/vt323";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import type { PipecatBaseChildProps } from "@pipecat-ai/voice-ui-kit";
import {
  ErrorCard,
  FullScreenContainer,
  PipecatAppBase,
  SpinLoader,
  ThemeProvider,
} from "@pipecat-ai/voice-ui-kit";

import { App } from "./components/App";

import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="terminal" disableStorage>
      <FullScreenContainer className="px-4">
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
                handleConnect={handleConnect}
                handleDisconnect={handleDisconnect}
              />
            )
          }
        </PipecatAppBase>
      </FullScreenContainer>
    </ThemeProvider>
  </StrictMode>
);
