# Custom Themes

Example demonstrating how to implement custom themes with the Voice UI Kit, featuring a terminal-inspired design.

## Features

- Custom terminal theme
- VT323 monospace font
- Event stream panel
- Custom button styling
- Theme-aware components

## Quick Start

```bash
# Build the voice-ui-kit package (required for workspace dependencies)
cd ../..
pnpm build

# Install dependencies
cd examples/05-themes
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) to view the example.

## What's Included

- `ThemeProvider` - Theme management
- Custom terminal theme styling
- `EventStreamPanel` - Real-time events display
- `Controls` - Custom control components
- Theme-aware button variants
- VT323 font integration

## Framework

- **Vite 7**
- **React 19**
- **Tailwind CSS 4**
- **TypeScript**
- **@fontsource/vt323**
