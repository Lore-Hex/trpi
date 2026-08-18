# Environment variables

TRPI uses environment variables in three ways:

- Variables such as `TRPI_OFFLINE` configure the TRPI process.
- TRPI sets process markers so child processes can identify it as the launching agent.
- Commands run by the LLM-callable bash tool receive `PI_*` variables describing the current session.

Provider API-key variables are documented separately in [Providers](providers.md#environment-variables-or-auth-file).

## Process markers

The CLI and RPC entry points set three process markers:

- `AI_AGENT=trpi` is a generic marker that identifies TRPI as the launching agent.
- `TRPI_CODING_AGENT=true` is the fork's primary process marker.
- `PI_CODING_AGENT=true` is retained so existing Pi-aware extensions and tools keep working.

Child processes inherit these markers. They are not session-specific and are not set automatically when TRPI is embedded through the SDK.

## Bash Tool Session Environment

Commands run by the bash tool receive the current TRPI session state through Pi-compatible variable names:

| Variable | Description |
|----------|-------------|
| `PI_SESSION_ID` | Current session ID |
| `PI_SESSION_FILE` | Absolute path to the current session JSONL file; unset for ephemeral sessions |
| `PI_PROVIDER` | Currently selected model provider |
| `PI_MODEL` | Currently selected model ID |
| `PI_REASONING_LEVEL` | Current effective reasoning level: `off`, `minimal`, `low`, `medium`, `high`, `xhigh`, or `max` |

The values are resolved when each command starts. Switching models or changing the reasoning level therefore affects the next bash command without restarting TRPI. `PI_PROVIDER` and `PI_MODEL` identify the selected TRPI catalog model, not a different upstream model that a router may choose internally.

When asked which model or provider is running, inspect these variables instead of inferring the answer from the system prompt:

```bash
printf '%s/%s\n' "$PI_PROVIDER" "$PI_MODEL"
printf 'reasoning=%s session=%s\n' "$PI_REASONING_LEVEL" "$PI_SESSION_ID"
```

The session file can be inspected directly when the session is persistent:

```bash
if [ -n "$PI_SESSION_FILE" ]; then
  tail -n 1 "$PI_SESSION_FILE"
fi
```

These variables are injected into the LLM-callable bash tool. They are not injected into user-entered `!` or `!!` commands.

### Custom Bash Tools

Bash tools created with `createBashTool()` expose the session environment by default when registered with TRPI. Injection happens before `spawnHook`, so a hook receives the variables in `ctx.env`:

```typescript
const bashTool = createBashTool(cwd, {
  spawnHook: (ctx) => ({
    ...ctx,
    env: { ...ctx.env, CI: "1" },
  }),
});
```

Disable session metadata independently of the spawn hook:

```typescript
const bashTool = createBashTool(cwd, {
  exposeSessionEnvironment: false,
  spawnHook: (ctx) => ctx,
});
```

When disabled, TRPI removes inherited values for these variables so nested agent processes do not expose stale parent-session metadata.

## TRPI process configuration

These variables are read by TRPI itself:

| Variable | Description |
|----------|-------------|
| `TRPI_CODING_AGENT_DIR` | Override the config directory; default is `~/.trpi/agent` |
| `TRPI_CODING_AGENT_SESSION_DIR` | Override session storage; overridden by `--session-dir` |
| `TRPI_PACKAGE_DIR` | Override the package directory, useful for Nix/Guix store paths |
| `TRPI_OFFLINE` | Disable startup network operations, including model catalog and version checks |
| `TRPI_SKIP_VERSION_CHECK` | Disable the Lore-Hex GitHub release version check |
| `TRPI_LATEST_VERSION_URL` | Override the GitHub release metadata endpoint used by version checks |
| `TRPI_MODEL_CATALOG_BASE_URL` | Opt into a compatible remote Pi model-catalog overlay; off by default |
| `TRPI_SHARE_VIEWER_URL` | Override the viewer base URL returned by `/share`; direct private gist URLs are the default |
| `PI_TELEMETRY` | Control optional provider attribution headers: `1`/`true`/`yes` or `0`/`false`/`no` |
| `PI_CACHE_RETENTION` | Set to `long` for extended provider prompt caching where supported |
| `PI_HARDWARE_CURSOR` | Set to `1` to show the hardware cursor; see [Terminal setup](terminal-setup.md) |
| `PI_TUI_ESC_TIMEOUT` | How long to wait after a lone ESC before treating it as Escape, in milliseconds; defaults to `100` over SSH and `10` otherwise. Increase if Alt-key input is misread as Escape |
| `VISUAL`, `EDITOR` | External editor fallback when `externalEditor` is unset |
| `HTTP_PROXY`, `HTTPS_PROXY` | Proxy outbound HTTP requests |

`PI_PACKAGE_DIR`, `PI_OFFLINE`, `PI_SKIP_VERSION_CHECK`, and `PI_SHARE_VIEWER_URL` remain accepted as legacy aliases. `PI_CODING_AGENT_DIR` and `PI_CODING_AGENT_SESSION_DIR` are not aliases; use the `TRPI_*` names so TRPI stays isolated from upstream Pi state.

Provider credentials such as `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, and cloud-provider configuration are listed in [Providers](providers.md#environment-variables-or-auth-file).
