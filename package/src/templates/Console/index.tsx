"use client";

import {
  ConversationProvider,
  type ConversationProviderRef,
} from "@/components/ConversationContext";
import { ClientStatus } from "@/components/elements/ClientStatus";
import ConnectButton from "@/components/elements/ConnectButton";
import type { ConversationProps } from "@/components/elements/Conversation";
import PipecatLogo from "@/components/elements/PipecatLogo";
import { SessionInfo } from "@/components/elements/SessionInfo";
import UserAudioControl from "@/components/elements/UserAudioControl";
import AudioOutput from "@/components/elements/UserAudioOutputControl";
import UserVideoControl from "@/components/elements/UserVideoControl";
import { BotAudioPanel } from "@/components/panels/BotAudioPanel";
import { BotVideoPanel } from "@/components/panels/BotVideoPanel";
import ConversationPanel from "@/components/panels/ConversationPanel";
import { EventsPanel } from "@/components/panels/EventsPanel";
import { InfoPanel } from "@/components/panels/InfoPanel";
import ThemeModeToggle from "@/components/ThemeModeToggle";
import { SpinLoader } from "@/components/ui";
import {
  Banner,
  BannerClose,
  BannerIcon,
  BannerTitle,
} from "@/components/ui/banner";
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
import type {
  DailyTransportOptions,
  SmallWebRTCTransportOptions,
} from "@/lib/transports";
import { createTransport } from "@/lib/transports";
import { cn } from "@/lib/utils";
import { type ConversationMessage } from "@/types/conversation";
import {
  PipecatClient,
  type PipecatClientOptions,
  type TransportConnectionParams,
} from "@pipecat-ai/client-js";
import {
  PipecatClientAudio,
  PipecatClientProvider,
} from "@pipecat-ai/client-react";
import {
  BotIcon,
  ChevronsLeftRightEllipsisIcon,
  CircleAlertIcon,
  InfoIcon,
  MessagesSquareIcon,
  MicIcon,
  PanelLeftCloseIcon,
  PanelRightCloseIcon,
} from "lucide-react";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import type { ImperativePanelHandle } from "react-resizable-panels";

// Type definitions for transport-specific properties
interface DailyTransportWithClient {
  dailyCallClient: {
    on: (
      event: string,
      callback: (event: { meetingSession: { id: string } }) => void,
    ) => void;
  };
}

interface SmallWebRTCTransportWithCodecs {
  setAudioCodec: (codec: string | null) => void;
  setVideoCodec: (codec: string | null) => void;
}

// Type aliases for backward compatibility
type DailyTransportConstructorOptions = DailyTransportOptions;
type SmallWebRTCTransportConstructorOptions = SmallWebRTCTransportOptions;

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
  connectParams?: TransportConnectionParams;
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
   * This allows parent components to get the injectMessage function to manually add messages to the conversation.
   */
  onInjectMessage?: (
    injectMessage: (
      message: Pick<ConversationMessage, "role" | "content">,
    ) => void,
  ) => void;

  /**
   * Callback that receives incoming server messages.
   * This allows parent components to subscribe to server messages from the client.
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
    transportType = "smallwebrtc",
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

    useEffect(() => {
      // Only run on client side
      if (typeof window === "undefined") return;

      let currentClient: PipecatClient | null = null;

      (async () => {
        try {
          const transport = await createTransport(
            transportType,
            transportOptions,
          );

          // Set up Daily transport specific event listeners
          if (transportType === "daily") {
            const dailyTransport =
              transport as unknown as DailyTransportWithClient;
            if (dailyTransport.dailyCallClient) {
              dailyTransport.dailyCallClient.on(
                "meeting-session-updated",
                (event: { meetingSession: { id: string } }) => {
                  setSessionId(event.meetingSession.id);
                },
              );
            }
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
          currentClient = pcClient;
          setClient(pcClient);
          setIsClientReady(true);
        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "Failed to initialize transport",
          );
        }
      })();

      return () => {
        /**
         * Disconnect client when component unmounts or options change.
         */
        if (currentClient) {
          currentClient.disconnect();
        }
      };
    }, [
      clientOptions,
      transportOptions,
      noUserAudio,
      noUserVideo,
      transportType,
      onServerMessage,
    ]);

    useEffect(
      function updateSmallWebRTCCodecs() {
        if (!client || transportType !== "smallwebrtc") return;
        const transport =
          client.transport as unknown as SmallWebRTCTransportWithCodecs;
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
        <div className="flex items-center justify-center h-full w-full">
          <SpinLoader />
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
              className="animate-in fade-in duration-300"
            >
              <BannerIcon icon={CircleAlertIcon} />
              <BannerTitle>
                Unable to connect. Please check web console for errors.
              </BannerTitle>
              <BannerClose variant="destructive" />
            </Banner>
          )}
          <div className="grid grid-cols-1 grid-rows-[min-content_1fr] sm:grid-rows-[min-content_1fr_auto] h-full w-full overflow-auto">
            <div className="grid grid-cols-2 sm:grid-cols-[150px_1fr_150px] gap-2 items-center justify-center p-2 bg-background sm:relative top-0 w-full z-10">
              {noLogo ? (
                <span className="h-6" />
              ) : (
                (logoComponent ?? (
                  <PipecatLogo className="h-6 w-auto text-foreground" />
                ))
              )}
              <strong className="hidden sm:block text-center">{title}</strong>
              <div className="flex items-center justify-end gap-2 sm:gap-3 xl:gap-6">
                <div className="flex items-center gap-1">
                  {!noThemeSwitch && <ThemeModeToggle />}
                  <Button
                    className="hidden sm:flex"
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
            <div className="hidden sm:block">
              <ResizablePanelGroup direction="vertical" className="h-full">
                <ResizablePanel defaultSize={70} minSize={50}>
                  <ResizablePanelGroup direction="horizontal">
                    {!noBotArea && (
                      <>
                        <ResizablePanel
                          className="flex flex-col gap-2 p-2 xl:gap-4"
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
                                "mb-auto": noBotVideo,
                              })}
                              collapsed={isBotAreaCollapsed}
                            />
                          )}
                          {!noBotVideo && (
                            <BotVideoPanel
                              className={cn({
                                "mt-auto": noBotAudio,
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
                          className="h-full p-2"
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
                        className="p-2"
                      >
                        {isInfoPanelCollapsed ? (
                          <div className="flex flex-col items-center justify-center gap-4 h-full">
                            {!noStatusInfo && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="ghost" isIcon>
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
                                  <Button variant="ghost" isIcon>
                                    <MicIcon size={16} />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="flex flex-col gap-2"
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
                                  <Button variant="ghost" isIcon>
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
              className="flex flex-col gap-0 sm:hidden overflow-hidden"
            >
              <div className="flex flex-col overflow-hidden flex-1">
                {!noBotArea && (
                  <TabsContent
                    value="bot"
                    className="flex-1 overflow-auto flex flex-col gap-4 p-2"
                  >
                    {!noBotAudio && <BotAudioPanel />}
                    {!noBotVideo && <BotVideoPanel />}
                  </TabsContent>
                )}
                {!noConversationPanel && (
                  <TabsContent
                    value="conversation"
                    className="flex-1 overflow-auto"
                  >
                    <ConversationPanel
                      noConversation={noConversation}
                      noMetrics={noMetrics}
                    />
                  </TabsContent>
                )}
                <TabsContent value="info" className="flex-1 overflow-auto p-2">
                  <InfoPanel
                    noAudioOutput={noAudioOutput}
                    noUserAudio={noUserAudio}
                    noUserVideo={noUserVideo}
                    participantId={participantId}
                    sessionId={sessionId}
                  />
                </TabsContent>
                <TabsContent value="events" className="flex-1 overflow-auto">
                  <EventsPanel />
                </TabsContent>
              </div>
              <TabsList className="w-full h-12 rounded-none z-10 mt-auto shrink-0">
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
