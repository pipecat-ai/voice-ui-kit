"use client";

import {
  ConsoleTemplate,
  FullScreenContainer,
  ThemeProvider,
} from "@pipecat-ai/voice-ui-kit";

export default function Home() {
  const botHost = process.env.NEXT_PUBLIC_BOT_HOST ?? "";

  return (
    <ThemeProvider>
      <FullScreenContainer>
          <ConsoleTemplate
              startBotParams={{
                  endpoint: `${botHost}/start`,
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
