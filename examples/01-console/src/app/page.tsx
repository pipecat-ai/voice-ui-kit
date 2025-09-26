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
          transportType="smallwebrtc"
          connectParams={{
            webrtcUrl: "/api/offer",
          }}
          noUserVideo
        />
      </FullScreenContainer>
    </ThemeProvider>
  );
}
