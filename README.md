# TRPI

TRPI is a TrustedRouter-first distribution of the [Pi Agent Harness](https://github.com/earendil-works/pi). It keeps Pi's terminal workflow, tools, sessions, extensions, and mid-session model switching while making `trustedrouter` the primary provider.

The command is `trpi`, user state lives under `~/.trpi/agent`, and the CLI workspace package is named `trpi-coding-agent`. The public repository is [Lore-Hex/trpi](https://github.com/Lore-Hex/trpi).

## Tagged binaries

Tagged builds are published through [GitHub Releases](https://github.com/Lore-Hex/trpi/releases). Verify an archive against the release's `SHA256SUMS` before extracting it. Until the first tagged build is available, use the source installation below.

## Quick start from source

Requires Node.js 22.19 or newer.

```bash
npm ci --ignore-scripts
npm run hydrate:model-data
npm run build:offline
npm link --workspace trpi-coding-agent --ignore-scripts
export TRUSTEDROUTER_API_KEY="your-api-key"
trpi
```

Use `/model` or Ctrl+L to open the model selector. You can also select a model at startup or inspect the available catalog:

```bash
trpi --list-models
trpi --provider trustedrouter --model <model-id>
```

TrustedRouter uses `TRUSTEDROUTER_API_KEY`; `TR_API_KEY` is also accepted as a short compatibility alias. Its inference API is `https://api.trustedrouter.com/v1` and its public model catalog is `https://trustedrouter.com/v1/models`.

The default TrustedRouter coding model is `openai/gpt-5.4-mini`, which has been verified with TRPI's tool loop. `trustedrouter/auto` remains available for chat and explicit selection, but it is not coding-safe until TrustedRouter's automatic routing is capability-aware: it can currently route tool-bearing requests to models without tool support. TRPI also omits OpenRouter-style reasoning controls from TrustedRouter requests because some routed upstreams reject them.

## Configuration

| Location | Purpose |
|---|---|
| `~/.trpi/agent/settings.json` | Global settings |
| `~/.trpi/agent/models.json` | Custom providers and models |
| `~/.trpi/agent/sessions/` | Saved sessions |
| `.trpi/settings.json` | Project-local settings |

TRPI retains Pi's four execution modes: interactive, print/JSON, RPC, and the embeddable SDK. See the [coding-agent documentation](packages/coding-agent/README.md) for the full CLI and extension reference.

## Packages

| Package | Description |
|---|---|
| [`trpi-coding-agent`](packages/coding-agent) | TrustedRouter-first interactive coding agent CLI |
| [`@earendil-works/pi-agent-core`](packages/agent) | Upstream agent runtime with tool calling and state management |
| [`@earendil-works/pi-ai`](packages/ai) | Upstream multi-provider LLM API |
| [`@earendil-works/pi-tui`](packages/tui) | Upstream terminal UI library |
| [`@earendil-works/pi-telemetry`](packages/telemetry) | Vendor-neutral telemetry contracts and schemas |

The upstream package scopes remain in place where they are part of the reusable Pi libraries and extension API. This keeps existing extensions source-compatible while the standalone CLI has its own identity and configuration directory.

## Security

TRPI runs with the permissions of the user and process that launched it. It does not add a built-in filesystem, process, network, or credential sandbox. For stronger boundaries, use a container or one of the patterns in [containerization.md](packages/coding-agent/docs/containerization.md).

## Development

```bash
npm ci --ignore-scripts       # Install the locked dependencies
npm run hydrate:model-data    # Fetch model metadata once after a Git clone
npm run build:offline         # Build from the hydrated model data
npm run check                 # Format, lint, validate generated locks, and type-check
./test.sh                     # Run the isolated non-live test suite
./pi-test.sh                  # Run the TRPI CLI directly from source
```

To build a standalone executable:

```bash
npm --prefix packages/coding-agent run build:binary
```

The executable is written to `packages/coding-agent/dist/trpi`.

## Upstream and license

TRPI is a fork of Pi and preserves its MIT license and original author attribution. Upstream development lives at [earendil-works/pi](https://github.com/earendil-works/pi); Pi itself originates from [badlogic/pi-mono](https://github.com/badlogic/pi-mono).

Changes specific to this distribution should be reported to [Lore-Hex/trpi](https://github.com/Lore-Hex/trpi/issues). Upstream Pi issues should continue to go to the upstream project.

MIT
