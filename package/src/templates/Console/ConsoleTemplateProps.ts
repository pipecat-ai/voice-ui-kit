import {
  PipecatClientOptions,
  TransportConnectionParams,
} from "@pipecat-ai/client-js";
import { DailyTransportConstructorOptions } from "@pipecat-ai/daily-transport";
import { SmallWebRTCTransportConstructorOptions } from "@pipecat-ai/small-webrtc-transport";

export interface ConsoleTemplateProps {
  /** Disables RTVI related functionality. Default: false */
  noRTVI?: boolean;
  /** Specifies the RTVI version in use by the server. Default: null */
  serverRTVIVersion?: string | null;
  /** Disables user audio input entirely. Default: false */
  noUserAudio?: boolean;
  /** Disables user video input entirely. Default: false */
  noUserVideo?: boolean;
  /** Enables user video input. Default: false */
  userVideoEnabled?: boolean;
  /** Enables user audio input. Default: true */
  userAudioEnabled?: boolean;
  /** Disables audio output for the bot. Default: false */
  noAudioOutput?: boolean;
  /** Disables audio visualization for the bot. Default: false */
  noBotAudio?: boolean;
  /** Disables video visualization for the bot. Default: true */
  noBotVideo?: boolean;

  /** Type of transport to use for the RTVI client. Default: "daily" */
  transportType?: "daily" | "smallwebrtc";
  /** Options for configuring the transport. */
  transportOptions?:
    | SmallWebRTCTransportConstructorOptions
    | DailyTransportConstructorOptions;
  /** Parameters for connecting to the transport. */
  connectParams?: TransportConnectionParams;
  /** Options for configuring the RTVI client. */
  clientOptions?: Partial<PipecatClientOptions>;

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
}
