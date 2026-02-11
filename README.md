# Agmente RN

Cross-platform React Native client for ACP (Agent Client Protocol) coding agents. This is a complete rewrite of [Agmente](https://github.com/rebornix/Agmente) (originally an iOS-only SwiftUI app) using React Native + Expo to target iOS, Android, and Web.

## Features

- **Connect to ACP agents** (Copilot CLI, Gemini CLI, Claude Code adapters, Qwen, Mistral Vibe, and others)
- **Multi-server management** – Save and switch between multiple agent endpoints
- **Session management** – Create, list, and switch between conversations
- **Rich chat transcript** – View messages with tool call details, thoughts, and streaming
- **Persistent storage** – Servers, sessions, and messages stored via AsyncStorage
- **Cross-platform** – Runs on iOS, Android, and Web

## Architecture

```
src/
├── acp/                    # ACP protocol client layer
│   ├── models/             # JSON-RPC & ACP type definitions
│   ├── ACPClient.ts        # WebSocket client
│   ├── ACPService.ts       # High-level RPC service
│   ├── ACPMethods.ts       # RPC method constants
│   ├── ACPMessageBuilder.ts# Request parameter builders
│   └── SessionUpdateHandler.ts # Notification parser
├── stores/
│   └── appStore.ts         # Zustand state management
├── storage/
│   └── SessionStorage.ts   # AsyncStorage persistence
├── screens/
│   ├── HomeScreen.tsx       # Server list + session sidebar
│   ├── SessionDetailScreen.tsx # Chat transcript + composer
│   ├── AddServerScreen.tsx  # Server configuration form
│   └── SettingsScreen.tsx   # Developer mode + logs
├── components/
│   ├── ChatBubble.tsx       # Message bubble with segments
│   ├── ConnectionBadge.tsx  # Status indicator
│   └── MessageComposer.tsx  # Text input + send/cancel
├── utils/
│   └── theme.ts             # Colors, spacing, fonts
└── navigation.tsx           # React Navigation stack
```

### Architecture Mapping (Swift → React Native)

| Swift (Original) | React Native |
|---|---|
| `ACPClient` package | `src/acp/` |
| `AppViewModel` + `ServerViewModel` | `src/stores/appStore.ts` (Zustand) |
| Core Data persistence | `src/storage/SessionStorage.ts` (AsyncStorage) |
| SwiftUI views | `src/screens/` + `src/components/` |

## Quick Start

```bash
# Install dependencies
npm install

# Start development
npx expo start

# Run on specific platform
npm run ios
npm run android
npm run web
```

## Connecting to an Agent

### Local ACP Agent (stdio-to-ws)

```bash
# Start agent on your machine
npx -y @rebornix/stdio-to-ws --persist --grace-period 604800 "npx @google/gemini-cli --experimental-acp" --port 8765
```

In the app:
1. Tap **+** to add a server
2. Set scheme: `ws`, host: `localhost:8765`
3. Save → Connect → New Session → Chat!

### Remote Agent

1. Start agent on remote host and expose via `wss://`
2. Add server with `wss://` scheme and your host
3. Optionally add bearer token or Cloudflare Access credentials

## Tech Stack

- **Expo** – Build tooling and development environment
- **TypeScript** – Type safety throughout
- **React Navigation** – Native stack navigation
- **Zustand** – Lightweight state management
- **AsyncStorage** – Persistent storage

## License

MIT
