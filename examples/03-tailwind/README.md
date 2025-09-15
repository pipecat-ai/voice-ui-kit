# Helper Abstractions

Example using `PipecatAppBase` helper component to simplify voice interface development while maintaining full customization control.

## Features

- `PipecatAppBase` for simplified client management
- Custom UI composition with helper abstractions
- WebGL plasma visualizer
- Real-time transcript overlay
- Enhanced control bar with gradients

## Quick Start

```bash
# Build the voice-ui-kit package (required for workspace dependencies)
cd ../..
pnpm build

# Install dependencies
cd examples/03-tailwind
pnpm install

# Install Three.js (required for PlasmaVisualizer)
pnpm add three

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the example.

## What's Included

- `PipecatAppBase` - Simplified client wrapper
- `usePipecatClientTransportState` - Connection state hook
- `ConnectButton` - Connection management
- `TranscriptOverlay` - Real-time transcription
- `ControlBar` - Enhanced UI with gradients
- `PlasmaVisualizer` - WebGL audio visualization

## Framework

- **Next.js 15** with App Router
- **React 19**
- **Tailwind CSS 4**
- **TypeScript**
- **Three.js** (required for PlasmaVisualizer)
