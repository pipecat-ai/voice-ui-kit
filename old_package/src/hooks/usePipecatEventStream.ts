import { RTVIEvent } from "@pipecat-ai/client-js";
import {
  usePipecatClient,
  usePipecatClientTransportState,
} from "@pipecat-ai/client-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ClientInstance = NonNullable<ReturnType<typeof usePipecatClient>>;
type ClientEventName = Parameters<ClientInstance["on"]>[0];

export interface PipecatEventLog {
  id: string;
  type: string;
  data: unknown;
  timestamp: Date;
}

/**
 * Optional configuration for `usePipecatEventStream`.
 */
export interface UsePipecatEventStreamOptions {
  maxEvents?: number;
  ignoreEvents?: string[];
  /** When true, also compute and return consecutive groups */
  groupConsecutive?: boolean;
  /** Optional grouping key selector; defaults to event.type */
  groupKey?: (event: PipecatEventLog) => string;
  /** When provided, only these events will be captured (takes precedence over ignoreEvents) */
  includeEvents?: string[];
  /** Pause capturing without tearing down subscriptions */
  paused?: boolean;
  /** Optional transform to sanitize/shape event data before storing */
  mapEventData?: (data: unknown, eventType: string) => unknown;
  /** Throttle notifications; 0 uses requestAnimationFrame, otherwise uses setTimeout(ms) */
  throttleMs?: number;
  /** Optional callback invoked for each captured event (after stored) */
  onEvent?: (event: PipecatEventLog) => void;
}

export interface PipecatEventGroup {
  id: string;
  type: string;
  events: ReadonlyArray<PipecatEventLog>;
}

/**
 * Subscribes to all RTVI events and returns a throttled snapshot of recent events.
 * - Uses requestAnimationFrame batching by default; set `throttleMs > 0` to time-slice updates
 * - Prefers `includeEvents` over `ignoreEvents` when filtering
 * - Can compute contiguous groups when `groupConsecutive` is true
 *
 * Returns a stable object `{ events, groups, clear }` where:
 * - `events`: frozen array snapshot that updates on the configured throttle cadence
 * - `groups`: grouped consecutive events (empty unless `groupConsecutive` is enabled)
 * - `clear()`: clears the current event list
 */
export function usePipecatEventStream(options?: UsePipecatEventStreamOptions) {
  const client = usePipecatClient();
  const transportState = usePipecatClientTransportState();

  const maxEvents = options?.maxEvents ?? 500;
  const allEventNames = useMemo(() => {
    // Guard against numeric enum reverse mappings by filtering strings only
    return (
      Object.values(RTVIEvent).filter((v) => typeof v === "string") as string[]
    ).slice();
  }, []);
  const ignoredEventsSet = useMemo(() => {
    const defaults = new Set<string>([RTVIEvent.LocalAudioLevel]);
    if (!options?.ignoreEvents) return defaults;
    for (const e of options.ignoreEvents) defaults.add(e);
    return defaults;
  }, [options?.ignoreEvents]);
  const includedEventsSet = useMemo(() => {
    if (!options?.includeEvents || options.includeEvents.length === 0)
      return null as Set<string> | null;
    return new Set(options.includeEvents);
  }, [options?.includeEvents]);
  const pausedRef = useRef<boolean>(!!options?.paused);
  useEffect(() => {
    pausedRef.current = !!options?.paused;
  }, [options?.paused]);

  // Extract scalar option values to avoid depending on the whole options object
  const throttleMs = options?.throttleMs ?? 0;
  const mapEventData = options?.mapEventData;
  const onEvent = options?.onEvent;
  const groupConsecutive = options?.groupConsecutive;
  const groupKey = options?.groupKey;

  // Keep the actual event list in a ref to avoid forcing re-renders on every push
  const eventsRef = useRef<PipecatEventLog[]>([]);
  const versionRef = useRef(0);
  const [, setVersion] = useState(0);
  const rafIdRef = useRef<number | null>(null);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idCounterRef = useRef(0);
  const previousTransportState = useRef(transportState);

  const scheduleNotify = useCallback(() => {
    const throttle = throttleMs;
    if (throttle > 0) {
      if (timeoutIdRef.current != null) return;
      timeoutIdRef.current = setTimeout(() => {
        versionRef.current += 1;
        setVersion(versionRef.current);
        timeoutIdRef.current = null;
      }, throttle);
      return;
    }
    if (rafIdRef.current != null) return;
    rafIdRef.current = requestAnimationFrame(() => {
      versionRef.current += 1;
      setVersion(versionRef.current);
      rafIdRef.current = null;
    });
  }, [throttleMs]);

  const clearEvents = useCallback(() => {
    eventsRef.current = [];
    scheduleNotify();
  }, [scheduleNotify]);

  // Clear when a new connection is starting (disconnected -> initializing)
  useEffect(() => {
    if (
      previousTransportState.current === "disconnected" &&
      transportState === "initializing"
    ) {
      clearEvents();
    }
    previousTransportState.current = transportState;
  }, [transportState, clearEvents]);

  // Single event handler reused for all event names
  const handleRTVIEvent = useCallback(
    (eventType: string, data: unknown) => {
      if (pausedRef.current) return;
      if (includedEventsSet) {
        if (!includedEventsSet.has(eventType)) return;
      } else if (ignoredEventsSet.has(eventType)) {
        return;
      }

      idCounterRef.current += 1;
      const newEvent: PipecatEventLog = {
        id: `${Date.now()}-${idCounterRef.current}`,
        type: eventType,
        data: mapEventData ? mapEventData(data, eventType) : data,
        timestamp: new Date(),
      };

      const next =
        eventsRef.current.length >= maxEvents
          ? [...eventsRef.current.slice(-maxEvents + 1), newEvent]
          : [...eventsRef.current, newEvent];
      // Freeze to preserve immutability guarantees without copying on read
      eventsRef.current = Object.freeze(next) as unknown as PipecatEventLog[];
      scheduleNotify();
      if (onEvent) onEvent(newEvent);
    },
    [
      ignoredEventsSet,
      includedEventsSet,
      maxEvents,
      scheduleNotify,
      mapEventData,
      onEvent,
    ],
  );

  // Subscribe to all events in the RTVIEvent enum
  useEffect(() => {
    if (!client) return;

    const handlers: Record<string, (data: unknown) => void> = {};
    for (const eventName of allEventNames) {
      if (includedEventsSet && !includedEventsSet.has(eventName)) continue;
      if (!includedEventsSet && ignoredEventsSet.has(eventName)) continue;
      handlers[eventName] = (data: unknown) => handleRTVIEvent(eventName, data);
      try {
        client.on(
          eventName as ClientEventName,
          handlers[eventName] as Parameters<ClientInstance["on"]>[1],
        );
      } catch {
        // Some events may not be supported; ignore
      }
    }

    return () => {
      for (const [eventName, handler] of Object.entries(handlers)) {
        try {
          client.off(
            eventName as ClientEventName,
            handler as Parameters<ClientInstance["off"]>[1],
          );
        } catch {
          // ignore
        }
      }
    };
  }, [
    client,
    handleRTVIEvent,
    allEventNames,
    ignoredEventsSet,
    includedEventsSet,
  ]);

  // Expose a snapshot; re-render is already gated by `version`, so memo is unnecessary
  const events = eventsRef.current as ReadonlyArray<PipecatEventLog>;

  const groups: ReadonlyArray<PipecatEventGroup> = useMemo(() => {
    if (!groupConsecutive) return [];
    const keySelector = groupKey ?? ((e: PipecatEventLog) => e.type);
    const grouped: PipecatEventGroup[] = [] as PipecatEventGroup[];
    let current: {
      id: string;
      type: string;
      events: PipecatEventLog[];
    } | null = null;
    for (const e of events) {
      const key = keySelector(e);
      if (!current || current.type !== key) {
        current = { id: e.id, type: key, events: [e] };
        grouped.push({
          id: current.id,
          type: current.type,
          events: current.events,
        });
      } else {
        current.events.push(e);
      }
    }
    return grouped;
  }, [events, groupConsecutive, groupKey]);

  // Cleanup unknown scheduled rAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (timeoutIdRef.current != null) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    };
  }, []);

  return {
    events: events as ReadonlyArray<PipecatEventLog>,
    groups,
    clear: clearEvents,
  } as const;
}
