"use client";

import { AudioClientHelper } from "@pipecat-ai/voice-ui-kit";

import { App } from "./app";

export default function Home() {
  return (
    <AudioClientHelper
      transportType="daily"
      connectParams={{
        endpoint: "/api/connect",
      }}
    >
      <App />
    </AudioClientHelper>
  );
}
