"use client";

import {
  ConsoleTemplate,
  FullScreenContainer,
  ThemeProvider,
} from "@pipecat-ai/voice-ui-kit";
import React, { useState } from "react";

type TransportType = "smallwebrtc" | "daily" | "websocket";

const TRANSPORT_OPTIONS: { value: TransportType; label: string }[] = [
  { value: "smallwebrtc", label: "SmallWebRTC" },
  { value: "daily", label: "Daily" },
  { value: "websocket", label: "WebSocket" },
];

type TransportProps = Pick<
  React.ComponentProps<typeof ConsoleTemplate>,
  "startBotParams" | "transportOptions"
>;

function getTransportProps(
  type: TransportType,
  botHost: string,
): TransportProps {
  switch (type) {
    case "smallwebrtc":
      return {
        startBotParams: {
          endpoint: `${botHost}/start`,
          requestData: {
            createDailyRoom: false,
            enableDefaultIceServers: true,
            transport: "webrtc",
          },
        },
        transportOptions: {
          waitForICEGathering: true,
        },
      };
    case "daily":
      return {
        startBotParams: {
          endpoint: `${botHost}/start`,
          requestData: {
            createDailyRoom: true,
            transport: "daily",
          },
        },
      };
    case "websocket":
      return {
        startBotParams: {
          endpoint: `${botHost}/start`,
          requestData: {
            transport: "websocket",
          },
        },
      };
  }
}

export default function Home() {
  const botHost = process.env.NEXT_PUBLIC_BOT_HOST ?? "";
  const [transportType, setTransportType] =
    useState<TransportType>("smallwebrtc");
  const { startBotParams, transportOptions } = getTransportProps(
    transportType,
    botHost,
  );

  return (
    <ThemeProvider>
      <FullScreenContainer className="items-stretch justify-start">
        <div
          style={{
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            borderBottom: "1px solid var(--border)",
            background: "var(--background)",
          }}
        >
          <label
            htmlFor="transport-select"
            style={{
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "var(--foreground)",
            }}
          >
            Transport:
          </label>
          <select
            id="transport-select"
            value={transportType}
            onChange={(e) => setTransportType(e.target.value as TransportType)}
            style={{
              padding: "4px 8px",
              borderRadius: "6px",
              border: "1px solid var(--border)",
              background: "var(--background)",
              color: "var(--foreground)",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            {TRANSPORT_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <ConsoleTemplate
            key={transportType}
            transportType={transportType}
            startBotParams={startBotParams}
            transportOptions={transportOptions}
            noUserVideo={true}
          />
        </div>
      </FullScreenContainer>
    </ThemeProvider>
  );
}
