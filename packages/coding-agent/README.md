# TRPI coding agent

TRPI is a TrustedRouter-first terminal coding harness based on [Pi](https://github.com/earendil-works/pi). It provides an interactive TUI, print and JSON modes, RPC integration, an SDK, persistent sessions, extension hooks, and model switching without leaving the session.

Repository: [github.com/Lore-Hex/trpi](https://github.com/Lore-Hex/trpi)

## Install

Tagged builds are published through [GitHub Releases](https://github.com/Lore-Hex/trpi/releases). Verify an archive against the release's `SHA256SUMS` before extracting it. Until the first tagged build is available, run from source:

To run from a source checkout, from the repository root:

```bash
npm ci --ignore-scripts
npm run hydrate:model-data
npm run build:offline
npm link --workspace trpi-coding-agent --ignore-scripts
```

This links the source-built `trpi` command into your npm global binary directory. Configuration and sessions are kept separate from upstream Pi under `~/.trpi/agent`.

## TrustedRouter quick start

```bash
export TRUSTEDROUTER_API_KEY="your-api-key"
trpi
```

`TR_API_KEY` is also accepted as a short compatibility alias. TrustedRouter is registered as provider `trustedrouter` with inference base URL `https://api.trustedrouter.com/v1`. Its public model catalog is `https://trustedrouter.com/v1/models`.

Select a model in any of these ways:

```bash
trpi --list-models
trpi --list-models trustedrouter
trpi --provider trustedrouter --model <model-id>
trpi --model trustedrouter/<model-id>
```

TRPI defaults to `trustedrouter/openai/gpt-5.4-mini` for coding because that route has been verified with tool calls. `trustedrouter/auto` remains selectable and can be useful for chat, but it is not coding-safe until TrustedRouter's automatic routing accounts for tool capability: it can currently send tool-bearing requests to models that do not support tools. TrustedRouter requests intentionally omit OpenRouter-style reasoning controls because some routed upstreams reject those fields.

Inside the interactive UI, use `/model` or Ctrl+L to search and switch models. Use `/scoped-models` to choose the models available for Ctrl+P cycling. Model switches are persisted in the session transcript.

Other upstream Pi providers remain available as fallbacks. Their credentials and setup are documented in [docs/providers.md](docs/providers.md).

## Core workflow

TRPI gives the model four built-in tools by default: `read`, `write`, `edit`, and `bash`. The read-only `grep`, `find`, and `ls` tools can be enabled explicitly.

```bash
trpi                                      # interactive TUI
trpi "Review this repository"             # TUI with an initial prompt
trpi -p "Summarize package.json"           # print response and exit
trpi --mode json -p "Inspect this project" # JSONL events
trpi --mode rpc                           # RPC over stdin/stdout
trpi -c                                   # continue the latest session
trpi -r                                   # choose a saved session
trpi --tools read,grep,find,ls -p "Audit"  # read-only tool set
```

Useful interactive commands:

| Command | Purpose |
|---|---|
| `/model` | Search and switch models |
| `/scoped-models` | Configure Ctrl+P model cycling |
| `/login`, `/logout` | Manage stored provider credentials |
| `/settings` | Configure the TUI and runtime behavior |
| `/resume`, `/new` | Resume or start a session |
| `/tree`, `/fork`, `/clone` | Navigate or branch session history |
| `/compact` | Summarize older context |
| `/export`, `/import`, `/share` | Move or share session transcripts |
| `/reload` | Reload resources and project context |
| `/hotkeys` | Show the full keyboard reference |

Run `trpi --help` for every CLI flag.

## Configuration

| Location | Scope |
|---|---|
| `~/.trpi/agent/settings.json` | Global settings |
| `.trpi/settings.json` | Project settings |
| `~/.trpi/agent/auth.json` | Credentials saved through `/login` |
| `~/.trpi/agent/models.json` | Custom providers and models |
| `~/.trpi/agent/sessions/` | Session transcripts |
| `~/.trpi/agent/AGENTS.md` | Global agent instructions |

Project-local settings and resources are subject to the built-in project trust flow. Non-interactive modes use `defaultProjectTrust` unless `--approve` or `--no-approve` is supplied.

### Environment variables

| Variable | Purpose |
|---|---|
| `TRUSTEDROUTER_API_KEY` | Primary TrustedRouter credential |
| `TR_API_KEY` | Short alias for the TrustedRouter credential |
| `TRPI_CODING_AGENT_DIR` | Override `~/.trpi/agent` |
| `TRPI_CODING_AGENT_SESSION_DIR` | Override session storage |
| `TRPI_PACKAGE_DIR` | Override the installed package directory |
| `TRPI_LATEST_VERSION_URL` | Override the GitHub release metadata URL |
| `TRPI_MODEL_CATALOG_BASE_URL` | Opt into a compatible remote Pi catalog overlay |
| `TRPI_SHARE_VIEWER_URL` | Override the `/share` viewer base URL |
| `TRPI_OFFLINE` | Disable startup network work |
| `TRPI_SKIP_VERSION_CHECK` | Disable the automatic version check |
| `PI_TELEMETRY` | Control optional provider attribution headers |

The inherited `PI_PACKAGE_DIR`, `PI_SHARE_VIEWER_URL`, `PI_OFFLINE`, and `PI_SKIP_VERSION_CHECK` names remain accepted as compatibility aliases. Child processes receive `AI_AGENT=trpi`, `TRPI_CODING_AGENT=true`, and the upstream `PI_CODING_AGENT=true` compatibility marker.

## Customization

TRPI retains Pi's extension system and package format:

| Resource | User directory | Project directory |
|---|---|---|
| Extensions | `~/.trpi/agent/extensions/` | `.trpi/extensions/` |
| Skills | `~/.trpi/agent/skills/` | `.trpi/skills/` |
| Prompt templates | `~/.trpi/agent/prompts/` | `.trpi/prompts/` |
| Themes | `~/.trpi/agent/themes/` | `.trpi/themes/` |

The reusable extension API still depends on the upstream `@earendil-works/pi-*` libraries. Existing Pi extensions can therefore keep their upstream import names while running under the `trpi` CLI. See [docs/extensions.md](docs/extensions.md), [docs/skills.md](docs/skills.md), [docs/prompt-templates.md](docs/prompt-templates.md), and [docs/themes.md](docs/themes.md).

Packages can be installed from npm, Git, SSH, or HTTPS:

```bash
trpi install npm:@example/pi-tools
trpi install git:github.com/example/pi-tools
trpi list
trpi config
trpi update --extensions
```

Third-party extensions and skills execute with the same system permissions as TRPI. Review them before installation.

## SDK and RPC

The SDK can be used from the source workspace; an npm distribution is not part of the initial release:

```typescript
import { createAgentSession, ModelRuntime, SessionManager } from "trpi-coding-agent";

const modelRuntime = await ModelRuntime.create();
const { session } = await createAgentSession({
  sessionManager: SessionManager.inMemory(),
  modelRuntime,
});

await session.prompt("What files are in the current directory?");
```

RPC mode uses LF-delimited JSONL records:

```bash
trpi --mode rpc
```

See [docs/sdk.md](docs/sdk.md) and [docs/rpc.md](docs/rpc.md).

## Network behavior

- TrustedRouter inference requests go to `https://api.trustedrouter.com/v1`; its provider refresh reads `https://trustedrouter.com/v1/models`.
- Version checks read the latest [Lore-Hex/trpi GitHub release](https://github.com/Lore-Hex/trpi/releases), unless `TRPI_LATEST_VERSION_URL` overrides it.
- The upstream `pi.dev` install/update ping is removed from TRPI.
- Generic Pi catalog overlays are off unless `TRPI_MODEL_CATALOG_BASE_URL` is configured.
- `/share` creates a private GitHub gist and returns its direct gist URL unless a custom viewer is configured.
- `--offline` or `TRPI_OFFLINE=1` disables startup network operations.

## Security

TRPI does not impose a permission boundary around tools or extensions. It runs with the filesystem, process, network, and credential access of its parent process. Use a container or sandbox when you need stronger isolation; see [docs/containerization.md](docs/containerization.md).

## Upstream and license

TRPI preserves Pi's MIT license and original author attribution. Upstream development is at [earendil-works/pi](https://github.com/earendil-works/pi), originating from [badlogic/pi-mono](https://github.com/badlogic/pi-mono).

MIT
