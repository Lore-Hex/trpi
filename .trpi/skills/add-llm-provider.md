---
name: add-llm-provider
description: Checklist for adding a new LLM provider to packages/ai. Covers provider descriptors, API implementations, catalog registration, tests, coding-agent wiring, and docs.
---

# Adding an LLM Provider

Use the existing provider with the closest protocol and catalog behavior as the template. Read that provider, its API implementation, and its tests in full before editing.

## 1. Provider identity and descriptor

- Add the provider ID to `KnownProvider` in `packages/ai/src/types.ts`.
- Create `packages/ai/src/providers/<provider>.ts` with `createProvider()`.
- Reuse a lazy API implementation such as `openAICompletionsApi()` when the wire protocol is compatible.
- Configure the provider base URL, authentication, models, and compatibility flags explicitly.
- Use `envApiKeyAuth()` for ordinary API-key authentication. Never embed a credential.
- For a live catalog, implement `fetchModels` with abort-signal support, strict response validation, and filtering that excludes unavailable or internal-only routes.

## 2. API implementation, only when needed

If the provider requires a new wire protocol rather than an existing API implementation:

- Add its API identifier to `Api` and its options mapping to `ApiOptionsMap` in `packages/ai/src/types.ts`.
- Add the implementation under `packages/ai/src/api/` and a matching lazy wrapper.
- Export public option types from `packages/ai/src/index.ts` and add a package subpath export when consumers need direct access.
- Normalize text, thinking, tool calls, usage, stop reasons, aborts, and provider errors to the shared event types.

## 3. Registration and models

- Import the provider factory in `packages/ai/src/providers/all.ts` and add it to `builtinProviders()`.
- Export the provider factory from `all.ts` only when external consumers need it.
- For generated static catalogs, update the relevant generator under `packages/ai/scripts/`, regenerate model data, and review the diff.
- For dynamic catalogs, keep a small valid bundled fallback so offline startup and first-run model selection remain usable.
- Add environment-key lookup aliases in `packages/ai/src/env-api-keys.ts` when required.

## 4. Tests

- Add focused descriptor/catalog/auth tests under `packages/ai/test/`.
- Add at least one representative provider/model pair to the shared streaming matrix when the provider has live-test credentials.
- Cover abort behavior, malformed catalog responses, hidden/unavailable models, tool calls, usage totals, and cross-provider handoff where applicable.
- Never commit or print a real API key; tests must use synthetic credentials.

## 5. Coding agent

- Add a default model in `packages/coding-agent/src/core/model-resolver.ts`.
- Ensure provider display/auth readiness is correct in the model runtime and login UI.
- Document environment variables in `packages/coding-agent/src/cli/args.ts`.
- Add setup and model-selection guidance to the active TRPI README/provider docs.
- Preserve inherited `@earendil-works/pi-*` public imports and `pi` extension callback names unless an API-breaking migration is explicitly intended.

## 6. Verification

- Run the focused provider and coding-agent regression tests.
- Run type checking and formatting for every touched file.
- Exercise offline fallback, live catalog refresh, explicit `--provider/--model`, and interactive model selection.
- Add changelog entries under `## [Unreleased]` for the affected packages.
