import type {
  PipecatClientOptions,
  RTVIMessage,
  Tracks,
  TransportState,
} from "@pipecat-ai/client-js";
import { Transport } from "@pipecat-ai/client-js";

/**
 * Minimal concrete Transport for constructing a real PipecatClient in tests
 * (the house rule is to never mock @pipecat-ai/client-js). Media/device
 * methods are inert; state starts "initialized" after the client wires it up
 * so connect guards pass. Network-touching client methods (connect, startBot,
 * …) should be spied on the PipecatClient prototype per test.
 */
export class StubTransport extends Transport {
  initialize(
    options: PipecatClientOptions,
    messageHandler: (ev: RTVIMessage) => void,
  ): void {
    this._options = options;
    this._onMessage = messageHandler;
    this._state = "initialized";
  }

  async initDevices(): Promise<void> {}

  _validateConnectionParams(connectParams?: unknown): unknown {
    return connectParams;
  }

  async _connect(): Promise<void> {
    this.state = "connected";
  }

  async _disconnect(): Promise<void> {
    this.state = "disconnected";
  }

  sendReadyMessage(): void {}

  get state(): TransportState {
    return this._state;
  }

  set state(state: TransportState) {
    this._state = state;
  }

  async getAllMics(): Promise<MediaDeviceInfo[]> {
    return [];
  }
  async getAllCams(): Promise<MediaDeviceInfo[]> {
    return [];
  }
  async getAllSpeakers(): Promise<MediaDeviceInfo[]> {
    return [];
  }
  updateMic(): void {}
  updateCam(): void {}
  updateSpeaker(): void {}
  get selectedMic(): MediaDeviceInfo | Record<string, never> {
    return {};
  }
  get selectedCam(): MediaDeviceInfo | Record<string, never> {
    return {};
  }
  get selectedSpeaker(): MediaDeviceInfo | Record<string, never> {
    return {};
  }
  enableMic(): void {}
  enableCam(): void {}
  enableScreenShare(): void {}
  get isCamEnabled(): boolean {
    return false;
  }
  get isMicEnabled(): boolean {
    return true;
  }
  get isSharingScreen(): boolean {
    return false;
  }
  sendMessage(): void {}
  tracks(): Tracks {
    return {} as Tracks;
  }
}
