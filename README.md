# switch9proxy

> AI Router Workspace Switcher — multi-profile environment manager for [9router](https://www.npmjs.com/package/9router)

![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)

## Overview

**switch9proxy** lets you create and switch between isolated profiles (workspaces) for 9router. Each workspace has its own SQLite database with separate providers, API keys, and OAuth tokens.

Free providers like Kiro, OpenCode detect clients by OAuth tokens or IP. With switch9proxy you can:
- Create multiple workspaces with different provider credentials
- Preview workspace data without switching
- Switch active workspace with one click
- See provider status, error codes, model locks, and usage statistics
- Language: RU/EN

## How it works

```
┌──────────────────────────────────────────────────────┐
│                  Dashboard :20129                    │
│  ┌────────────┐  ┌────────────────────────────────┐ │
│  │ Workspaces │  │ Providers + Stats              │ │
│  │  main  🔥  │  │ Kiro     ⚠ 402  credits 50/50 │ │
│  │  stealth   │  │ OpenCode ✅ unlimited           │ │
│  │  work      │  │ OpenRouter ⚠ 429 rate limited   │ │
│  └────────────┘  └────────────────────────────────┘ │
└──────────────────────┬───────────────────────────────┘
                       │
          switchWorkspace(name) → DATA_DIR change
                       │
┌──────────────────────▼───────────────────────────────┐
│              9router CLI :20128                       │
│  DATA_DIR=%APPDATA%\9router  (workspace "main")      │
│  DATA_DIR=~/.workspace-manager/workspaces/stealth    │
└──────────────────────────────────────────────────────┘
```

## Installation

```bash
# Requirements: Node.js 18+, 9router installed globally
npm install -g 9router

# Clone and install switch9proxy
git clone https://github.com/GPCProject/switch9proxy.git
cd switch9proxy
npm install
```

## Usage

```bash
# Start the dashboard
npm start

# Open in browser
# http://localhost:20129

# CLI
node cli/index.js list
node cli/index.js create work
node cli/index.js switch work
```

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/workspaces` | List all workspaces |
| GET | `/api/workspace/providers?name=X` | Get providers for workspace X |
| GET | `/api/workspace/stats?name=X` | Get usage stats for workspace X |
| PUT | `/api/workspace/switch` | Switch active workspace |
| POST | `/api/workspaces` | Create new workspace |
| DELETE | `/api/workspaces/:name` | Delete workspace |

## Features

- ✅ Cyberpunk terminal-style dashboard
- ✅ Multi-workspace with isolated SQLite databases
- ✅ One-click workspace preview (without switching)
- ✅ Provider status with error indicators (401/402/429)
- ✅ Model lock display (per-provider dropdown)
- ✅ Usage statistics (tokens, requests, cost)
- ✅ Linked accounts (Google/AWS emails)
- ✅ Auto-OAuth for Kiro
- ✅ Language switcher (RU/EN)

## Project Structure

```
switch9proxy/
├── src/
│   ├── index.js      # Entry point
│   ├── config.js     # Paths, ports
│   ├── manager.js    # Workspace management
│   ├── api.js        # REST API + static files
│   └── db-reader.js  # SQLite reader
├── cli/index.js      # CLI commands
├── web/index.html    # Dashboard UI
├── package.json
├── LICENSE           # MIT
└── README.md
```

## License

MIT © [GPCProject](https://github.com/GPCProject)

## Contributing

Pull Requests welcome! See [CONTRIBUTING.md](CONTRIBUTING.md)
