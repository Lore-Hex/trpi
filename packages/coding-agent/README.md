# TR Confidential Cowork

TR Confidential Cowork is a TrustedRouter-first terminal coding agent built from the current [Pi Agent Harness](https://github.com/earendil-works/pi). It combines Pi's interactive workflow, tools, sessions, extension system, and model switching with TrustedRouter's confidential model gateway.

The product name is **TR Confidential Cowork**. The shell command is `tr-cowork`.

## Install on macOS

Download the universal, Developer ID signed, Apple-notarized disk image from the [latest GitHub release](https://github.com/Lore-Hex/trpi/releases/latest). Open the disk image and drag **TR Confidential Cowork** into Applications.

The bundle supports Apple Silicon and Intel Macs. Every release includes a SHA-256 checksum.

## Run from source

Requires Node.js 22.19 or newer.

```bash
git clone https://github.com/Lore-Hex/trpi.git
cd trpi
npm ci --ignore-scripts
npm run hydrate:model-data
npm run build:offline
npm link --workspace tr-confidential-cowork --ignore-scripts
```

Configure a TrustedRouter key and start the agent:

```bash
export TRUSTEDROUTER_API_KEY="sk-tr-v1-..."
tr-cowork
```

`TR_API_KEY` and `TRUSTED_ROUTER_API_KEY` are accepted aliases. Inference uses `https://api.trustedrouter.com/v1`; the model selector refreshes from `https://trustedrouter.com/v1/models`.

## Core workflow

TR Confidential Cowork gives the model `read`, `write`, `edit`, and `bash` tools by default. Read-only `grep`, `find`, and `ls` tools can be enabled explicitly.

```bash
tr-cowork                                      # interactive TUI
tr-cowork "Review this repository"             # start with a prompt
tr-cowork -p "Summarize package.json"           # print and exit
tr-cowork --mode json -p "Inspect this project" # JSONL events
tr-cowork --mode rpc                           # RPC over stdin/stdout
tr-cowork -c                                   # continue latest session
tr-cowork -r                                   # choose a saved session
tr-cowork --tools read,grep,find,ls -p "Audit"  # read-only tool set
```

Inside interactive mode:

| Command | Purpose |
|---|---|
| `/model` | Search and switch models |
| `/scoped-models` | Configure models used by Ctrl+P cycling |
| `/login`, `/logout` | Manage provider credentials |
| `/settings` | Configure the terminal UI and runtime |
| `/resume`, `/new` | Resume or start a session |
| `/tree`, `/fork`, `/clone` | Navigate or branch session history |
| `/compact` | Summarize older context |
| `/export`, `/import`, `/share` | Move or share transcripts |
| `/reload` | Reload project resources |
| `/hotkeys` | Show keyboard shortcuts |

Run `tr-cowork --help` for the full CLI reference.

## Models

TrustedRouter is the default provider. Use `/model`, Ctrl+L, or the CLI to select a route:

```bash
tr-cowork --list-models trustedrouter
tr-cowork --provider trustedrouter --model openai/gpt-5.4-mini
tr-cowork --model trustedrouter/openai/gpt-5.4-mini
```

The catalog is refreshed at startup unless offline mode is enabled. Model changes are recorded in the session transcript. Explicitly configured upstream Pi providers remain available for users who choose to supply those credentials.

## Configuration

| Location | Purpose |
|---|---|
| `~/.tr-confidential-cowork/agent/settings.json` | Global settings |
| `~/.tr-confidential-cowork/agent/auth.json` | Local provider credentials |
| `~/.tr-confidential-cowork/agent/models.json` | Custom provider/model definitions |
| `~/.tr-confidential-cowork/agent/sessions/` | Session history |
| `.tr-confidential-cowork/settings.json` | Project settings |

Primary runtime variables:

| Variable | Purpose |
|---|---|
| `TRUSTEDROUTER_API_KEY` | TrustedRouter API key |
| `TR_COWORK_CODING_AGENT_DIR` | Override the global config directory |
| `TR_COWORK_CODING_AGENT_SESSION_DIR` | Override session storage |
| `TR_COWORK_OFFLINE=1` | Disable startup network operations |
| `TR_COWORK_SKIP_VERSION_CHECK=1` | Disable GitHub release checks |

See [environment-variables.md](docs/environment-variables.md) for the complete reference.

## Extension compatibility

TR Confidential Cowork preserves Pi's extension, skill, prompt-template, theme, SDK, JSON, and RPC contracts. The reusable upstream packages retain their `@earendil-works/pi-*` names so existing extensions remain source-compatible.

Detailed references:

- [Extensions](docs/extensions.md)
- [Skills](docs/skills.md)
- [Prompt templates](docs/prompt-templates.md)
- [Themes](docs/themes.md)
- [SDK](docs/sdk.md)
- [RPC](docs/rpc.md)
- [JSON mode](docs/json.md)
- [Custom providers](docs/custom-provider.md)

## Security and privacy

TrustedRouter requests go directly to `https://api.trustedrouter.com/v1`. The fork does not send Pi's upstream install or update telemetry. Session files and credentials stay on the local machine unless the user explicitly invokes a sharing or remote-provider feature.

TR Confidential Cowork runs with the permissions of the user who starts it. It is not a filesystem or process sandbox. Review third-party extensions before installing them; extensions execute with the same local permissions as the agent.

Report security issues through the [security policy](https://github.com/Lore-Hex/trpi/security/policy).

## Upstream and license

TR Confidential Cowork preserves Pi's MIT license and original attribution. Upstream development is at [earendil-works/pi](https://github.com/earendil-works/pi), originating from [badlogic/pi-mono](https://github.com/badlogic/pi-mono).

MIT
