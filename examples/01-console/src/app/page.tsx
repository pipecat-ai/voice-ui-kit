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
              startBotParams={{
                  endpoint: "/start",
                  requestData: {
                      createDailyRoom: false,
                      enableDefaultIceServers: true,
                      transport: "webrtc",
                  },
              }}
              transportType="smallwebrtc"
              transportOptions={{
                  waitForICEGathering: true,
              }}
          />
      </FullScreenContainer>
    </ThemeProvider>
  );
}
