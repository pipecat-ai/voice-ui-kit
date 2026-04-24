# Changelog

## [0.9.0](https://github.com/pipecat-ai/voice-ui-kit/compare/v0.8.2...v0.9.0) (2026-04-24)


### Features

* **audio:** add bot audio output volume control ([7dd1e4d](https://github.com/pipecat-ai/voice-ui-kit/commit/7dd1e4d541b34ddd7d22d3bcfee0d633012936d3))
* **audio:** add bot audio output volume control ([52b3e88](https://github.com/pipecat-ai/voice-ui-kit/commit/52b3e889e47c4eb8fc3ea8772431b0e3fd84a619))
* **conversation:** add textRenderMode switch for bot message display ([6a2f5c1](https://github.com/pipecat-ai/voice-ui-kit/commit/6a2f5c1b86c26b0f5f920ce7df2b34d0c51bcd7d))
* **conversation:** add textRenderMode switch for bot message display ([bdf017d](https://github.com/pipecat-ai/voice-ui-kit/commit/bdf017d7341133dd576ebb08df1ff4590b11892b))


### Bug Fixes

* **audio:** address PR review feedback on bot volume control ([01f7065](https://github.com/pipecat-ai/voice-ui-kit/commit/01f70656ac726b853e4880f1970d5d3957a19346))
* **audio:** center panel title when controls hidden, align popover end ([b2a9255](https://github.com/pipecat-ai/voice-ui-kit/commit/b2a92555828d47aa940df11b473ae65e1b4ebc2e))
* **audio:** drop reserved mute prop comments on BotAudioPanel ([4fd3bea](https://github.com/pipecat-ai/voice-ui-kit/commit/4fd3bea4a5e1b31199a0a24743c3a2283dcf7bf7))
* **bot-output:** handle S2S races, mid-sentence drift, and multi-word TTS events ([1c1540e](https://github.com/pipecat-ai/voice-ui-kit/commit/1c1540e9508d5fb22a1ca89da6e6c6f3416fb9df))
* **bot-output:** handle S2S races, mid-sentence drift, and multi-word TTS events ([f2492f1](https://github.com/pipecat-ai/voice-ui-kit/commit/f2492f1538fe98c9e0a2741efacfeac2b89e063f))

## [0.8.2](https://github.com/pipecat-ai/voice-ui-kit/compare/v0.8.1...v0.8.2) (2026-03-31)


### Bug Fixes

* backdate injected messages during active bot response ([9568928](https://github.com/pipecat-ai/voice-ui-kit/commit/9568928ce06697d37cf8819512057abd6b1a1932))
* backdate injected messages during active bot response ([818edc8](https://github.com/pipecat-ai/voice-ui-kit/commit/818edc89c2c82de081b61dfef87fac816adae861))
* backdate mid-turn function calls to preserve karaoke cursor ([6da24cf](https://github.com/pipecat-ai/voice-ui-kit/commit/6da24cf188049291c9fd32c36c694c2a9042cd73))
* backdate mid-turn function calls to preserve karaoke cursor ([8583fa6](https://github.com/pipecat-ai/voice-ui-kit/commit/8583fa67aba132464cf109c8ab0579c6cdd7b231))
* fix karaoke highlighting for non-ASCII text and punctuation ([8692c28](https://github.com/pipecat-ai/voice-ui-kit/commit/8692c2872a5e6ba80305d8bfeb8c5eca4857d93d))
* fix karaoke highlighting for non-ASCII text and punctuation ([f21e44c](https://github.com/pipecat-ai/voice-ui-kit/commit/f21e44c5c0e1f606be4a73c4903ff5114095e311))
* use startBotAndConnect when connectParams is an APIRequest ([bccdc81](https://github.com/pipecat-ai/voice-ui-kit/commit/bccdc8172e1ac63a46392b9c53053546b5af2b59))

## [0.8.1](https://github.com/pipecat-ai/voice-ui-kit/compare/v0.8.0...v0.8.1) (2026-03-11)


### Bug Fixes

* improve turn detection and karaoke highlighting ([ccdf529](https://github.com/pipecat-ai/voice-ui-kit/commit/ccdf529a9acc3c169d5e53340f480988c502fdbf))
* improve turn detection and karaoke highlighting ([e37f57b](https://github.com/pipecat-ai/voice-ui-kit/commit/e37f57bf1e31879aea205b00cd8f8438d59d35ad))


### Performance Improvements

* optimize conversation rendering pipeline ([4fa54b3](https://github.com/pipecat-ai/voice-ui-kit/commit/4fa54b30afb4344a02b15be9796562a644b46331))
* optimize conversation rendering pipeline ([5d6d6ae](https://github.com/pipecat-ai/voice-ui-kit/commit/5d6d6ae2306431533247c22a19b3ecd5c7e950cf))

## [0.8.0](https://github.com/pipecat-ai/voice-ui-kit/compare/v0.7.2...v0.8.0) (2026-02-25)


### Features

* add function calls to conversation panel ([8b89cc8](https://github.com/pipecat-ai/voice-ui-kit/commit/8b89cc8423b629029e26b5c9ff8945f39365d44f))
* add reverseOrder prop to Conversation ([f14b09f](https://github.com/pipecat-ai/voice-ui-kit/commit/f14b09fd1f2e801f57423ed43766bc55a169eeef))
* **console:** add tooltip to Connect button showing connection endpoint ([56dbe30](https://github.com/pipecat-ai/voice-ui-kit/commit/56dbe30ac1584b594c186e341fc2ea3f45043924))


### Bug Fixes

* show friendly label for unnamed function calls ([be2ad19](https://github.com/pipecat-ai/voice-ui-kit/commit/be2ad192a9a232e48506e0426e7f914096494fb8))


### Performance Improvements

* **visualizers:** optimize VoiceVisualizer rendering performance ([0c47a8d](https://github.com/pipecat-ai/voice-ui-kit/commit/0c47a8d538fe391ea59456eb425886b86b984a43))
* **visualizers:** optimize VoiceVisualizer rendering performance ([ccd871a](https://github.com/pipecat-ai/voice-ui-kit/commit/ccd871a568affc734ba06d8d05582bab66c4e41f))

## [0.7.2](https://github.com/pipecat-ai/voice-ui-kit/compare/v0.7.1...v0.7.2) (2026-02-23)


### Bug Fixes

* long bot messages when bot sends stopped speaking mid-turn ([0277a2c](https://github.com/pipecat-ai/voice-ui-kit/commit/0277a2cac7821e0b8958fb7e42cce467cb443d38))

## Changelog

All notable changes to **Voice UI Kit** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**IMPORTANT:** This is the last release before `1.0.0`, which will introduce breaking changes. The upcoming major version will add a component registry (via ShadCN) and significantly change the library developer experience. Most primitive components will be removed in `1.0.0`, so please plan your upgrade path accordingly. A migration guide will be provided to assist upgrading.

[Unreleased]

- Security: Upgraded `next` to 15.5.12, `vite` to ^7.1.11, `tar` to >=7.5.7, and `glob` to >=10.5.0 to address known vulnerabilities (DoS, SSRF, path traversal, command injection).
- Added: LLM function call display in the conversation view (`LLMFunctionCallStarted`, `LLMFunctionCallInProgress`, `LLMFunctionCallStopped` events)
- Added: `FunctionCallContent` component for rendering function calls with collapsible details (arguments, result)
- Added: `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` UI primitives (wrapping `@radix-ui/react-collapsible`)
- Added: `noFunctionCalls` prop on `ConversationPanel` and `Conversation` to disable rendering of function call messages
- Added: `functionCallLabel` prop on `Conversation`, `MessageContainer`, and `MessageRole` to customize the function call label
- Added: `functionCallRenderer` prop on `Conversation`, `MessageContainer`, and `FunctionCallContent` for custom function call rendering. Accepts a `FunctionCallRenderer` callback that receives the full `FunctionCallData` and returns a `ReactNode`.
- Added: `FunctionCallData` type and `functionCall` field on `ConversationMessage`
- Added: `addFunctionCall`, `updateFunctionCall`, `updateLastStartedFunctionCall` actions on the conversation store
- Changed: `ConversationMessage.role` now includes `"function_call"` as a valid value
- Changed: Bumped peer dependency `@pipecat-ai/client-js` to `>=1.6.0`, `@pipecat-ai/daily-transport` to `>=1.6.0`, `@pipecat-ai/small-webrtc-transport` to `>=1.9.0`

[0.7.1]

- Fixed: The last sentence of a previous assistant message no longer resets to unspoken when the bot starts a new turn.

[0.7.0]

- Added: Conversation messages are now built from BotOutput events when the RTVI server supports them
- Added: `botOutputRenderers` prop on `MessageContent`, `MessageContainer`, `Conversation`, and `ConversationPanel` to customize rendering of BotOutput content by aggregation type
- Added: `AggregationMetadata` type and `aggregationMetadata` prop to control rendering and speech progress per aggregation type (`isSpoken`, `displayMode`: inline/block)
- Added: `SessionInfo` displays RTVI Server version (from BotReady); `noRTVIVersion` prop to hide the RTVI version section
- Added: `TranscriptOverlay` uses BotOutput events for remote participant when supported (word-level); works with servers that send sentence-level or non-word-level TTS
- Changed: `Conversation` shows a warning when the server does not support botOutput events; `ConversationProvider` exposes `botOutputSupported` in context
- Changed: Conversation building no longer uses raw TTS/LLM events; uses BotOutput stream when available
- Changed: `ConversationMessage` type no longer includes `mode`; part structure clarified for transcription and BotOutput

[0.6.0]

- Added: `UserAudioControl` dropdown can list both microphones and speakers with grouped sections
- Added: `dropdownMenuLabel` to customize or hide the main dropdown label
- Added: `microphoneLabel`, `speakerLabel` to customize dropdown section labels
- Added: `noMicrophones`, `noSpeakers` to independently hide device dropdown sections
- Added: `noTextInput` to `Console` template and `Conversation` component to hide text input controls
- Added: `noInject` to `TextInput` component to prevent user text messages from being injected into conversation state
- Added: `onSend` callback prop to `TextInput`
- Updated: Console template now uses `UserAudioControl` for speaker selection instead of `UserAudioOutputControl`
- Fixed: `noAudioOutput` prop correctly passed down to `PipecatAppBase` in Console template

[0.5.0]

- Added: `initDevicesOnMount` prop to `PipecatAppBase`, giving developers full control over when device access permissions are requested.

[0.4.2]

- Fixed: bug that accidentally required installation of `@pipecat-ai/small-webrtc-transport` even though it wasn't used.

[0.4.1]

- Updated: Bumped `pipecat-ai/client-react` to `1.1.0` (adds hooks for working with screen media.)
- Fixed: bug in `usePipecatConnectionState` where state would not update if component was conditionally rendered after the client connected.
- Added: `UserScreenControl` and `UserScreenControlComponent` for managing screen media.
- Changed: `InfoPanel` and `Console` template modified to implement `UserScreenControl` (if supported).

[0.4.0]

- Bumped: Pipecat Client and Transport dependencies
- Added: Updated `PipecatAppBase` and Console template with support for latest Pipecat Client API
- Added: Console template now shows session ID from transport
- Fixed: `Conversation` component layout fixed in some instances

[0.3.0]

- Added: `TranscriptOverlay` animation durations are now configurable via props
- Added: `UserAudioControl` and `UserVideoControl` now accept `deviceDropDownProps` that can be used to configure drop down
- Added: `VoiceVisualizer` can now optionally render with bar peaks
- Changed: Restructured conversation message types to introduce `parts` for better transcription handling
- Added: `usePipecatConversation` hook for deriving structured conversation streams from RTVI events
- Added: Ability to switch between TTS and LLM text mode for testing and development
- Added: Message injection capabilities via `injectMessage` function for programmatic message addition
- Added: Message rendering with support for both string content and React components
- Fixed: Color of the visualizer in `UserAudioControl` now uses `currentColor` vs. resolving from variable

[0.2.2]

- Fixed `Textarea` sizing and auto height
- Change `AudioOutput` renamed to `UserAudioOutputControl` for consistency
- Added `usePipecatConnectionState` now returns boolean results `isConnected`, `isConnecting`, `isDisconnected`
- Added `TextInputComponent` and `TextInput` for sending text messages
- Fixed `PipecatAppBase` memoization
- Fixed `PipecatAppBase` to accept partial `clientOptions`

[0.2.1]

- Added: `SelectTrigger` now supports alignment variant prop
- Added: `LED` primitive for binary user feedback on watched property
- Added: `useTheme` hook for getting and setting theme when using `ThemeProvider`
- Change: `ThemeProvider` context now supports arbitrary theme names
- Added: `05-themes` example that demonstrates a custom theme implementation
- Added: `hooks/usePipecatEventStream.ts` for obtaining firehouse of events from Pipecat Client
- Added: `DeviceSelect` component that renders available devices in a select control
- Change: `UserAudioControl` now accepts `activeText` and `inactiveText` for simpler mute buttons
- Change: `UserAudioControl` now accepts `noIcon` prop that hides the mic icon
- Change: `UserAudioControl` now accepts `children` for further flexibility
- Added: `utilities.css` included as raw css in distribution so developers can use in app code
- Added: export custom tailwind merge `cn` function for use in custom themes

[0.2.0]

Various visual enhancements, primitve additions and CSS variables in support of more flexible theming.

To prep for shadcn registry components, utilities and variables are no longer built with a
Tailwind prefix (`vkui`). A scoped export still exists in the package for instances where style isolation matters.

- Change: switched to pnpm for better workspace management
- Added: out-of-the-box themes e.g [05-theme](examples/05-theme)
- Added: Badge primitive
- Added: Progress primitive
- Added: Divider
- Added: Additional card variants and decorations
- Added: `StripeLoader`
- Added: Component - `HighlightOverlay` that draws user attention to a particular UI element
- Added: TW4 utilities for shadow classes to allow overrides in external themes.
- Added: TW4 utilities for button sizing
- Change: `AudioClientHelper` renamed to `PipecatAppBase`.
  - Now accepts both React Node children as well as a functional list for prop injection. If passing renderables, client methods can be accessed directly on the context's client via Pipecat React hooks (e.g. `usePipecatClient`).
  - Added `noThemeProvider` prop to optionally disable theme provider wrapping.
  - Made connection handlers (`handleConnect`, `handleDisconnect`) compatible with both sync and async functions.
  - Enhanced error handling and loading states for better developer experience.
  - Returns the `client` object in child props.
  - Fixed TypeScript component type definition to resolve JSX usage errors.
- Change: `LoaderSpinner` component from `components/ui/loaders` has been renamed to `SpinLoader` to establish a naming convention for future loaders.
- Change: `Cards` primitive no longer pads based on media queries for flexibility
- Change: `css/components.css` and `css/utilities.css` split from main `index.css`
- Fixed: `tailwind-merge` needs extensions for custom shadow-\* class names, which have no been applied.
- Fixed: CSS nits to address border overlap for button groups when in dark mode.
- Fixed: User audio control no longer shrinks when loading
