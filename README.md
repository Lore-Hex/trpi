# TR Confidential Cowork

TR Confidential Cowork is a TrustedRouter-first distribution of the [Pi Agent Harness](https://github.com/earendil-works/pi). It keeps Pi's terminal workflow, tools, sessions, extensions, and mid-session model switching while making `trustedrouter` the primary provider.

The command is `tr-cowork`, user state lives under `~/.tr-confidential-cowork/agent`, and the CLI workspace package is named `tr-confidential-cowork`. The public repository is [Lore-Hex/trpi](https://github.com/Lore-Hex/trpi).

## Tagged binaries

Tagged builds are published through [GitHub Releases](https://github.com/Lore-Hex/trpi/releases). Verify an archive against the release's `SHA256SUMS` before extracting it. Until the first tagged build is available, use the source installation below.

## Quick start from source

Requires Node.js 22.19 or newer.

```bash
npm ci --ignore-scripts
npm run hydrate:model-data
npm run build:offline
npm link --workspace tr-confidential-cowork --ignore-scripts
export TRUSTEDROUTER_API_KEY="your-api-key"
tr-cowork
```

Use `/model` or Ctrl+L to open the model selector. You can also select a model at startup or inspect the available catalog:

```bash
tr-cowork --list-models
tr-cowork --provider trustedrouter --model <model-id>
```

TrustedRouter uses `TRUSTEDROUTER_API_KEY`; `TR_API_KEY` is also accepted as a short compatibility alias. Its inference API is `https://api.trustedrouter.com/v1` and its public model catalog is `https://trustedrouter.com/v1/models`.

The default TrustedRouter coding model is `trustedrouter/confidential`. TrustedRouter requests require confidential provider routing, deny data collection, and require support for the requested parameters. Named models use the same routing constraints rather than falling back to a non-confidential provider. Reasoning controls are omitted because some routed upstreams reject them.

## Configuration

| Location | Purpose |
|---|---|
| `~/.tr-confidential-cowork/agent/settings.json` | Global settings |
| `~/.tr-confidential-cowork/agent/models.json` | Custom providers and models |
| `~/.tr-confidential-cowork/agent/sessions/` | Saved sessions |
| `.tr-confidential-cowork/settings.json` | Project-local settings |

TR Confidential Cowork retains Pi's four execution modes: interactive, print/JSON, RPC, and the embeddable SDK. See the [coding-agent documentation](packages/coding-agent/README.md) for the full CLI and extension reference.

## Packages

| Package | Description |
|---|---|
| [`tr-confidential-cowork`](packages/coding-agent) | TrustedRouter-first interactive coding agent CLI |
| [`@earendil-works/pi-agent-core`](packages/agent) | Upstream agent runtime with tool calling and state management |
| [`@earendil-works/pi-ai`](packages/ai) | Upstream multi-provider LLM API |
| [`@earendil-works/pi-tui`](packages/tui) | Upstream terminal UI library |
| [`@earendil-works/pi-telemetry`](packages/telemetry) | Vendor-neutral telemetry contracts and schemas |

The upstream package scopes remain in place where they are part of the reusable Pi libraries and extension API. This keeps existing extensions source-compatible while the standalone CLI has its own identity and configuration directory.

## Security

TR Confidential Cowork runs with the permissions of the user and process that launched it. It does not add a built-in filesystem, process, network, or credential sandbox. For stronger boundaries, use a container or one of the patterns in [containerization.md](packages/coding-agent/docs/containerization.md).

## Development

```bash
npm ci --ignore-scripts       # Install the locked dependencies
npm run hydrate:model-data    # Fetch model metadata once after a Git clone
npm run build:offline         # Build from the hydrated model data
npm run check                 # Format, lint, validate generated locks, and type-check
./test.sh                     # Run the isolated non-live test suite
./pi-test.sh                  # Run the TR Confidential Cowork CLI directly from source
```

To build a standalone executable:

```bash
npm --prefix packages/coding-agent run build:binary
```

The archive includes release model data and native prebuilds. `--offline-model-data` uses that model data without refreshing provider catalogs. The script installs dependencies and builds the executable with its runtime assets; pass `--skip-install` if dependencies are already provided.

## Upstream and license

TR Confidential Cowork is a fork of Pi and preserves its MIT license and original author attribution. Upstream development lives at [earendil-works/pi](https://github.com/earendil-works/pi); Pi itself originates from [badlogic/pi-mono](https://github.com/badlogic/pi-mono).

Changes specific to this distribution should be reported to [Lore-Hex/trpi](https://github.com/Lore-Hex/trpi/issues). Upstream Pi issues should continue to go to the upstream project.

MIT
