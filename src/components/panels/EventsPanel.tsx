import { Input } from "@/components/ui/input";
import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@/components/ui/panel";
import { FunnelIcon } from "@/icons";
import { cn } from "@/lib/utils";
import { RTVIEvent } from "@pipecat-ai/client-js";
import {
  useRTVIClient,
  useRTVIClientEvent,
  useRTVIClientTransportState,
} from "@pipecat-ai/client-react";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";

interface EventData {
  event: RTVIEvent | string;
  message: string;
  time: string;
}

interface Props {
  collapsed?: boolean;
}

export const EventsPanel: React.FC<Props> = ({ collapsed = false }) => {
  const client = useRTVIClient();
  const [events, setEvents] = useState<EventData[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrolledToBottom = useRef(true);

  const addEvent = useCallback((data: EventData) => {
    if (scrollRef.current) {
      isScrolledToBottom.current =
        Math.ceil(
          scrollRef.current.scrollHeight - scrollRef.current.scrollTop,
        ) <= Math.ceil(scrollRef.current.clientHeight);
    }
    setEvents((prev) => {
      return [...prev, data];
    });
  }, []);

  const transportState = useRTVIClientTransportState();
  const lastTransportState = useRef("");
  useEffect(() => {
    if (transportState === lastTransportState.current) return;
    addEvent({
      event: "transportState",
      message: `Transport state changed: ${transportState}`,
      time: new Date().toLocaleTimeString(),
    });
    lastTransportState.current = transportState;
  }, [addEvent, transportState]);

  useEffect(() => {
    if (!client) return;
    addEvent({
      event: "initialized",
      message: `RTVI Client initialized (version ${client.version})`,
      time: new Date().toLocaleTimeString(),
    });
  }, [addEvent, client]);

  useRTVIClientEvent(RTVIEvent.BotConnected, (participant) => {
    addEvent({
      event: RTVIEvent.BotConnected,
      message: `Bot connected: ${participant.id}`,
      time: new Date().toLocaleTimeString(),
    });
  });

  useRTVIClientEvent(RTVIEvent.BotDisconnected, (participant) => {
    addEvent({
      event: RTVIEvent.BotDisconnected,
      message: `Bot disconnected: ${participant.id}`,
      time: new Date().toLocaleTimeString(),
    });
  });

  useRTVIClientEvent(RTVIEvent.BotReady, (botData) => {
    addEvent({
      event: RTVIEvent.BotReady,
      message: `Bot ready (v${botData.version})`,
      time: new Date().toLocaleTimeString(),
    });
    if (!botData.config) return;
    botData.config.forEach((config) => {
      addEvent({
        event: RTVIEvent.BotReady,
        message: `${config.service}: ${JSON.stringify(config.options)}`,
        time: new Date().toLocaleTimeString(),
      });
    });
  });

  useRTVIClientEvent(RTVIEvent.BotStartedSpeaking, () => {
    addEvent({
      event: RTVIEvent.BotStartedSpeaking,
      message: "Bot started speaking",
      time: new Date().toLocaleTimeString(),
    });
  });

  useRTVIClientEvent(RTVIEvent.BotStoppedSpeaking, () => {
    addEvent({
      event: RTVIEvent.BotStoppedSpeaking,
      message: "Bot stopped speaking",
      time: new Date().toLocaleTimeString(),
    });
  });

  useRTVIClientEvent(RTVIEvent.Connected, () => {
    addEvent({
      event: RTVIEvent.Connected,
      message: "Client connected",
      time: new Date().toLocaleTimeString(),
    });
  });
  useRTVIClientEvent(RTVIEvent.Disconnected, () => {
    addEvent({
      event: RTVIEvent.Disconnected,
      message: "Client disconnected",
      time: new Date().toLocaleTimeString(),
    });
  });

  useRTVIClientEvent(RTVIEvent.Error, (message) => {
    addEvent({
      event: RTVIEvent.Error,
      message: `Error: ${JSON.stringify(message)}`,
      time: new Date().toLocaleTimeString(),
    });
  });

  useRTVIClientEvent(RTVIEvent.ParticipantConnected, (participant) => {
    addEvent({
      event: RTVIEvent.ParticipantConnected,
      message: `Participant connected: ${participant.id}`,
      time: new Date().toLocaleTimeString(),
    });
  });
  useRTVIClientEvent(RTVIEvent.ParticipantLeft, (participant) => {
    addEvent({
      event: RTVIEvent.ParticipantLeft,
      message: `Participant left: ${participant.id}`,
      time: new Date().toLocaleTimeString(),
    });
  });

  useRTVIClientEvent(RTVIEvent.ServerMessage, (data) => {
    addEvent({
      event: RTVIEvent.ServerMessage,
      message: `Server message: ${JSON.stringify(data)}`,
      time: new Date().toLocaleTimeString(),
    });
  });

  useRTVIClientEvent(RTVIEvent.TrackStarted, (track, participant) => {
    addEvent({
      event: RTVIEvent.TrackStarted,
      message: `Track started: ${track.kind} for participant ${participant?.id}`,
      time: new Date().toLocaleTimeString(),
    });
  });

  useRTVIClientEvent(RTVIEvent.TrackStopped, (track, participant) => {
    addEvent({
      event: RTVIEvent.TrackStopped,
      message: `Track stopped: ${track.kind} for participant ${participant?.id}`,
      time: new Date().toLocaleTimeString(),
    });
  });

  useRTVIClientEvent(RTVIEvent.ScreenTrackStarted, (track, participant) => {
    addEvent({
      event: RTVIEvent.ScreenTrackStarted,
      message: `Screen track started: ${track.kind} for participant ${participant?.id}`,
      time: new Date().toLocaleTimeString(),
    });
  });
  useRTVIClientEvent(RTVIEvent.ScreenTrackStopped, (track, participant) => {
    addEvent({
      event: RTVIEvent.ScreenTrackStopped,
      message: `Screen track stopped: ${track.kind} for participant ${participant?.id}`,
      time: new Date().toLocaleTimeString(),
    });
  });

  useRTVIClientEvent(RTVIEvent.UserStartedSpeaking, () => {
    addEvent({
      event: RTVIEvent.UserStartedSpeaking,
      message: "User started speaking",
      time: new Date().toLocaleTimeString(),
    });
  });

  useRTVIClientEvent(RTVIEvent.UserStoppedSpeaking, () => {
    addEvent({
      event: RTVIEvent.UserStoppedSpeaking,
      message: "User stopped speaking",
      time: new Date().toLocaleTimeString(),
    });
  });

  useEffect(() => {
    if (!scrollRef.current) return;
    if (!isScrolledToBottom.current) return;
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "instant",
    });
  }, [events]);

  const [filter, setFilter] = useState("");
  const filteredEvents = events.filter(
    (eventData) =>
      eventData.event.toString().toLowerCase().includes(filter) ||
      eventData.message.toLowerCase().includes(filter),
  );

  return (
    <Panel
      className={cn(
        "vkui:bg-secondary/20 vkui:h-full vkui:rounded-none! vkui:max-sm:border-none vkui:sm:border-x-0 vkui:sm:mt-2",
        {
          "vkui:bg-secondary vkui:opacity-50": collapsed,
        },
      )}
    >
      <PanelHeader
        className={cn("vkui:gap-4 vkui:justify-start vkui:items-center", {
          "vkui:py-2!": collapsed,
        })}
      >
        <PanelTitle>Events</PanelTitle>
        {!collapsed && (
          <div className="vkui:relative">
            <div className="vkui:absolute vkui:inset-y-0 vkui:left-0 vkui:flex vkui:items-center vkui:pl-2 vkui:pointer-events-none">
              <FunnelIcon size={16} />
            </div>
            <Input
              type="text"
              placeholder="Filter"
              className="vkui:bg-secondary vkui:max-w-48 vkui:ps-8"
              onChange={(e) => {
                setFilter(e.target.value.toLowerCase());
              }}
            />
          </div>
        )}
      </PanelHeader>
      {!collapsed && (
        <PanelContent ref={scrollRef} className="vkui:overflow-y-auto">
          <div className="vkui:grid vkui:grid-cols-[min-content_min-content_1fr] vkui:gap-x-4 vkui:gap-y-2 vkui:items-center vkui:font-mono vkui:text-xs">
            {filteredEvents.map((eventData, index) => (
              <Fragment key={index}>
                <div className="vkui:text-xs vkui:text-muted-foreground vkui:text-nowrap">
                  {eventData.time}
                </div>
                <div className="vkui:font-semibold">{eventData.event}</div>
                <div>{eventData.message}</div>
              </Fragment>
            ))}
          </div>
        </PanelContent>
      )}
    </Panel>
  );
};
