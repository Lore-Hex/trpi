import { openAICompletionsApi } from "../api/openai-completions.lazy.ts";
import { envApiKeyAuth } from "../auth/helpers.ts";
import { createProvider, type Provider } from "../models.ts";
import type { Model, OpenAICompletionsCompat } from "../types.ts";

export const TRUSTEDROUTER_BASE_URL = "https://api.trustedrouter.com/v1";
export const TRUSTEDROUTER_MODELS_URL = "https://trustedrouter.com/v1/models";
export const TRUSTEDROUTER_CODING_MODEL_ID = "openai/gpt-5.4-mini";

const TRUSTEDROUTER_COMPAT = {
	supportsStore: false,
	supportsDeveloperRole: false,
	supportsReasoningEffort: false,
	supportsUsageInStreaming: true,
	supportsFinishReason: true,
	maxTokensField: "max_tokens",
	thinkingFormat: "openai",
	supportsStrictMode: false,
	supportsOpenAIGrammarTools: false,
	sendSessionAffinityHeaders: false,
	supportsLongCacheRetention: false,
} satisfies OpenAICompletionsCompat;

const CODING_MODEL: Model<"openai-completions"> = {
	id: TRUSTEDROUTER_CODING_MODEL_ID,
	name: "OpenAI: GPT-5.4 Mini",
	api: "openai-completions",
	provider: "trustedrouter",
	baseUrl: TRUSTEDROUTER_BASE_URL,
	reasoning: false,
	input: ["text", "image"],
	cost: { input: 0.79125, output: 4.7475, cacheRead: 0, cacheWrite: 0 },
	contextWindow: 400_000,
	maxTokens: 16_384,
	compat: TRUSTEDROUTER_COMPAT,
};

const AUTO_MODEL: Model<"openai-completions"> = {
	id: "trustedrouter/auto",
	name: "TrustedRouter Auto",
	api: "openai-completions",
	provider: "trustedrouter",
	baseUrl: TRUSTEDROUTER_BASE_URL,
	reasoning: false,
	input: ["text"],
	cost: { input: 0.07385, output: 0.1477, cacheRead: 0, cacheWrite: 0 },
	contextWindow: 200_000,
	maxTokens: 16_384,
	compat: TRUSTEDROUTER_COMPAT,
};

function asRecord(value: unknown): Record<string, unknown> | undefined {
	return typeof value === "object" && value !== null && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: undefined;
}

function asNonNegativeNumber(value: unknown): number | undefined {
	const parsed = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN;
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function asPositiveInteger(value: unknown): number | undefined {
	const parsed = asNonNegativeNumber(value);
	return parsed !== undefined && parsed > 0 ? Math.floor(parsed) : undefined;
}

function pricePerMillion(value: unknown): number {
	const perToken = asNonNegativeNumber(value) ?? 0;
	const perMillion = perToken * 1_000_000;
	return Number.isFinite(perMillion) ? perMillion : 0;
}

function stringValues(value: unknown): string[] {
	return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function modelInput(entry: Record<string, unknown>): Model<"openai-completions">["input"] {
	const modalities = stringValues(asRecord(entry.architecture)?.input_modalities);
	const input: Model<"openai-completions">["input"] = [];
	if (modalities.includes("text")) input.push("text");
	if (modalities.includes("image")) input.push("image");
	return input.length > 0 ? input : ["text"];
}

function isSelectableChatModel(entry: Record<string, unknown>): boolean {
	const routing = asRecord(entry.trustedrouter);
	const outputModalities = stringValues(asRecord(entry.architecture)?.output_modalities);
	if (
		!routing ||
		routing.supports_chat !== true ||
		routing.internal_only === true ||
		routing.configuration_hidden === true ||
		(outputModalities.length > 0 && !outputModalities.includes("text"))
	)
		return false;
	if (routing.route_kind === "model" && Array.isArray(routing.endpoints) && routing.endpoints.length === 0)
		return false;
	return true;
}

function catalogModel(value: unknown): Model<"openai-completions"> | undefined {
	const entry = asRecord(value);
	if (!entry || !isSelectableChatModel(entry) || typeof entry.id !== "string" || entry.id.length === 0)
		return undefined;

	const pricing = asRecord(entry.pricing);
	const topProvider = asRecord(entry.top_provider);
	const contextWindow =
		asPositiveInteger(entry.context_length) ?? asPositiveInteger(topProvider?.context_length) ?? 128_000;
	const maxTokens =
		asPositiveInteger(topProvider?.max_completion_tokens) ??
		asPositiveInteger(topProvider?.max_output_tokens) ??
		Math.min(contextWindow, 16_384);

	return {
		id: entry.id,
		name: typeof entry.name === "string" && entry.name.length > 0 ? entry.name : entry.id,
		api: "openai-completions",
		provider: "trustedrouter",
		baseUrl: TRUSTEDROUTER_BASE_URL,
		// TrustedRouter's catalog does not currently expose a reliable, normalized
		// reasoning-input contract across routes. Omitting reasoning controls avoids
		// upstream 400s while preserving tool calling for coding-agent requests.
		reasoning: false,
		input: modelInput(entry),
		cost: {
			input: pricePerMillion(pricing?.prompt),
			output: pricePerMillion(pricing?.completion),
			cacheRead: pricePerMillion(pricing?.input_cache_read),
			cacheWrite: pricePerMillion(pricing?.input_cache_write),
		},
		contextWindow,
		maxTokens,
		compat: TRUSTEDROUTER_COMPAT,
	};
}

function truncateHttpBody(body: string): string {
	const trimmed = body.trim();
	return trimmed.length > 512 ? `${trimmed.slice(0, 512)}…` : trimmed;
}

async function fetchTrustedRouterModels(signal: AbortSignal): Promise<Model<"openai-completions">[]> {
	const response = await fetch(TRUSTEDROUTER_MODELS_URL, {
		headers: { accept: "application/json" },
		signal,
	});
	if (!response.ok) {
		throw new Error(
			`Could not load TrustedRouter models: ${response.status}: ${truncateHttpBody(await response.text())}`,
		);
	}

	const catalog = asRecord(await response.json());
	if (!catalog || !Array.isArray(catalog.data)) throw new Error("Invalid TrustedRouter model catalog");
	const models = catalog.data.map(catalogModel).filter((model) => model !== undefined);
	if (models.length === 0) throw new Error("TrustedRouter model catalog contained no chat models");
	if (!models.some((model) => model.id === AUTO_MODEL.id)) {
		throw new Error(`TrustedRouter model catalog did not contain ${AUTO_MODEL.id}`);
	}
	return models;
}

/** TrustedRouter's OpenAI-compatible inference API with its dynamically refreshed public model catalog. */
export function trustedrouterProvider(): Provider<"openai-completions"> {
	return createProvider({
		id: "trustedrouter",
		name: "TrustedRouter",
		baseUrl: TRUSTEDROUTER_BASE_URL,
		auth: {
			apiKey: envApiKeyAuth("TrustedRouter API key", [
				"TRUSTEDROUTER_API_KEY",
				"TR_API_KEY",
				"TRUSTED_ROUTER_API_KEY",
			]),
		},
		models: [CODING_MODEL, AUTO_MODEL],
		fetchModels: ({ signal }) => fetchTrustedRouterModels(signal),
		api: openAICompletionsApi(),
	});
}
