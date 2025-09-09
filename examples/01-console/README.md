# Basic Console Template

A minimal example showing how to use the `ConsoleTemplate` component with Next.js.

## Features

- Full-screen console interface
- WebRTC transport connection
- No user video (audio-only)
- Built-in theme support

## Quick Start

```bash
# Build the voice-ui-kit package (required for workspace dependencies)
cd ../..
pnpm build

# Install dependencies
cd examples/01-console
pnpm install

# Setup .env file
cp env.example .env

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the example.

## What's Included

- `ConsoleTemplate` - Complete voice interface
- `FullScreenContainer` - Responsive layout wrapper
- `ThemeProvider` - Built-in theming system

## Framework

- **Next.js 15** with App Router
- **React 19**
- **TypeScript**
