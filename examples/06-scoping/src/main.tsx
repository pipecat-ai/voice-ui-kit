import { StrictMode, useEffect, useLayoutEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import type { PipecatBaseChildProps } from "@pipecat-ai/voice-ui-kit";
import {
  Button,
  Card,
  CardContent,
  ConnectButton,
  Divider,
  ErrorCard,
  PipecatAppBase,
  Select,
  SelectContent,
  SelectGuide,
  SelectItem,
  SelectTrigger,
  SpinLoader,
  UserAudioControl,
  useTheme,
  VoiceVisualizer,
} from "@pipecat-ai/voice-ui-kit";

import "./index.css";

export const App = ({
  client,
  handleConnect,
  handleDisconnect,
}: PipecatBaseChildProps) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    client?.initDevices();
  }, [client]);

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="w-lg mx-auto p-4">
      <div className="flex flex-col gap-4 items-center justify-center rounded-lg bg-gray-200 p-4">
        Styles will not apply here, as outside of scope
        <Button>Sad unstyled button :(</Button>
      </div>
      <div className="vkui-root" data-theme={theme}>
        <div className="bg-background text-foreground">
          <Divider size="lg" />
          <div className="flex flex-col gap-4 mx-auto">
            <Card size="lg" shadow="xlong" rounded="xl">
              <CardContent className="flex flex-col gap-4">
                <div className="bg-accent rounded-lg w-full flex justify-center items-center">
                  <VoiceVisualizer participantType="bot" />
                </div>
                <Divider />
                <div className="flex flex-col gap-4">
                  <UserAudioControl size="lg" />
                  <ConnectButton
                    size="lg"
                    onConnect={handleConnect}
                    onDisconnect={handleDisconnect}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          <Divider size="lg" />
          {mounted && (
            <Select value={theme} onValueChange={(v) => setTheme(v)}>
              <SelectTrigger className="w-full">
                <SelectGuide>Switch theme:</SelectGuide>
                {theme || "system"}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">system</SelectItem>
                <SelectItem value="light">light</SelectItem>
                <SelectItem value="dark">dark</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </div>
  );
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PipecatAppBase
      connectParams={{
        webrtcUrl: "/api/offer",
      }}
      transportType="smallwebrtc"
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
            client={client}
            handleConnect={handleConnect}
            handleDisconnect={handleDisconnect}
          />
        )
      }
    </PipecatAppBase>
  </StrictMode>
);
