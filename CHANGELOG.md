# Changelog

All notable changes to **Voice UI Kit** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

[0.4.0]

**IMPORTANT:** This is the last release before `1.0.0`, which will introduce breaking changes. The upcoming major version will add a component registry (via ShadCN) and significantly change the library developer experience. Most primitive components will be removed in `1.0.0`, so please plan your upgrade path accordingly. A migration guide will be provided to assist upgrading.

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
