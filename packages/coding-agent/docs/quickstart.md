# Quickstart

This page gets you from installation to a useful first TRPI session.

## Install

TRPI's initial distribution is published from [Lore-Hex/trpi](https://github.com/Lore-Hex/trpi). Tagged standalone binaries will appear on [GitHub Releases](https://github.com/Lore-Hex/trpi/releases). It is not published to npm yet, because the forked workspace libraries intentionally retain upstream package names for extension compatibility.

When using a tagged binary, verify it against the release's `SHA256SUMS`, extract it, and put the `trpi` executable on your `PATH`.

To run from a source checkout, use Node.js 22.19 or newer:

```bash
git clone https://github.com/Lore-Hex/trpi.git
cd trpi
npm ci --ignore-scripts
npm run hydrate:model-data
npm run build:offline
npm link --workspace trpi-coding-agent --ignore-scripts
```

This links the source-built `trpi` command into your npm global binary directory, so the commands below work directly from any project checkout.

Removing the binary or source checkout does not remove settings, credentials, or sessions stored in `~/.trpi/agent/`.

## Authenticate TrustedRouter

Set the primary credential before starting TRPI:

```bash
export TRUSTEDROUTER_API_KEY="your-api-key"
trpi
```

`TR_API_KEY` is also accepted as a short alias. You can instead use `/login` and choose TrustedRouter to store an API key in `~/.trpi/agent/auth.json`.

TRPI defaults to `trustedrouter/openai/gpt-5.4-mini`, an explicit route verified with coding tool calls. Use `/model` or Ctrl+L to search the live TrustedRouter catalog. `trustedrouter/auto` remains selectable for chat, but it is not coding-safe until automatic routing filters tool-bearing requests to tool-capable models.

Other Pi providers remain available as fallbacks through subscription login or their normal API-key environment variables. See [Providers](providers.md).

## First session

Start in the project directory you want TRPI to work on, type a request, and press Enter:

```bash
cd /path/to/project
trpi
```

```text
Summarize this repository and tell me how to run its checks.
```

By default, TRPI gives the model four tools:

- `read` - read files
- `write` - create or overwrite files
- `edit` - patch files
- `bash` - run shell commands

Additional built-in read-only tools (`grep`, `find`, and `ls`) are available through tool options. TRPI runs with your user account's permissions and can modify files. Use Git or another checkpointing workflow when you want easy rollback.

## Give TRPI project instructions

Add an `AGENTS.md` file to tell TRPI how to work in a project:

```markdown
# Project Instructions

- Run `npm run check` after code changes.
- Do not run production migrations locally.
- Keep responses concise.
```

TRPI loads:

- `~/.trpi/agent/AGENTS.md` for global instructions
- `AGENTS.md` or `CLAUDE.md` from parent directories and the current directory

If a directory contains `AGENTS.override.md`, TRPI loads it instead of `AGENTS.md` or `CLAUDE.md` from that directory. Restart TRPI, or run `/reload`, after changing context files.

## Common things to try

### Reference files

Type `@` in the editor to fuzzy-search files, or pass files on the command line:

```bash
trpi @README.md "Summarize this"
trpi @src/app.ts @src/app.test.ts "Review these together"
```

Images or text can be pasted with Ctrl+V (Alt+V on Windows); images can also be dragged into supported terminals.

### Run shell commands

In interactive mode:

```text
!npm run lint
```

The command output is sent to the model. Use `!!command` to run a command without adding its output to model context.

### Switch models

Use `/model` or Ctrl+L to choose a model. Use Shift+Tab to cycle thinking level. Use Ctrl+P / Shift+Ctrl+P to cycle through scoped models.

You can also select or inspect models at startup:

```bash
trpi --list-models trustedrouter
trpi --provider trustedrouter --model openai/gpt-5.4-mini
```

### Continue later

Sessions are saved automatically:

```bash
trpi -c                  # Continue most recent session
trpi -r                  # Browse previous sessions
trpi --name "my task"    # Set session display name at startup
trpi --session <path|id> # Open a specific session
```

Inside TRPI, use `/resume`, `/new`, `/tree`, `/fork`, and `/clone` to manage sessions.

### Non-interactive mode

For one-shot prompts:

```bash
trpi -p "Summarize this codebase"
trpi -p @screenshot.png "What's in this image?"
```

Use `--mode json` for JSON event output or `--mode rpc` for process integration.

## Next steps

- [Using TRPI](usage.md) - interactive mode, slash commands, sessions, context files, and CLI reference.
- [Providers](providers.md) - authentication and model setup.
- [Settings](settings.md) - global and project configuration.
- [Keybindings](keybindings.md) - shortcuts and customization.
- [TRPI packages](packages.md) - install shared extensions, skills, prompts, and themes.

Platform notes: [Windows](windows.md), [Termux](termux.md), [tmux](tmux.md), [Terminal setup](terminal-setup.md), and [Shell aliases](shell-aliases.md).
