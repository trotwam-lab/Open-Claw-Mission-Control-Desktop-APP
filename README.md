# OpenClaw Mission Control Desktop App

A native desktop application for managing your OpenClaw agents, sessions, approvals, and more — all from one cockpit. Connects to your OpenClaw Gateway via WebSocket for real-time control.

## Features

- **Dashboard** — Live overview of agents, gateway health, token usage, and mission timeline
- **Sessions** — Track agent sessions from start to finish with metadata, export, and controls
- **Chat** — Converse with your agents directly with streaming responses and model selection
- **Approvals** — Human-in-the-loop gating for destructive actions (`exec.approval.requested`)
- **Terminal** — Embedded terminal (xterm.js) for direct command-line access
- **Channels** — Manage agent connections to Telegram, Discord, Slack, WhatsApp, Signal, etc.
- **Cron Jobs** — Schedule and manage recurring tasks for your agents
- **Secure Vault** — AES-GCM encrypted credential storage with PBKDF2 key derivation
- **Audit Trail** — Complete action history from gateway events, approvals, and controls
- **Settings** — Gateway connection config, auto-connect, and app preferences

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Electron Main Process                          │
│  ├── Gateway WebSocket Service (ws://18789)     │
│  ├── IPC Bridge (contextBridge)                 │
│  └── Shell/PTY for Terminal                     │
├─────────────────────────────────────────────────┤
│  Electron Renderer (React + Vite)               │
│  ├── Dashboard, Sessions, Chat, Approvals       │
│  ├── Terminal (xterm.js), Channels, Cron        │
│  ├── Vault, Audit, Settings                     │
│  └── Gateway Client (IPC or direct WebSocket)   │
└─────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│  OpenClaw Gateway (ws://localhost:18789)         │
│  Protocol v3 · JSON frames · 70+ RPC methods    │
└─────────────────────────────────────────────────┘
```

## Tech Stack

- **Electron** — Native desktop shell (macOS, Windows, Linux)
- **React 18** — UI framework
- **Vite** — Build tool with HMR
- **TypeScript** — Type safety throughout
- **xterm.js** — Embedded terminal
- **electron-builder** — Cross-platform packaging (.dmg, .exe, .AppImage)
- **WebSocket** — Real-time Gateway communication

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [OpenClaw](https://github.com/openclaw/openclaw) running with Gateway enabled

### Development

```bash
# Install dependencies
npm install

# Start dev server + Electron
npm run electron:dev

# Or just the web UI (browser mode, no Electron)
npm run dev
```

### Build

```bash
# Build for production
npm run build

# Build renderer only (for testing)
npm run build:renderer
```

### Gateway Connection

The app connects to your OpenClaw Gateway at `ws://localhost:18789` by default. Configure this in **Settings** or set the environment variable:

```bash
export OPENCLAW_GATEWAY_TOKEN=your-token-here
```

## Project Structure

```
src/
├── main/               # Electron main process
│   ├── main.ts         # App lifecycle, IPC handlers, window management
│   └── gateway.ts      # WebSocket client for OpenClaw Gateway
├── preload/
│   └── preload.ts      # Context bridge (IPC → renderer API)
└── renderer/src/
    ├── App.tsx          # Router and page layout
    ├── main.tsx         # React entry point
    ├── components/      # Reusable UI components
    │   └── common/      # Card, Layout, StatusBadge, MetricCard, PageHeader
    ├── hooks/
    │   └── useGateway.ts  # React hooks for gateway status, RPC, events
    ├── pages/           # Route pages
    │   ├── Dashboard.tsx
    │   ├── Sessions.tsx
    │   ├── Chat.tsx
    │   ├── Approvals.tsx
    │   ├── Terminal.tsx
    │   ├── Channels.tsx
    │   ├── CronJobs.tsx
    │   ├── Vault.tsx
    │   ├── Audit.tsx
    │   └── Settings.tsx
    ├── services/
    │   └── gateway.ts   # Renderer-side gateway client
    └── styles/
        └── global.css   # Design tokens and base styles
```

## Packaging

Cross-platform installers are built with electron-builder:

```bash
npm run build
```

Outputs:
- **macOS**: `.dmg` and `.zip` in `release/`
- **Windows**: `.exe` (NSIS installer) and `.zip` in `release/`
- **Linux**: `.AppImage` and `.deb` in `release/`

## Legacy

The original static prototype files are preserved in the `legacy/` directory for reference:
- `legacy/app.js` — Original vanilla JS
- `legacy/styles.css` — Original CSS theme
- `legacy/index-legacy.html` — Original HTML

## License

MIT
