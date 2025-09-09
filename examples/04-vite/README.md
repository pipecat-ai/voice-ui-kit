# Vite Integration

Example using Vite build tool instead of Next.js, demonstrating how to integrate the Voice UI Kit with any React setup.

## Features

- Vite development server
- `PipecatAppBase` helper component
- Card-based UI layout
- Voice visualizer component
- Audio controls and connection management

## Quick Start

```bash
# Build the voice-ui-kit package (required for workspace dependencies)
cd ../..
pnpm build

# Install dependencies
cd examples/04-vite
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) to view the example.

## What's Included

- `PipecatAppBase` - Simplified client wrapper
- `Card` - Container component
- `VoiceVisualizer` - Audio visualization
- `UserAudioControl` - Microphone controls
- `ConnectButton` - Connection management
- `FullScreenContainer` - Layout wrapper

## Framework

- **Vite 7**
- **React 19**
- **TypeScript**
- **ESLint**
