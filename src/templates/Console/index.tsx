"use client";

import AudioOutput from "@/components/elements/AudioOutput";
import { ClientStatus } from "@/components/elements/ClientStatus";
import ConnectButton from "@/components/elements/ConnectButton";
import type { ConversationProps } from "@/components/elements/Conversation";
import PipecatLogo from "@/components/elements/PipecatLogo";
import { SessionInfo } from "@/components/elements/SessionInfo";
import UserAudioControl from "@/components/elements/UserAudioControl";
import UserVideoControl from "@/components/elements/UserVideoControl";
import { BotAudioPanel } from "@/components/panels/BotAudioPanel";
import { BotVideoPanel } from "@/components/panels/BotVideoPanel";
import ConversationPanel from "@/components/panels/ConversationPanel";
import { EventsPanel } from "@/components/panels/EventsPanel";
import { InfoPanel } from "@/components/panels/InfoPanel";
import ThemeModeToggle from "@/components/ThemeModeToggle";
import {
  Banner,
  BannerClose,
  BannerIcon,
  BannerTitle,
} from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { LoaderSpinner } from "@/components/ui/loaders";
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
  ConversationProvider,
  type ConversationProviderRef,
} from "@/contexts/ConversationContext";
import {
  BotIcon,
  ChevronsLeftRightEllipsisIcon,
  CircleAlertIcon,
  InfoIcon,
  MessagesSquareIcon,
  MicIcon,
  PanelLeftCloseIcon,
  PanelRightCloseIcon,
} from "@/icons";
import { cn } from "@/lib/utils";
import { type ConversationMessage } from "@/types/conversation";
import {
  type ConnectionEndpoint,
  PipecatClient,
  type PipecatClientOptions,
  type TransportConnectionParams,
} from "@pipecat-ai/client-js";
import {
  PipecatClientAudio,
  PipecatClientProvider,
} from "@pipecat-ai/client-react";
import {
  DailyTransport,
  type DailyTransportConstructorOptions,
} from "@pipecat-ai/daily-transport";
import {
  SmallWebRTCTransport,
  type SmallWebRTCTransportConstructorOptions,
} from "@pipecat-ai/small-webrtc-transport";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import type { ImperativePanelHandle } from "react-resizable-panels";

export interface ConsoleTemplateProps {
  /**
   * Sets the audio codec. Only applicable for SmallWebRTC transport.
   * Defaults to "default" which uses the browser's default codec.
   */
  audioCodec?: string;
  /**
   * Options for configuring the RTVI client.
   */
  clientOptions?: Partial<PipecatClientOptions>;
  /**
   * Options for configuring the transport.
   */
  transportOptions?:
    | SmallWebRTCTransportConstructorOptions
    | DailyTransportConstructorOptions;
  /**
   * Parameters for connecting to the transport.
   */
  connectParams?: TransportConnectionParams | ConnectionEndpoint;
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
   * Disables the session info panel.
   */
  noSessionInfo?: boolean;
  /**
   * Disables the status info panel.
   */
  noStatusInfo?: boolean;
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

  /**
   * Whether to collapse the info panel by default.
   * When true, the info panel will be collapsed on initial render.
   */
  collapseInfoPanel?: boolean;
  /**
   * Custom logo component to display in the header.
   * If provided, this will replace the default Pipecat logo.
   * Accepts any valid React element.
   */
  logoComponent?: React.ReactNode;

  /**
   * Props to pass to the Conversation component.
   * Allows customization of the conversation display, including styling,
   * behavior, and appearance of the conversation panel.
   */
  conversationElementProps?: Partial<ConversationProps>;

  /**
   * Callback that receives the injectMessage function.
   * This allows parent components to get the injectMessage function to manually add messages.
   */
  onInjectMessage?: (
    injectMessage: (
      message: Pick<ConversationMessage, "role" | "content">,
    ) => void,
  ) => void;

  /**
   * Callback that receives the server message.
   * This allows parent components to get the server message to manually add messages.
   */
  onServerMessage?: (data: unknown) => void;
}

const defaultClientOptions: Partial<PipecatClientOptions> = {};
const defaultTransportOptions:
  | Partial<SmallWebRTCTransportConstructorOptions>
  | Partial<DailyTransportConstructorOptions> = {};

export const ConsoleTemplate: React.FC<ConsoleTemplateProps> = memo(
  ({
    audioCodec = "default",
    clientOptions = defaultClientOptions,
    transportOptions = defaultTransportOptions,
    connectParams,
    noAudioOutput = false,
    noBotAudio = false,
    noBotVideo = false,
    noConversation = false,
    noLogo = false,
    noMetrics = false,
    noSessionInfo = false,
    noStatusInfo = false,
    noThemeSwitch = false,
    noUserAudio = false,
    noUserVideo = false,
    title = "Pipecat Playground",
    transportType = "daily",
    videoCodec = "default",
    collapseInfoPanel = false,
    logoComponent,
    conversationElementProps,
    onInjectMessage,
    onServerMessage,
  }) => {
    const [isBotAreaCollapsed, setIsBotAreaCollapsed] = useState(false);
    const [isInfoPanelCollapsed, setIsInfoPanelCollapsed] = useState(false);
    const [isEventsPanelCollapsed, setIsEventsPanelCollapsed] = useState(false);
    const [sessionId, setSessionId] = useState("");
    const [participantId, setParticipantId] = useState("");
    const [client, setClient] = useState<PipecatClient | null>(null);
    const [isClientReady, setIsClientReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const infoPanelRef = useRef<ImperativePanelHandle>(null);

    const handleConversationProviderRef = useCallback(
      (node: ConversationProviderRef | null) => {
        if (node && onInjectMessage) {
          onInjectMessage(node.injectMessage);
        }
      },
      [onInjectMessage],
    );

    useEffect(
      function initClient() {
        // Only run on client side
        if (typeof window === "undefined") return;

        let transport: DailyTransport | SmallWebRTCTransport;
        switch (transportType) {
          case "smallwebrtc":
            transport = new SmallWebRTCTransport(
              transportOptions as SmallWebRTCTransportConstructorOptions,
            );
            break;
          case "daily":
          default:
            transport = new DailyTransport(
              transportOptions as DailyTransportConstructorOptions,
            );
            transport.dailyCallClient.on("meeting-session-updated", (event) => {
              setSessionId(event.meetingSession.id);
            });
            break;
        }
        const pcClient = new PipecatClient({
          enableCam: !noUserVideo,
          enableMic: !noUserAudio,
          ...clientOptions,
          transport: clientOptions?.transport ?? transport,
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
            onServerMessage(data) {
              onServerMessage?.(data);
            },
          },
        });
        pcClient.initDevices();
        setClient(pcClient);
        setIsClientReady(true);
        return () => {
          /**
           * Disconnect client when component unmounts or options change.
           */
          pcClient.disconnect();
        };
      },
      [
        clientOptions,
        transportOptions,
        noUserAudio,
        noUserVideo,
        transportType,
        onServerMessage,
      ],
    );

    useEffect(
      function updateSmallWebRTCCodecs() {
        if (!client || transportType !== "smallwebrtc") return;
        const transport = client.transport as SmallWebRTCTransport;
        if (audioCodec) {
          transport.setAudioCodec(audioCodec);
        }
        if (videoCodec) {
          transport.setVideoCodec(videoCodec);
        }
      },
      [audioCodec, client, videoCodec, transportType],
    );

    const handleConnect = async () => {
      if (!client) return;
      setError(null);
      try {
        await client.connect(connectParams);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Unknown error");
        await client.disconnect();
      }
    };

    const handleDisconnect = async () => {
      if (!client) return;
      setError(null);
      await client.disconnect();
    };

    // Return loading state until client is ready (prevents hydration mismatch)
    if (!isClientReady || !client) {
      return (
        <div className="vkui:flex vkui:items-center vkui:justify-center vkui:h-full vkui:w-full">
          <LoaderSpinner />
        </div>
      );
    }

    const noBotArea = noBotAudio && noBotVideo;
    const noConversationPanel = noConversation && noMetrics;
    const noDevices = noAudioOutput && noUserAudio && noUserVideo;
    const noInfoPanel = noStatusInfo && noDevices && noSessionInfo;

    return (
      <PipecatClientProvider client={client}>
        <ConversationProvider ref={handleConversationProviderRef}>
          {error && (
            <Banner
              variant="destructive"
              className="vkui:animate-in vkui:fade-in vkui:duration-300"
            >
              <BannerIcon icon={CircleAlertIcon} />
              <BannerTitle>
                Unable to connect. Please check web console for errors.
              </BannerTitle>
              <BannerClose variant="destructive" />
            </Banner>
          )}
          <div className="vkui:grid vkui:grid-cols-1 vkui:grid-rows-[min-content_1fr] vkui:sm:grid-rows-[min-content_1fr_auto] vkui:h-full vkui:w-full vkui:overflow-auto">
            <div className="vkui:grid vkui:grid-cols-2 vkui:sm:grid-cols-[150px_1fr_150px] vkui:gap-2 vkui:items-center vkui:justify-center vkui:p-2 vkui:bg-background vkui:sm:relative vkui:top-0 vkui:w-full vkui:z-10">
              {noLogo ? (
                <span className="vkui:h-6" />
              ) : (
                (logoComponent ?? (
                  <PipecatLogo className="vkui:h-6 vkui:w-auto vkui:text-foreground" />
                ))
              )}
              <strong className="vkui:hidden vkui:sm:block vkui:text-center">
                {title}
              </strong>
              <div className="vkui:flex vkui:items-center vkui:justify-end vkui:gap-2 vkui:sm:gap-3 vkui:xl:gap-6">
                <div className="vkui:flex vkui:items-center vkui:gap-1">
                  {!noThemeSwitch && <ThemeModeToggle />}
                  <Button
                    className="vkui:hidden vkui:sm:flex"
                    variant={"ghost"}
                    isIcon
                    onClick={() => {
                      if (isInfoPanelCollapsed) {
                        infoPanelRef.current?.expand();
                      } else {
                        infoPanelRef.current?.collapse();
                      }
                    }}
                  >
                    {isInfoPanelCollapsed ? (
                      <PanelLeftCloseIcon />
                    ) : (
                      <PanelRightCloseIcon />
                    )}
                  </Button>
                </div>
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
                          className="vkui:flex vkui:flex-col vkui:gap-2 vkui:p-2 vkui:xl:gap-4"
                          defaultSize={26}
                          maxSize={30}
                          minSize={10}
                          collapsible
                          collapsedSize={8}
                          onCollapse={() => setIsBotAreaCollapsed(true)}
                          onExpand={() => setIsBotAreaCollapsed(false)}
                        >
                          {!noBotAudio && (
                            <BotAudioPanel
                              className={cn({
                                "vkui:mb-auto": noBotVideo,
                              })}
                              collapsed={isBotAreaCollapsed}
                            />
                          )}
                          {!noBotVideo && (
                            <BotVideoPanel
                              className={cn({
                                "vkui:mt-auto": noBotAudio,
                              })}
                              collapsed={isBotAreaCollapsed}
                            />
                          )}
                        </ResizablePanel>
                        {(!noConversationPanel || !noInfoPanel) && (
                          <ResizableHandle withHandle />
                        )}
                      </>
                    )}
                    {!noConversationPanel && (
                      <>
                        <ResizablePanel
                          className="vkui:h-full vkui:p-2"
                          defaultSize={collapseInfoPanel ? 70 : 47}
                          minSize={30}
                        >
                          <ConversationPanel
                            noConversation={noConversation}
                            noMetrics={noMetrics}
                            conversationElementProps={conversationElementProps}
                          />
                        </ResizablePanel>
                        {!noInfoPanel && <ResizableHandle withHandle />}
                      </>
                    )}
                    {!noInfoPanel && (
                      <ResizablePanel
                        id="info-panel"
                        ref={infoPanelRef}
                        collapsible
                        collapsedSize={4}
                        defaultSize={collapseInfoPanel ? 4 : 27}
                        minSize={15}
                        onCollapse={() => setIsInfoPanelCollapsed(true)}
                        onExpand={() => setIsInfoPanelCollapsed(false)}
                        className="vkui:p-2"
                      >
                        {isInfoPanelCollapsed ? (
                          <div className="vkui:flex vkui:flex-col vkui:items-center vkui:justify-center vkui:gap-4 vkui:h-full">
                            {!noStatusInfo && (
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
                            )}
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
                                  {!noUserAudio && <UserAudioControl />}
                                  {!noUserVideo && <UserVideoControl />}
                                  {!noAudioOutput && <AudioOutput />}
                                </PopoverContent>
                              </Popover>
                            )}
                            {!noSessionInfo && (
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
                            )}
                          </div>
                        ) : (
                          <InfoPanel
                            noAudioOutput={noAudioOutput}
                            noSessionInfo={noSessionInfo}
                            noStatusInfo={noStatusInfo}
                            noUserAudio={noUserAudio}
                            noUserVideo={noUserVideo}
                            participantId={participantId}
                            sessionId={sessionId}
                          />
                        )}
                      </ResizablePanel>
                    )}
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
                noBotArea
                  ? noConversationPanel
                    ? "info"
                    : "conversation"
                  : "bot"
              }
              className="vkui:flex vkui:flex-col vkui:gap-0 vkui:sm:hidden vkui:overflow-hidden"
            >
              <div className="vkui:flex vkui:flex-col vkui:overflow-hidden vkui:flex-1">
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
            {!noAudioOutput && <PipecatClientAudio />}
          </div>
        </ConversationProvider>
      </PipecatClientProvider>
    );
  },
);
