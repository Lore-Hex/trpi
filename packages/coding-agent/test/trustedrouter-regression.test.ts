import { InMemoryCredentialStore, type Model, type Provider, type RefreshModelsContext } from "@earendil-works/pi-ai";
import { afterEach, describe, expect, it, vi } from "vitest";
import { findInitialModel, resolveCliModel } from "../src/core/model-resolver.ts";
import { ModelRuntime } from "../src/core/model-runtime.ts";

const builtinCatalog = vi.hoisted((): { providers: Provider[] } => ({ providers: [] }));

vi.mock("@earendil-works/pi-ai/providers/all", () => ({
	builtinModels: () => ({
		getProvider: () => undefined,
		stream: () => {
			throw new Error("The compatibility model registry is not used by these tests");
		},
		streamSimple: () => {
			throw new Error("The compatibility model registry is not used by these tests");
		},
	}),
	builtinProviders: () => builtinCatalog.providers,
	getBuiltinModel: () => undefined,
	getBuiltinModelDataGeneratedAt: () => undefined,
	getBuiltinModels: () => [],
	getBuiltinProviders: () => [],
	radiusProvider: () => {
		throw new Error("Radius is not used by these tests");
	},
}));

const trustedRouterModels: Model<"openai-completions">[] = [
	{
		id: "trustedrouter/auto",
		name: "TrustedRouter Auto",
		api: "openai-completions",
		provider: "trustedrouter",
		baseUrl: "https://api.trustedrouter.com/v1",
		reasoning: false,
		input: ["text"],
		cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
		contextWindow: 200_000,
		maxTokens: 16_384,
	},
	{
		id: "openai/gpt-5.4-mini",
		name: "GPT-5.4 Mini via TrustedRouter",
		api: "openai-completions",
		provider: "trustedrouter",
		baseUrl: "https://api.trustedrouter.com/v1",
		reasoning: true,
		input: ["text", "image"],
		cost: { input: 1, output: 4, cacheRead: 0, cacheWrite: 0 },
		contextWindow: 400_000,
		maxTokens: 32_768,
	},
];

const anthropicDefault: Model<"openai-completions"> = {
	id: "claude-opus-4-8",
	name: "Claude Opus 4.8",
	api: "openai-completions",
	provider: "anthropic",
	baseUrl: "https://api.anthropic.com/v1",
	reasoning: true,
	input: ["text", "image"],
	cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 },
	contextWindow: 200_000,
	maxTokens: 32_000,
};

function testProvider(
	id: string,
	models: Model<"openai-completions">[],
	refreshModels?: (context: RefreshModelsContext) => Promise<void>,
): Provider<"openai-completions"> {
	return {
		id,
		name: id,
		auth: {
			apiKey: {
				name: `${id} API key`,
				resolve: async ({ credential }) =>
					credential?.type === "api_key"
						? { auth: { apiKey: credential.key }, source: "stored credential" }
						: undefined,
			},
		},
		getModels: () => models,
		refreshModels,
		stream: () => {
			throw new Error("Streaming is not used by these tests");
		},
		streamSimple: () => {
			throw new Error("Streaming is not used by these tests");
		},
	};
}

async function authenticatedRuntime(providers: Provider[]): Promise<ModelRuntime> {
	builtinCatalog.providers = providers;
	const credentials = new InMemoryCredentialStore();
	for (const provider of providers) {
		await credentials.modify(provider.id, async () => ({ type: "api_key", key: `${provider.id}-test-key` }));
	}
	return ModelRuntime.create({ credentials, modelsPath: null, allowModelNetwork: false });
}

afterEach(() => {
	builtinCatalog.providers = [];
	vi.restoreAllMocks();
	vi.unstubAllEnvs();
});

describe("TrustedRouter model selection", () => {
	it("selects the tool-capable TrustedRouter coding model before another authenticated provider default", async () => {
		const runtime = await authenticatedRuntime([
			testProvider("anthropic", [anthropicDefault]),
			testProvider("trustedrouter", trustedRouterModels),
		]);

		expect(runtime.getAvailableSnapshot().map((model) => model.provider)).toEqual([
			"anthropic",
			"trustedrouter",
			"trustedrouter",
		]);

		const result = await findInitialModel({
			scopedModels: [],
			isContinuing: false,
			modelRuntime: runtime,
		});

		expect(result.model).toMatchObject({
			provider: "trustedrouter",
			id: "openai/gpt-5.4-mini",
		});
	});

	it.each([
		{
			name: "an exact routed model ID with an explicit provider",
			cliProvider: "trustedrouter",
			cliModel: "openai/gpt-5.4-mini",
			expectedId: "openai/gpt-5.4-mini",
		},
		{
			name: "a full provider and routed model ID",
			cliProvider: undefined,
			cliModel: "trustedrouter/openai/gpt-5.4-mini",
			expectedId: "openai/gpt-5.4-mini",
		},
		{
			name: "the TrustedRouter Auto shorthand",
			cliProvider: undefined,
			cliModel: "trustedrouter/auto",
			expectedId: "trustedrouter/auto",
		},
	])("resolves $name", async ({ cliProvider, cliModel, expectedId }) => {
		const runtime = await authenticatedRuntime([testProvider("trustedrouter", trustedRouterModels)]);

		const result = resolveCliModel({ cliProvider, cliModel, modelRuntime: runtime });

		expect(result.error).toBeUndefined();
		expect(result.model).toMatchObject({ provider: "trustedrouter", id: expectedId });
	});
});

describe("TrustedRouter model runtime", () => {
	it("keeps the native dynamic provider instead of replacing it with a pi.dev catalog wrapper", async () => {
		const refreshModels = vi.fn(async (_context: RefreshModelsContext) => {});
		const nativeProvider = testProvider("trustedrouter", trustedRouterModels, refreshModels);
		builtinCatalog.providers = [nativeProvider];

		const runtime = await ModelRuntime.create({
			credentials: new InMemoryCredentialStore(),
			modelsPath: null,
			refreshOnCreate: false,
		});

		expect(runtime.getProvider("trustedrouter")).toBe(nativeProvider);
		expect(runtime.getProvider("trustedrouter")?.refreshModels).toBe(refreshModels);
	});

	it("treats TR_COWORK_OFFLINE as cache-only for SDK catalog refreshes", async () => {
		const refreshModels = vi.fn(async (_context: RefreshModelsContext) => {});
		builtinCatalog.providers = [testProvider("trustedrouter", trustedRouterModels, refreshModels)];
		vi.stubEnv("TR_COWORK_OFFLINE", "1");
		vi.stubEnv("PI_OFFLINE", undefined);

		const credentials = new InMemoryCredentialStore();
		await credentials.modify("trustedrouter", async () => ({ type: "api_key", key: "test-key" }));
		await ModelRuntime.create({
			credentials,
			modelsPath: null,
			allowModelNetwork: true,
		});

		expect(refreshModels).toHaveBeenCalled();
		expect(refreshModels.mock.calls.every(([context]) => context.allowNetwork === false)).toBe(true);
	});
});
