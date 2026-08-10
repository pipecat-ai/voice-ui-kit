import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(cleanup);

// ---------------------------------------------------------------------------
// Shims for browser APIs the registry components use that jsdom does not
// implement. Everything is guarded so a jsdom that grows the real thing wins.
// ---------------------------------------------------------------------------

// Base UI observes trigger/popup sizes; visualizers observe their host.
globalThis.ResizeObserver ??= class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// wave-shader pauses rendering off-screen.
globalThis.IntersectionObserver ??= class IntersectionObserver {
  root = null;
  rootMargin = "";
  thresholds = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
} as unknown as typeof IntersectionObserver;

// Base UI lists scroll the highlighted item into view; the conversation
// autoscroll uses Element#scrollTo.
Element.prototype.scrollIntoView ??= () => {};
Element.prototype.scrollTo ??= (() => {}) as typeof Element.prototype.scrollTo;
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.setPointerCapture ??= () => {};
Element.prototype.releasePointerCapture ??= () => {};

// Visualizer draw loops. jsdom only ships rAF under pretendToBeVisual.
globalThis.requestAnimationFrame ??= (callback: FrameRequestCallback) =>
  setTimeout(() => callback(performance.now()), 16) as unknown as number;
globalThis.cancelAnimationFrame ??= (id: number) => clearTimeout(id);

// --- Canvas -----------------------------------------------------------------
// jsdom's getContext returns null (and logs) without the native canvas
// package. The visualizers only issue 2D draw calls and never read pixels
// back, so a record-everything stub is enough. WebGL ("webgl"/"webgl2")
// stays null — components are expected to cope, tests mock further if not.

function createContext2dStub(canvas: HTMLCanvasElement) {
  const values: Record<PropertyKey, unknown> = { canvas };
  const methods = new Map<PropertyKey, unknown>();
  return new Proxy({} as CanvasRenderingContext2D, {
    get(_target, prop) {
      if (prop in values) return values[prop];
      if (!methods.has(prop)) methods.set(prop, vi.fn());
      return methods.get(prop);
    },
    set(_target, prop, value) {
      values[prop] = value;
      return true;
    },
  });
}

const context2dByCanvas = new WeakMap<
  HTMLCanvasElement,
  CanvasRenderingContext2D
>();

HTMLCanvasElement.prototype.getContext = function (
  this: HTMLCanvasElement,
  contextId: string,
) {
  if (contextId !== "2d") return null;
  let context = context2dByCanvas.get(this);
  if (!context) {
    context = createContext2dStub(this);
    context2dByCanvas.set(this, context);
  }
  return context;
} as typeof HTMLCanvasElement.prototype.getContext;

// --- Web Audio ---------------------------------------------------------------
// Covers lib/visualizer.ts (analyser pipeline) and dtmf-keypad (tone
// synthesis). Analyser data reads back as silence.

class StubAudioParam {
  value = 0;
  setValueAtTime() {}
  linearRampToValueAtTime() {}
  exponentialRampToValueAtTime() {}
  cancelScheduledValues() {}
}

class StubAnalyserNode {
  fftSize = 2048;
  smoothingTimeConstant = 0;
  // Real nodes carry a back-reference to their owning context; the
  // visualizers read analyser.context.sampleRate.
  constructor(public context: StubAudioContext) {}
  get frequencyBinCount() {
    return this.fftSize / 2;
  }
  getByteFrequencyData(array: Uint8Array) {
    array.fill(0);
  }
  getByteTimeDomainData(array: Uint8Array) {
    array.fill(128);
  }
  connect() {}
  disconnect() {}
}

class StubAudioContext {
  sampleRate = 48000;
  currentTime = 0;
  state: AudioContextState = "running";
  destination = {};
  createAnalyser() {
    return new StubAnalyserNode(this);
  }
  createMediaStreamSource() {
    return { connect() {}, disconnect() {} };
  }
  createGain() {
    return { gain: new StubAudioParam(), connect() {}, disconnect() {} };
  }
  createOscillator() {
    return {
      type: "sine",
      frequency: new StubAudioParam(),
      onended: null as (() => void) | null,
      connect() {},
      disconnect() {},
      start() {},
      stop() {},
    };
  }
  resume() {
    this.state = "running";
    return Promise.resolve();
  }
  close() {
    this.state = "closed";
    return Promise.resolve();
  }
}

globalThis.AudioContext ??= StubAudioContext as unknown as typeof AudioContext;

// --- matchMedia ---------------------------------------------------------------
// jsdom ships a matchMedia whose matches is always false, so overwrite rather
// than guard (same rationale as play/pause below). Simple (min-width: Npx)
// queries evaluate against window.innerWidth and re-check on resize, letting
// tests flip responsive layouts by resizing jsdom's window.

globalThis.matchMedia = ((query: string) => {
  const minWidth = /\(min-width:\s*(\d+(?:\.\d+)?)px\)/.exec(query);
  const evaluate = () =>
    minWidth ? window.innerWidth >= parseFloat(minWidth[1]!) : false;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const mql = {
    media: query,
    matches: evaluate(),
    onchange: null as ((event: MediaQueryListEvent) => void) | null,
    addEventListener(
      type: string,
      listener: (event: MediaQueryListEvent) => void,
    ) {
      if (type === "change") listeners.add(listener);
    },
    removeEventListener(
      type: string,
      listener: (event: MediaQueryListEvent) => void,
    ) {
      if (type === "change") listeners.delete(listener);
    },
    addListener(listener: (event: MediaQueryListEvent) => void) {
      listeners.add(listener);
    },
    removeListener(listener: (event: MediaQueryListEvent) => void) {
      listeners.delete(listener);
    },
    dispatchEvent() {
      return true;
    },
  };
  window.addEventListener("resize", () => {
    const matches = evaluate();
    if (matches === mql.matches) return;
    mql.matches = matches;
    const event = { matches, media: query } as MediaQueryListEvent;
    mql.onchange?.(event);
    listeners.forEach((listener) => listener(event));
  });
  return mql as unknown as MediaQueryList;
}) as typeof matchMedia;

// --- Media streams / elements -------------------------------------------------
// bot-audio pipes tracks into <audio> via srcObject; video controls render
// track previews. jsdom implements none of the media stack.

globalThis.MediaStream ??= class MediaStream {
  private tracks: MediaStreamTrack[];
  constructor(tracks: MediaStreamTrack[] = []) {
    this.tracks = [...tracks];
  }
  getTracks() {
    return [...this.tracks];
  }
  getAudioTracks() {
    return this.tracks.filter((t) => t.kind === "audio");
  }
  getVideoTracks() {
    return this.tracks.filter((t) => t.kind === "video");
  }
  addTrack(track: MediaStreamTrack) {
    this.tracks.push(track);
  }
  removeTrack(track: MediaStreamTrack) {
    this.tracks = this.tracks.filter((t) => t !== track);
  }
} as unknown as typeof MediaStream;

// jsdom defines play/pause/load but they log "not implemented" — always
// overwrite rather than guard.
HTMLMediaElement.prototype.play = function () {
  return Promise.resolve();
};
HTMLMediaElement.prototype.pause = function () {};
HTMLMediaElement.prototype.load = function () {};

if (!("srcObject" in HTMLMediaElement.prototype)) {
  const srcObjects = new WeakMap<HTMLMediaElement, MediaProvider | null>();
  Object.defineProperty(HTMLMediaElement.prototype, "srcObject", {
    configurable: true,
    get() {
      return srcObjects.get(this) ?? null;
    },
    set(value: MediaProvider | null) {
      srcObjects.set(this, value);
    },
  });
}
