import { afterEach, describe, expect, it, vi } from "vitest";
import type { AuthContext } from "../src/auth/types.ts";
import { findEnvKeys, getEnvApiKey } from "../src/env-api-keys.ts";
import { createModels } from "../src/models.ts";
import {
	TRUSTEDROUTER_BASE_URL,
	TRUSTEDROUTER_CODING_MODEL_ID,
	TRUSTEDROUTER_MODELS_URL,
	trustedrouterProvider,
} from "../src/providers/trustedrouter.ts";
import type { FetchFunction } from "../src/types.ts";

const authContext = (env: Record<string, string>): AuthContext => ({
	env: async (name) => env[name],
	fileExists: async () => false,
});

function catalogEntry(id: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		id,
		name: id === "trustedrouter/auto" ? "TrustedRouter Auto (live)" : "Example Vision Model",
		context_length: 131_072,
		architecture: { input_modalities: ["text", "image"], output_modalities: ["text"] },
		pricing: {
			prompt: "0.000002",
			completion: "0.000006",
			input_cache_read: "0.0000002",
			input_cache_write: "0.0000025",
		},
		top_provider: { max_completion_tokens: 32_768 },
		supported_parameters: ["reasoning"],
		trustedrouter: {
			supports_chat: true,
			internal_only: false,
			route_kind: id.startsWith("trustedrouter/") ? "pool" : "model",
			endpoints: id.startsWith("trustedrouter/") ? [] : [{ provider: "example" }],
		},
		...overrides,
	};
}

function streamResponse(): Response {
	const chunks = [
		{
			id: "chatcmpl-test",
			object: "chat.completion.chunk",
			created: 0,
			model: "example/vision-model",
			choices: [{ index: 0, delta: { role: "assistant", content: "ok" }, finish_reason: null }],
		},
		{
			id: "chatcmpl-test",
			object: "chat.completion.chunk",
			created: 0,
			model: "example/vision-model",
			choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
			usage: { prompt_tokens: 1, completion_tokens: 1 },
		},
	];
	return new Response(`${chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join("")}data: [DONE]\n\n`, {
		status: 200,
		headers: { "content-type": "text/event-stream" },
	});
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("TrustedRouter provider", () => {
	it("constructs with safe offline coding and auto models", () => {
		const provider = trustedrouterProvider();
		expect(provider.id).toBe("trustedrouter");
		expect(provider.baseUrl).toBe(TRUSTEDROUTER_BASE_URL);
		expect(provider.getModels().map((model) => model.id)).toEqual([
			TRUSTEDROUTER_CODING_MODEL_ID,
			"trustedrouter/auto",
		]);
		expect(provider.getModels()[1]?.input).toEqual(["text"]);
		expect(provider.getModels()[0]?.compat).toMatchObject({
			supportsStore: false,
			supportsDeveloperRole: false,
			supportsReasoningEffort: false,
			supportsFinishReason: true,
			maxTokensField: "max_tokens",
			supportsStrictMode: false,
			supportsOpenAIGrammarTools: false,
			sendSessionAffinityHeaders: false,
			supportsLongCacheRetention: false,
		});
		expect(provider.getModels().every((model) => model.samplingParams?.provider)).toBe(true);
		expect(provider.getModels()[0]?.samplingParams).toEqual({
			provider: { data_collection: "deny", min_privacy: "confidential" },
		});
	});

	it("discovers only TrustedRouter credentials in documented precedence order", async () => {
		const env = {
			TRUSTEDROUTER_API_KEY: "canonical",
			TR_API_KEY: "short",
			TRUSTED_ROUTER_API_KEY: "legacy",
			OPENAI_API_KEY: "must-not-leak",
		};
		expect(findEnvKeys("trustedrouter", env)).toEqual([
			"TRUSTEDROUTER_API_KEY",
			"TR_API_KEY",
			"TRUSTED_ROUTER_API_KEY",
		]);
		expect(getEnvApiKey("trustedrouter", env)).toBe("canonical");

		const provider = trustedrouterProvider();
		expect(
			await provider.auth.apiKey?.resolve({
				ctx: authContext({ OPENAI_API_KEY: "must-not-leak" }),
				signal: new AbortController().signal,
			}),
		).toBeUndefined();
	});

	it("refreshes selectable chat models from the public catalog", async () => {
		const catalogFetch = vi.fn<FetchFunction>(
			async () =>
				new Response(
					JSON.stringify({
						data: [
							catalogEntry("trustedrouter/auto"),
							catalogEntry("example/vision-model"),
							catalogEntry("example/embeddings", {
								trustedrouter: { supports_chat: false, route_kind: "model", endpoints: [{}] },
							}),
							catalogEntry("example/unroutable", {
								trustedrouter: { supports_chat: true, route_kind: "model", endpoints: [] },
							}),
							catalogEntry("example/hidden", {
								trustedrouter: { supports_chat: true, configuration_hidden: true, endpoints: [{}] },
							}),
							catalogEntry("example/video", {
								architecture: { input_modalities: ["text"], output_modalities: ["video"] },
							}),
						],
					}),
					{ status: 200, headers: { "content-type": "application/json" } },
				),
		);
		vi.stubGlobal("fetch", catalogFetch);

		const models = createModels({ authContext: authContext({ TR_API_KEY: "test-key" }) });
		models.setProvider(trustedrouterProvider());
		const result = await models.refresh({ providers: ["trustedrouter"] });

		expect(result.errors.size).toBe(0);
		expect(catalogFetch).toHaveBeenCalledOnce();
		const [input, init] = catalogFetch.mock.calls[0] ?? [];
		expect(String(input)).toBe(TRUSTEDROUTER_MODELS_URL);
		expect(new Headers(init?.headers).get("authorization")).toBeNull();
		expect(models.getModels("trustedrouter").map((model) => model.id)).toEqual([
			TRUSTEDROUTER_CODING_MODEL_ID,
			"trustedrouter/auto",
			"example/vision-model",
		]);

		const selected = models.getModel("trustedrouter", "example/vision-model");
		expect(selected).toMatchObject({
			api: "openai-completions",
			provider: "trustedrouter",
			baseUrl: TRUSTEDROUTER_BASE_URL,
			reasoning: false,
			input: ["text", "image"],
			contextWindow: 131_072,
			maxTokens: 32_768,
			samplingParams: {
				provider: { data_collection: "deny", min_privacy: "confidential" },
			},
		});
		expect(selected?.cost.input).toBeCloseTo(2);
		expect(selected?.cost.output).toBeCloseTo(6);
		expect(selected?.cost.cacheRead).toBeCloseTo(0.2);
		expect(selected?.cost.cacheWrite).toBeCloseTo(2.5);
	});

	it.each([
		["malformed", {}],
		["zero-chat", { data: [catalogEntry("example/embeddings", { trustedrouter: { supports_chat: false } })] }],
		["missing-auto", { data: [catalogEntry("example/vision-model")] }],
	] as const)("fails closed for a %s catalog", async (_name, body) => {
		vi.stubGlobal(
			"fetch",
			vi.fn<FetchFunction>(
				async () =>
					new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } }),
			),
		);
		const models = createModels({ authContext: authContext({ TRUSTEDROUTER_API_KEY: "test-key" }) });
		models.setProvider(trustedrouterProvider());

		const result = await models.refresh({ providers: ["trustedrouter"] });
		expect(result.errors.get("trustedrouter")).toBeInstanceOf(Error);
		expect(models.getModels("trustedrouter").map((model) => model.id)).toEqual([
			TRUSTEDROUTER_CODING_MODEL_ID,
			"trustedrouter/auto",
		]);
	});

	it("sends selected models through the chat completions endpoint without unsupported fields", async () => {
		let payload: unknown;
		let wirePayload: unknown;
		const request = vi.fn<FetchFunction>(async (_input, init) => {
			wirePayload = JSON.parse(String(init?.body));
			return streamResponse();
		});
		const provider = trustedrouterProvider();
		const model = provider.getModels().find((entry) => entry.id === "trustedrouter/auto");
		if (!model) throw new Error("TrustedRouter auto model is missing");

		const response = await provider
			.streamSimple(
				model,
				{ messages: [{ role: "user", content: "hello", timestamp: 1 }] },
				{
					apiKey: "test-key",
					fetch: request,
					maxRetries: 0,
					maxTokens: 42,
					reasoning: "high",
					cacheRetention: "long",
					sessionId: "session-test",
					onPayload: (value) => {
						payload = value;
					},
				},
			)
			.result();

		expect(response.stopReason).toBe("stop");
		expect(response.content).toEqual([{ type: "text", text: "ok" }]);
		expect(request).toHaveBeenCalledOnce();
		const [input, init] = request.mock.calls[0] ?? [];
		expect(String(input)).toBe(`${TRUSTEDROUTER_BASE_URL}/chat/completions`);
		expect(new Headers(init?.headers).get("authorization")).toBe("Bearer test-key");
		expect(payload).toMatchObject({
			model: "trustedrouter/auto",
			max_tokens: 42,
			provider: {
				data_collection: "deny",
				min_privacy: "confidential",
			},
		});
		expect(wirePayload).not.toHaveProperty("reasoning");
		expect(wirePayload).not.toHaveProperty("store");
		expect(wirePayload).not.toHaveProperty("max_completion_tokens");
		expect(wirePayload).not.toHaveProperty("prompt_cache_key");
		expect(wirePayload).not.toHaveProperty("prompt_cache_retention");
	});
});
