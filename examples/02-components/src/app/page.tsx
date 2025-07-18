"use client";

import { FullScreenContainer, ThemeProvider } from "@pipecat-ai/voice-ui-kit";
import { App } from "./components/App";

export default function Home() {
  return (
    <ThemeProvider>
      <FullScreenContainer>
        <App
          transportType="daily"
          connectParams={{
            endpoint: "/api/connect",
          }}
        />
      </FullScreenContainer>
    </ThemeProvider>
  );
}
