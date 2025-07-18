"use client";

import {
  ConsoleTemplate,
  FullScreenContainer,
  ThemeProvider,
} from "@pipecat-ai/voice-ui-kit";

export default function Home() {
  return (
    <ThemeProvider>
      <FullScreenContainer>
        <ConsoleTemplate
          connectParams={{
            endpoint: "/api/connect",
          }}
          transportType="daily"
        />
      </FullScreenContainer>
    </ThemeProvider>
  );
}
