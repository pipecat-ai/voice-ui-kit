import { Input } from "@/components/ui/input";
import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@/components/ui/panel";
import { cn } from "@/lib/utils";
import { RTVIEvent } from "@pipecat-ai/client-js";
import {
  usePipecatClient,
  usePipecatClientTransportState,
  useRTVIClientEvent,
} from "@pipecat-ai/client-react";
import { FunnelIcon } from "lucide-react";
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
  const client = usePipecatClient();
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

  const transportState = usePipecatClientTransportState();
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
      message: `Bot ready (v${botData.version}): ${JSON.stringify(botData.about ?? {})}`,
      time: new Date().toLocaleTimeString(),
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
        "bg-accent dark:bg-accent/50 h-full rounded-none! max-sm:border-none sm:border-x-0 sm:mt-2",
        {
          "bg-accent opacity-50": collapsed,
        },
      )}
    >
      <PanelHeader
        className={cn(
          "gap-4 justify-start items-center @md:py-2 bg-background",
          {
            "py-2!": collapsed,
          },
        )}
      >
        <PanelTitle>Events</PanelTitle>
        {!collapsed && (
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
              <FunnelIcon size={16} />
            </div>
            <Input
              type="text"
              placeholder="Filter"
              className="bg-secondary max-w-48 ps-8"
              onChange={(e) => {
                setFilter(e.target.value.toLowerCase());
              }}
            />
          </div>
        )}
      </PanelHeader>
      {!collapsed && (
        <PanelContent ref={scrollRef} className="overflow-y-auto">
          <div className="grid grid-cols-[min-content_min-content_1fr] gap-x-4 gap-y-2 items-center font-mono text-xs">
            {filteredEvents.map((eventData, index) => (
              <Fragment key={index}>
                <div className="text-xs text-muted-foreground text-nowrap">
                  {eventData.time}
                </div>
                <div className="font-semibold">{eventData.event}</div>
                <div>{eventData.message}</div>
              </Fragment>
            ))}
          </div>
        </PanelContent>
      )}
    </Panel>
  );
};

export default EventsPanel;
