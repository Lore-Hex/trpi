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

```bash
pi
/login  # Then select provider
```

Then just talk to pi. By default, pi gives the model four tools: `read`, `write`, `edit`, and `bash`. The model uses these to fulfill your requests. Add capabilities via [skills](#skills), [prompt templates](#prompt-templates), [extensions](#extensions), or [pi packages](#pi-packages).

**Platform notes:** [Windows](docs/windows.md) | [Termux (Android)](docs/termux.md) | [tmux](docs/tmux.md) | [Terminal setup](docs/terminal-setup.md) | [Shell aliases](docs/shell-aliases.md)

---

## Providers & Models

For each built-in provider, pi maintains a list of tool-capable models. Configured provider catalogs refresh automatically; run `pi update --models` to force an immediate refresh. Authenticate via subscription (`/login`) or API key, then select any model from that provider via `/model` (or Ctrl+L). Press Ctrl+S in the model picker to save the highlighted model as the startup default.

**Subscriptions:**
- Anthropic Claude Pro/Max
- OpenAI ChatGPT Plus/Pro (Codex)
- GitHub Copilot

**API keys:**
- Anthropic
- Ant Ling
- OpenAI
- Azure OpenAI
- DeepSeek
- NVIDIA NIM
- Google Gemini
- Google Vertex
- Amazon Bedrock
- Mistral
- Groq
- Cerebras
- Cloudflare AI Gateway
- Cloudflare Workers AI
- xAI
- OpenRouter
- Vercel AI Gateway
- ZAI Coding Plan (Global)
- ZAI Coding Plan (China)
- OpenCode Zen
- OpenCode Go
- Hugging Face
- Fireworks
- Together AI
- Baseten
- Kimi For Coding
- MiniMax
- Xiaomi MiMo
- Xiaomi MiMo Token Plan (China)
- Xiaomi MiMo Token Plan (Amsterdam)
- Xiaomi MiMo Token Plan (Singapore)

Pi also supports the llama.cpp router server. Configure it with `/login llama.cpp`, manage downloads and loaded models with `/llama`, then select a loaded model with `/model`. See [docs/llama-cpp.md](docs/llama-cpp.md) for setup and usage.

See [docs/providers.md](docs/providers.md) for other provider setup instructions.

**Custom providers & models:** Add providers via `~/.tr-confidential-cowork/agent/models.json` if they speak a supported API (OpenAI, Anthropic, Google). For custom APIs or OAuth, use extensions. See [docs/models.md](docs/models.md) and [docs/custom-provider.md](docs/custom-provider.md).

---

## Interactive Mode

<p align="center"><img src="docs/images/interactive-mode.png" alt="Interactive Mode" width="600"></p>

The interface from top to bottom:

- **Startup header** - Shows shortcuts (`/hotkeys` for all), loaded AGENTS.md files, prompt templates, skills, and extensions
- **Messages** - Your messages, assistant responses, tool calls and results, notifications, errors, and extension UI
- **Editor** - Where you type; border color indicates thinking level and the border shows the streaming working indicator
- **Footer** - Working directory, session name, total token/cache usage (`↑` input, `↓` output, `R` cache read, `W` cache write, `CH` latest cache hit rate), cost, context usage, current model. Totals include assistant responses, usage reported by tools, and summary generation.

The editor can be temporarily replaced by other UI, like built-in `/settings` or custom UI from extensions (e.g., a Q&A tool that lets the user answer model questions in a structured format). [Extensions](#extensions) can also replace the editor, add widgets above/below it, a status line, custom footer, or overlays.

### Editor

| Feature | How |
|---------|-----|
| File reference | Type `@` to fuzzy-search project files |
| Path completion | Tab to complete paths |
| Multi-line | Shift+Enter (or Ctrl+Enter on Windows Terminal) |
| External editor | Ctrl+G opens `externalEditor`, `$VISUAL`, `$EDITOR`, Notepad on Windows, or `nano` elsewhere |
| Clipboard | Ctrl+V to paste an image or text (Alt+V on Windows), or drag images onto terminal |
| Bash commands | `!command` runs and sends output to LLM, `!!command` runs without sending |

Standard editing keybindings for delete word, undo, etc. See [docs/keybindings.md](docs/keybindings.md).

### Commands

Type `/` in the editor to trigger commands. [Extensions](#extensions) can register custom commands, [skills](#skills) are available as `/skill:name`, and [prompt templates](#prompt-templates) expand via `/templatename`.

| Command | Description |
|---------|-------------|
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

TrustedRouter is the default provider, and `trustedrouter/confidential` is the default route. Every TrustedRouter model request carries `provider.data_collection=deny` and the hard `provider.min_privacy=confidential` floor, so an unavailable confidential endpoint fails closed instead of silently downgrading. Use `/model`, Ctrl+L, or the CLI to select a route:

```bash
tr-cowork --list-models trustedrouter
tr-cowork --provider trustedrouter --model openai/gpt-5.4-mini
tr-cowork --model trustedrouter/openai/gpt-5.4-mini
```

The catalog is refreshed at startup unless offline mode is enabled. Model changes are recorded in the session transcript. Explicitly configured upstream Pi providers remain available for users who choose to supply those credentials.

## Configuration

**`/tree`** - Navigate the session tree in-place. Select any previous point, continue from there, and switch between branches. All history preserved in a single file. Selecting a point while the model is responding cancels that response. Navigation cannot proceed while compaction or another tree navigation is still running; wait for it to finish and retry.

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
