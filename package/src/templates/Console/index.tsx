"use client";

import { ClientStatus } from "@/components/elements/ClientStatus";
import ConnectButton from "@/components/elements/ConnectButton";
import type { ConversationProps } from "@/components/elements/Conversation";
import PipecatLogo from "@/components/elements/PipecatLogo";
import { SessionInfo } from "@/components/elements/SessionInfo";
import UserAudioControl from "@/components/elements/UserAudioControl";
import UserAudioOutputControl from "@/components/elements/UserAudioOutputControl";
import UserVideoControl from "@/components/elements/UserVideoControl";
import { BotAudioPanel } from "@/components/panels/BotAudioPanel";
import { BotVideoPanel } from "@/components/panels/BotVideoPanel";
import ConversationPanel from "@/components/panels/ConversationPanel";
import { EventsPanel } from "@/components/panels/EventsPanel";
import { InfoPanel } from "@/components/panels/InfoPanel";
import { PipecatAppBase, PipecatBaseProps } from "@/components/PipecatAppBase";
import ThemeModeToggle from "@/components/ThemeModeToggle";
import {
  Banner,
  BannerClose,
  BannerIcon,
  BannerTitle,
} from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { SpinLoader } from "@/components/ui/loader";
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
import { usePipecatConversation } from "@/hooks/usePipecatConversation";
import { cn } from "@/lib/utils";
import { type ConversationMessage } from "@/types/conversation";
import { type PipecatClientOptions, RTVIEvent } from "@pipecat-ai/client-js";
import {
  usePipecatClientCamControl,
  useRTVIClientEvent,
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
import { type ImperativePanelHandle } from "react-resizable-panels";
import React, { memo, useEffect, useRef, useState } from "react";
import { AutoInitDevices } from "./AutoInitDevices";
import { SmallWebRTCCodecSetter } from "./SmallWebRTCCodecSetter";
import UserScreenControl from "../../components/elements/UserScreenControl";

export interface ConsoleTemplateProps
  extends Omit<PipecatBaseProps, "children"> {
  /** Disables RTVI related functionality. Default: false */
  noRTVI?: boolean;
  /** Specifies the RTVI version in use by the server. Default: null */
  serverRTVIVersion?: string | null;
  /** Disables user audio input entirely. Default: false */
  noUserAudio?: boolean;
  /** Disables user video input entirely. Default: false */
  noUserVideo?: boolean;
  /** Disables user screen control entirely. Default: false */
  noScreenControl?: boolean;
  /** Disables audio output for the bot. Default: false */
  noAudioOutput?: boolean;
  /** Disables audio visualization for the bot. Default: false */
  noBotAudio?: boolean;
  /** Disables video visualization for the bot. Default: true */
  noBotVideo?: boolean;
  /** Disables automatic initialization of devices. Default: false */
  noAutoInitDevices?: boolean;

  /** Theme to use for the UI. Default: "system" */
  theme?: string;
  /** Disables the theme switcher in the header. Default: false */
  noThemeSwitch?: boolean;
  /** Disables the logo in the header. Default: false */
  noLogo?: boolean;
  /** Disables the session info panel. Default: false */
  noSessionInfo?: boolean;
  /** Disables the status info panel. Default: false */
  noStatusInfo?: boolean;

  /** Title displayed in the header. Default: "Pipecat Playground" */
  titleText?: string;
  /** Label for assistant messages. Default: "assistant" */
  assistantLabelText?: string;
  /** Label for user messages. Default: "user" */
  userLabelText?: string;
  /** Label for system messages. Default: "system" */
  systemLabelText?: string;

  /** Whether to collapse the info panel by default. Default: false */
  collapseInfoPanel?: boolean;
  /** Whether to collapse the media panel by default. Default: false */
  collapseMediaPanel?: boolean;

  // Properties from original interface that are still in use but not in the new interface

  /**
   * Sets the audio codec. Only applicable for SmallWebRTC transport.
   * Defaults to "default" which uses the browser's default codec.
   */
  audioCodec?: string;

  /**
   * Sets the video codec. Only applicable for SmallWebRTC transport.
   * Defaults to "default" which uses the browser's default codec.
   */
  videoCodec?: string;

  /**
   * Disables the conversation panel.
   * The bot may still send messages, but they won't be displayed.
   */
  noConversation?: boolean;

  /**
   * Disables the metrics panel.
   * The bot may still send metrics, but they won't be displayed.
   */
  noMetrics?: boolean;

  /**
   * Custom logo component to display in the header.
   * If provided, this will replace the default Pipecat logo.
   */
  logoComponent?: React.ReactNode;

  /**
   * Props to pass to the Conversation component.
   * Allows customization of the conversation display.
   */
  conversationElementProps?: Partial<ConversationProps>;

  /**
   * Callback that receives the injectMessage function.
   * This allows parent components to manually add messages to the conversation.
   */
  onInjectMessage?: (
    injectMessage: (
      message: Pick<ConversationMessage, "role" | "parts">,
    ) => void,
  ) => void;

  /**
   * Callback that receives incoming server messages.
   * This allows parent components to subscribe to server messages from the client.
   */
  onServerMessage?: (data: unknown) => void;

  /**
   * @deprecated Use titleText instead
   * Title displayed in the header. Defaults to "Pipecat Playground".
   */
  title?: string;
}

const defaultClientOptions: Partial<PipecatClientOptions> = {
  enableCam: false,
  enableMic: true,
};
const defaultTransportOptions: React.ComponentProps<
  typeof PipecatAppBase
>["transportOptions"] = {};

export const ConsoleTemplate: React.FC<ConsoleTemplateProps> = memo((props) => {
  const {
    clientOptions = defaultClientOptions,
    connectParams,
    startBotParams,
    startBotResponseTransformer,
    theme,
    transportOptions = defaultTransportOptions,
    transportType = "smallwebrtc",
  } = props;

  return (
    <PipecatAppBase
      connectParams={connectParams}
      startBotParams={startBotParams}
      startBotResponseTransformer={startBotResponseTransformer}
      transportType={transportType}
      clientOptions={clientOptions}
      transportOptions={transportOptions}
      themeProps={{
        defaultTheme: theme,
      }}
    >
      {({ client, error, handleConnect, handleDisconnect }) =>
        !client ? (
          <div className="flex items-center justify-center h-full w-full">
            <SpinLoader />
          </div>
        ) : (
          <ConsoleUI
            {...props}
            error={error}
            handleConnect={handleConnect}
            handleDisconnect={handleDisconnect}
          />
        )
      }
    </PipecatAppBase>
  );
});

interface ConsoleUIProps extends ConsoleTemplateProps {
  error?: string | null;
  handleConnect?: () => void | Promise<void>;
  handleDisconnect?: () => void | Promise<void>;
  participantId?: string;
}

const ConsoleUI = ({
  // Core functionality
  // noRTVI,
  // serverRTVIVersion,
  noUserAudio = false,
  noUserVideo = false,
  noScreenControl = false,
  noAudioOutput = false,
  noBotAudio = false,
  noBotVideo = false,
  noAutoInitDevices = false,

  // Transport and client options
  transportType = "smallwebrtc",

  // UI configuration
  noThemeSwitch = false,
  noLogo = false,
  noSessionInfo = false,
  noStatusInfo = false,

  // Text labels
  titleText = "Pipecat Playground",
  assistantLabelText,
  userLabelText,
  systemLabelText,

  // Panel collapse settings
  collapseInfoPanel = false,
  collapseMediaPanel = false,

  // Legacy properties
  audioCodec = "default",
  videoCodec = "default",
  noConversation = false,
  noMetrics = false,
  logoComponent,
  conversationElementProps,
  onInjectMessage,
  onServerMessage,

  // Passed props
  error,
  handleConnect,
  handleDisconnect,
}: ConsoleUIProps) => {
  const [isBotAreaCollapsed, setIsBotAreaCollapsed] = useState(false);
  const [isInfoPanelCollapsed, setIsInfoPanelCollapsed] = useState(false);
  const [isEventsPanelCollapsed, setIsEventsPanelCollapsed] = useState(false);
  const [participantId, setParticipantId] = useState("");
  const [sessionId, setSessionId] = useState("");

  const infoPanelRef = useRef<ImperativePanelHandle>(null);

  const { injectMessage } = usePipecatConversation();
  const { isCamEnabled } = usePipecatClientCamControl();

  // Expose injectMessage to parent if requested
  useEffect(() => {
    if (onInjectMessage) onInjectMessage(injectMessage);
  }, [onInjectMessage, injectMessage]);

  const noBotArea = noBotAudio && noBotVideo;
  const noConversationPanel = noConversation && noMetrics;
  const noDevices =
    noAudioOutput && noUserAudio && noUserVideo && noScreenControl;
  const noInfoPanel = noStatusInfo && noDevices && noSessionInfo;

  useRTVIClientEvent(RTVIEvent.ParticipantConnected, (p) => {
    if (p.local) setParticipantId(p.id || "");
  });
  useRTVIClientEvent(RTVIEvent.TrackStarted, (_track, p) => {
    if (p?.id && p?.local) setParticipantId(p.id);
  });
  useRTVIClientEvent(RTVIEvent.ServerMessage, (data) => {
    onServerMessage?.(data);
  });
  useRTVIClientEvent(RTVIEvent.BotStarted, (data) => {
    const sessionData = data as { sessionId?: string };
    if (sessionData?.sessionId) {
      setSessionId(sessionData.sessionId);
    }
  });

  return (
    <>
      {!noAutoInitDevices && <AutoInitDevices />}
      <SmallWebRTCCodecSetter
        audioCodec={audioCodec}
        transportType={transportType}
        videoCodec={videoCodec}
      />
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
          <strong className="hidden sm:block text-center">{titleText}</strong>
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
                      defaultSize={collapseMediaPanel ? 8 : 26}
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
                        conversationElementProps={{
                          ...conversationElementProps,
                          assistantLabel: assistantLabelText,
                          clientLabel: userLabelText,
                          systemLabel: systemLabelText,
                        }}
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
                              {!noUserVideo && (
                                <UserVideoControl noVideo={!isCamEnabled} />
                              )}
                              {!noScreenControl && <UserScreenControl />}
                              {!noAudioOutput && <UserAudioOutputControl />}
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
                                participantId={participantId}
                                sessionId={sessionId}
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
                        noScreenControl={noScreenControl}
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
            noBotArea ? (noConversationPanel ? "info" : "conversation") : "bot"
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
                noScreenControl={noScreenControl}
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
      </div>
    </>
  );
};
