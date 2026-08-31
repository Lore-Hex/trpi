# TR Confidential Cowork documentation

TR Confidential Cowork is a TrustedRouter-first distribution of the Pi terminal coding harness. It keeps Pi's extension system, tools, sessions, and terminal UI while using the `tr-cowork` command and separate `~/.tr-confidential-cowork/agent` / `.tr-confidential-cowork` configuration.

## Quick start

TR Confidential Cowork is distributed through GitHub rather than npm. Tagged builds appear on [Lore-Hex/trpi Releases](https://github.com/Lore-Hex/trpi/releases) with a `SHA256SUMS` file. Until the first tagged build is available, run from source:

```bash
git clone https://github.com/Lore-Hex/trpi.git
cd tr-cowork
npm ci --ignore-scripts
npm run hydrate:model-data
npm run build:offline
export TRUSTEDROUTER_API_KEY="your-api-key"
node packages/coding-agent/dist/cli.js
```

Once a release binary is on your `PATH`, launch it in a project with:

```bash
export TRUSTEDROUTER_API_KEY="your-api-key"
tr-cowork
```

Use `/model` or Ctrl+L to select among TrustedRouter models. See [Quickstart](quickstart.md) for the full first-run flow.

## Start here

- [Quickstart](quickstart.md) - install, authenticate, and run a first session.
- [Using TR Confidential Cowork](usage.md) - interactive mode, slash commands, context files, and CLI reference.
- [Providers](providers.md) - TrustedRouter and fallback-provider setup.
- [llama.cpp](llama-cpp.md) - run a local router and manage models with `/llama`.
- [Security](security.md) - project trust, sandbox boundaries, and vulnerability reporting.
- [Containerization](containerization.md) - sandbox TR Confidential Cowork with Gondolin, Docker, or OpenShell.
- [Settings](settings.md) - global and project settings.
- [Keybindings](keybindings.md) - default shortcuts and custom keybindings.
- [Sessions](sessions.md) - session management, branching, and tree navigation.
- [Compaction](compaction.md) - context compaction and branch summarization.

## Customization

- [Extensions](extensions.md) - TypeScript modules for tools, commands, events, and custom UI.
- [Skills](skills.md) - Agent Skills for reusable on-demand capabilities.
- [Prompt templates](prompt-templates.md) - reusable prompts that expand from slash commands.
- [Themes](themes.md) - built-in and custom terminal themes.
- [TR Confidential Cowork packages](packages.md) - bundle and share extensions, skills, prompts, and themes.
- [Custom models](models.md) - add model entries for supported provider APIs.
- [Custom providers](custom-provider.md) - implement custom APIs and OAuth flows.

## Programmatic usage

- [SDK](sdk.md) - embed the source-workspace TR Confidential Cowork package in Node.js applications.
- [RPC mode](rpc.md) - integrate over stdin/stdout JSONL.
- [JSON event stream mode](json.md) - print mode with structured events.
- [TUI components](tui.md) - build custom terminal UI for extensions.

## Reference

- [Environment variables](environment-variables.md) - process configuration and session metadata available to bash tools.
- [Session format](session-format.md) - JSONL session file format, entry types, and SessionManager API.

## Platform setup

- [Windows](windows.md)
- [Termux on Android](termux.md)
- [tmux](tmux.md)
- [Terminal setup](terminal-setup.md)
- [Shell aliases](shell-aliases.md)

## Development

- [Development](development.md) - local setup, project structure, and debugging.

TR Confidential Cowork preserves upstream Pi's MIT license and reusable `@earendil-works/pi-*` extension APIs. Report fork-specific issues at [Lore-Hex/trpi](https://github.com/Lore-Hex/trpi/issues).
