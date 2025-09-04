# Individual Components

Low-level example demonstrating how to build a custom voice interface using individual components and the Pipecat client directly.

## Features

- Manual Pipecat client setup
- Custom component composition
- WebGL plasma visualizer
- Real-time transcript overlay
- Audio controls and connection management

## Quick Start

```bash
# Build the voice-ui-kit package (required for workspace dependencies)
cd ../..
pnpm build

# Install dependencies
cd examples/02-components
pnpm install

# Install Three.js (required for PlasmaVisualizer)
pnpm add three

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the example.

## What's Included

- `PipecatClient` - Direct client initialization
- `ConnectButton` - Connection management
- `TranscriptOverlay` - Real-time transcription
- `UserAudioControl` - Microphone controls
- `PlasmaVisualizer` - WebGL audio visualization
- `ControlBar` - UI layout component

## Framework

- **Next.js 15** with App Router
- **React 19**
- **Tailwind CSS 4**
- **TypeScript**
- **Three.js** (required for PlasmaVisualizer)
