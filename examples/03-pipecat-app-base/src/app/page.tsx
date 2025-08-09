"use client";

import {
  ErrorCard,
  FullScreenContainer,
  PipecatAppBase,
  PipecatBaseChildProps,
  SpinLoader,
} from "@pipecat-ai/voice-ui-kit";

import { App } from "./app";

export default function Home() {
  return (
    <FullScreenContainer>
      <PipecatAppBase
        transportType="smallwebrtc"
        connectParams={{
          connectionUrl: "/api/offer",
        }}
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
              error={error}
            />
          )
        }
      </PipecatAppBase>
    </FullScreenContainer>
  );
}
