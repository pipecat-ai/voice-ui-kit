"use client";

import AudioOutput from "@/components/elements/AudioOutput";
import { ClientStatus } from "@/components/elements/ClientStatus";
import ConnectButton from "@/components/elements/ConnectButton";
import PipecatLogo from "@/components/elements/PipecatLogo";
import { SessionInfo } from "@/components/elements/SessionInfo";
import UserAudio from "@/components/elements/UserAudio";
import UserVideo from "@/components/elements/UserVideo";
import { BotAudioPanel } from "@/components/panels/BotAudioPanel";
import { BotVideoPanel } from "@/components/panels/BotVideoPanel";
import ConversationPanel from "@/components/panels/ConversationPanel";
import { EventsPanel } from "@/components/panels/EventsPanel";
import { InfoPanel } from "@/components/panels/InfoPanel";
import ThemeModeToggle from "@/components/ThemeModeToggle";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BotIcon,
  ChevronsLeftRightEllipsisIcon,
  InfoIcon,
  MessagesSquareIcon,
  MicIcon,
} from "@/icons";
import { cn } from "@/lib/utils";
import {
  RTVIClient,
  type RTVIClientOptions,
  type RTVIClientParams,
  Transport,
} from "@pipecat-ai/client-js";
import { RTVIClientAudio, RTVIClientProvider } from "@pipecat-ai/client-react";
import { DailyTransport } from "@pipecat-ai/daily-transport";
import { SmallWebRTCTransport } from "@pipecat-ai/small-webrtc-transport";
import { useEffect, useState } from "react";

export interface ConsoleTemplateProps {
  /**
   * Sets the audio codec. Only applicable for SmallWebRTC transport.
   * Defaults to "default" which uses the browser's default codec.
   */
  audioCodec?: string;
  /**
   * Options for configuring the RTVI client.
   */
  clientOptions?: Partial<RTVIClientOptions>;
  /**
   * Disables audio output for the bot. The bot may still send audio, but it won't be played.
   */
  noAudioOutput?: boolean;
  /**
   * Disables audio visualization for the bot.
   * The bot may still send audio, but it won't be visualized.
   */
  noBotAudio?: boolean;
  /**
   * Disables video visualization for the bot.
   * The bot may still send video, but it won't be displayed.
   */
  noBotVideo?: boolean;
  /**
   * Disables the conversation panel.
   * The bot may still send messages, but they won't be displayed.
   */
  noConversation?: boolean;
  /**
   * Disables the logo in the header.
   */
  noLogo?: boolean;
  /**
   * Disables the metrics panel.
   * The bot may still send metrics, but they won't be displayed.
   */
  noMetrics?: boolean;
  /**
   * Disables the theme switcher in the header.
   * Useful when there's an application-level theme switcher or when the theme is controlled globally.
   */
  noThemeSwitch?: boolean;
  /**
   * Disables user audio input entirely.
   */
  noUserAudio?: boolean;
  /**
   * Disables user video input entirely.
   */
  noUserVideo?: boolean;
  onConnect: () => Promise<Response>;
  /**
   * Title displayed in the header.
   * Defaults to "Pipecat Playground".
   */
  title?: string;
  /**
   * Type of transport to use for the RTVI client.
   * - "daily" for Daily Transport
   * - "smallwebrtc" for SmallWebRTC Transport
   * Defaults to "daily".
   */
  transportType?: "daily" | "smallwebrtc";
  /**
   * Sets the video codec. Only applicable for SmallWebRTC transport.
   * Defaults to "default" which uses the browser's default codec.
   */
  videoCodec?: string;
}

const defaultParams: RTVIClientParams = {
  baseUrl: "noop",
};

export const ConsoleTemplate: React.FC<ConsoleTemplateProps> = ({
  audioCodec = "default",
  clientOptions = {
    params: defaultParams,
  },
  onConnect,
  noAudioOutput = false,
  noBotAudio = false,
  noBotVideo = false,
  noConversation = false,
  noLogo = false,
  noMetrics = false,
  noThemeSwitch = false,
  noUserAudio = false,
  noUserVideo = false,
  title = "Pipecat Playground",
  transportType = "daily",
  videoCodec = "default",
}) => {
  const [isBotAreaCollapsed, setIsBotAreaCollapsed] = useState(false);
  const [isInfoPanelCollapsed, setIsInfoPanelCollapsed] = useState(false);
  const [isEventsPanelCollapsed, setIsEventsPanelCollapsed] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [participantId, setParticipantId] = useState("");
  const [rtviClient, setRtviClient] = useState<RTVIClient | null>(null);
  const [isClientReady, setIsClientReady] = useState(false);

  const { resolvedTheme } = useTheme();

  useEffect(
    function initClient() {
      // Only run on client side
      if (typeof window === "undefined") return;

      let transport: DailyTransport | SmallWebRTCTransport;
      switch (transportType) {
        case "smallwebrtc":
          transport = new SmallWebRTCTransport();
          break;
        case "daily":
        default:
          transport = new DailyTransport();
          transport.dailyCallClient.on("meeting-session-updated", (event) => {
            setSessionId(event.meetingSession.id);
          });
          break;
      }
      const client = new RTVIClient({
        enableCam: !noUserVideo,
        enableMic: !noUserAudio,
        customConnectHandler: (async (_params, timeout) => {
          if (transportType === "smallwebrtc") {
            return Promise.resolve();
          }
          try {
            const response = await onConnect();
            clearTimeout(timeout);
            if (response.ok) {
              return response.json();
            }
            return Promise.reject(
              new Error(`Connection failed: ${response.status}`),
            );
          } catch (err) {
            return Promise.reject(err);
          }
        }) as (
          params: RTVIClientParams,
          timeout: NodeJS.Timeout | undefined,
          abortController: AbortController,
        ) => Promise<void>,
        ...clientOptions,
        params: {
          ...(clientOptions.params ?? defaultParams),
        },
        transport: (clientOptions?.transport as Transport) ?? transport,
        callbacks: {
          onParticipantJoined: (participant) => {
            setParticipantId(participant.id || "");
            clientOptions?.callbacks?.onParticipantJoined?.(participant);
          },
          onTrackStarted(track, participant) {
            if (participant?.id && participant.local)
              setParticipantId(participant.id);
            clientOptions?.callbacks?.onTrackStarted?.(track, participant);
          },
        },
      });
      client.initDevices();
      setRtviClient(client);
      setIsClientReady(true);
      return () => {
        /**
         * Disconnect client when component unmounts or options change.
         */
        client.disconnect();
      };
    },
    [clientOptions, noUserAudio, noUserVideo, onConnect, transportType],
  );

  useEffect(
    function updateSmallWebRTCCodecs() {
      if (!rtviClient || transportType !== "smallwebrtc") return;
      const transport = rtviClient.transport as SmallWebRTCTransport;
      if (audioCodec) {
        transport.setAudioCodec(audioCodec);
      }
      if (videoCodec) {
        transport.setVideoCodec(videoCodec);
      }
    },
    [audioCodec, rtviClient, videoCodec, transportType],
  );

  const handleConnect = async () => {
    if (!rtviClient) return;
    try {
      await rtviClient.connect();
    } catch {
      await rtviClient.disconnect();
    }
  };

  const handleDisconnect = async () => {
    if (!rtviClient) return;
    await rtviClient.disconnect();
  };

  // Return loading state until client is ready (prevents hydration mismatch)
  if (!isClientReady || !rtviClient) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div>Loading...</div>
      </div>
    );
  }

  const noBotArea = noBotAudio && noBotVideo;
  const noConversationPanel = noConversation && noMetrics;
  const noDevices = noAudioOutput && noUserAudio && noUserVideo;

  return (
    <RTVIClientProvider client={rtviClient}>
      <div className="vkui:grid vkui:grid-cols-1 vkui:grid-rows-[min-content_1fr] vkui:sm:grid-rows-[min-content_1fr_auto] vkui:h-full vkui:w-full vkui:overflow-auto">
        <div className="vkui:grid vkui:grid-cols-2 vkui:sm:grid-cols-[150px_1fr_150px] vkui:gap-2 vkui:items-center vkui:justify-center vkui:p-2 vkui:bg-background vkui:sm:relative vkui:top-0 vkui:w-full vkui:z-10">
          {noLogo ? (
            <span className="vkui:h-6" />
          ) : (
            <PipecatLogo
              className="vkui:h-6 vkui:w-auto"
              color={resolvedTheme === "dark" ? "#ffffff" : "#171717"}
            />
          )}
          <strong className="vkui:hidden vkui:sm:block vkui:text-center">
            {title}
          </strong>
          <div className="vkui:flex vkui:items-center vkui:justify-end vkui:gap-4">
            {!noThemeSwitch && <ThemeModeToggle />}
            <ConnectButton
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
            />
          </div>
        </div>
        <div className="vkui:hidden vkui:sm:block">
          <ResizablePanelGroup direction="vertical" className="vkui:h-full">
            <ResizablePanel defaultSize={70} minSize={50}>
              <ResizablePanelGroup direction="horizontal">
                {!noBotArea && (
                  <>
                    <ResizablePanel
                      className="vkui:flex vkui:flex-col vkui:gap-2 vkui:p-2"
                      defaultSize={15}
                      maxSize={30}
                      minSize={9}
                      collapsible
                      collapsedSize={8}
                      onCollapse={() => setIsBotAreaCollapsed(true)}
                      onExpand={() => setIsBotAreaCollapsed(false)}
                    >
                      {!noBotAudio && (
                        <BotAudioPanel
                          className={cn({
                            "vkui:max-h-[calc(50%-4px)] vkui:mt-auto":
                              !noBotVideo,
                          })}
                          collapsed={isBotAreaCollapsed}
                        />
                      )}
                      {!noBotVideo && (
                        <BotVideoPanel
                          className={cn({
                            "vkui:max-h-[calc(50%-4px)] vkui:mb-auto":
                              !noBotAudio,
                          })}
                          collapsed={isBotAreaCollapsed}
                        />
                      )}
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                  </>
                )}
                {!noConversationPanel && (
                  <>
                    <ResizablePanel
                      className="vkui:h-full vkui:p-2"
                      defaultSize={60}
                      minSize={40}
                    >
                      <ConversationPanel
                        noConversation={noConversation}
                        noMetrics={noMetrics}
                      />
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                  </>
                )}
                <ResizablePanel
                  id="info-panel"
                  collapsible
                  collapsedSize={4}
                  minSize={15}
                  defaultSize={20}
                  onCollapse={() => setIsInfoPanelCollapsed(true)}
                  onExpand={() => setIsInfoPanelCollapsed(false)}
                  className="vkui:p-2"
                >
                  {isInfoPanelCollapsed ? (
                    <div className="vkui:flex vkui:flex-col vkui:items-center vkui:justify-center vkui:gap-4 vkui:h-full">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <ChevronsLeftRightEllipsisIcon size={16} />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent side="left">
                          <ClientStatus />
                        </PopoverContent>
                      </Popover>
                      {!noDevices && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MicIcon size={16} />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="vkui:flex vkui:flex-col vkui:gap-2"
                            side="left"
                          >
                            {!noUserAudio && <UserAudio />}
                            {!noUserVideo && <UserVideo />}
                            {!noAudioOutput && <AudioOutput />}
                          </PopoverContent>
                        </Popover>
                      )}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <InfoIcon size={16} />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent side="left">
                          <SessionInfo
                            sessionId={sessionId}
                            participantId={participantId}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  ) : (
                    <InfoPanel
                      noAudioOutput={noAudioOutput}
                      noUserAudio={noUserAudio}
                      noUserVideo={noUserVideo}
                      participantId={participantId}
                      sessionId={sessionId}
                    />
                  )}
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel
              collapsible
              collapsedSize={4}
              minSize={7}
              onCollapse={() => setIsEventsPanelCollapsed(true)}
              onExpand={() => setIsEventsPanelCollapsed(false)}
            >
              <EventsPanel collapsed={isEventsPanelCollapsed} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
        <Tabs
          defaultValue={
            noBotArea ? (noConversationPanel ? "info" : "conversation") : "bot"
          }
          className="vkui:flex vkui:flex-col vkui:gap-0 vkui:sm:hidden vkui:overflow-hidden"
        >
          <div className="vkui:flex vkui:flex-col vkui:overflow-hidden">
            {!noBotArea && (
              <TabsContent
                value="bot"
                className="vkui:flex-1 vkui:overflow-auto vkui:flex vkui:flex-col vkui:gap-4 vkui:p-2"
              >
                {!noBotAudio && <BotAudioPanel />}
                {!noBotVideo && <BotVideoPanel />}
              </TabsContent>
            )}
            {!noConversationPanel && (
              <TabsContent
                value="conversation"
                className="vkui:flex-1 vkui:overflow-auto"
              >
                <ConversationPanel
                  noConversation={noConversation}
                  noMetrics={noMetrics}
                />
              </TabsContent>
            )}
            <TabsContent
              value="info"
              className="vkui:flex-1 vkui:overflow-auto vkui:p-2"
            >
              <InfoPanel
                noAudioOutput={noAudioOutput}
                noUserAudio={noUserAudio}
                noUserVideo={noUserVideo}
                participantId={participantId}
                sessionId={sessionId}
              />
            </TabsContent>
            <TabsContent
              value="events"
              className="vkui:flex-1 vkui:overflow-auto"
            >
              <EventsPanel />
            </TabsContent>
          </div>
          <TabsList className="vkui:w-full vkui:h-12 vkui:rounded-none vkui:z-10 vkui:mt-auto vkui:shrink-0">
            {!noBotArea && (
              <TabsTrigger value="bot">
                <BotIcon />
              </TabsTrigger>
            )}
            {!noConversationPanel && (
              <TabsTrigger value="conversation">
                <MessagesSquareIcon />
              </TabsTrigger>
            )}
            <TabsTrigger value="info">
              <InfoIcon />
            </TabsTrigger>
            <TabsTrigger value="events">
              <ChevronsLeftRightEllipsisIcon />
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {!noAudioOutput && <RTVIClientAudio />}
      </div>
    </RTVIClientProvider>
  );
};
