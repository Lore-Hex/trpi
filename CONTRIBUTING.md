# Contributing to TR Confidential Cowork

TR Confidential Cowork is a TrustedRouter-first distribution of the Pi coding harness. Contributions should preserve Pi's small core, extension model, and compatibility while keeping TrustedRouter setup and model selection reliable.

## Before opening an issue

- Search existing issues.
- Use the bug or contribution template when it fits.
- Keep the report concise and include a minimal reproduction.
- For core bugs, retry with `tr-cowork -ne` to rule out loaded extensions.
- Never include API keys, auth files, session secrets, or private source code.

TrustedRouter integration reports should include the selected model ID, whether tools were enabled, the TR Confidential Cowork version, and the sanitized error response. Do not include the value of `TRUSTEDROUTER_API_KEY`.

## Before submitting a pull request

Explain the problem, the behavior change, and how you verified it. You are responsible for understanding all submitted code, including code produced with an AI assistant.

Run from the repository root:

```bash
npm ci --ignore-scripts
npm run hydrate:model-data
npm run check
./test.sh
```

For provider changes, add focused tests under `packages/ai/test`. For model resolution or CLI behavior, add focused tests under `packages/coding-agent/test`. Paid-provider tests must remain opt-in and must never log or persist credentials.

## Design guidelines

- Prefer an extension when a feature does not need to live in core.
- Preserve upstream MIT attribution.
- Keep TrustedRouter on the OpenAI Chat Completions transport unless the Responses integration becomes fully stateless-compatible.
- Do not treat `trustedrouter/auto` as coding-safe until the router guarantees tool-capable routes for tool-bearing requests.
- Do not add npm publishing until every modified workspace dependency is published under a package name controlled by this project.

See `AGENTS.md` for repository-specific development, test, and release rules.
