import {
  type ModelPickerModelConfig,
  createModelPickerModel,
} from "@/lib/model-picker-core";

export type ModelPickerModelSourceFilter<TRawModel> = (
  model: TRawModel,
) => boolean;

export type ModelPickerModelSourceOptions<TRawModel> = {
  excludeModelIds?: readonly string[];
  fetcher?: typeof fetch;
  filter?: ModelPickerModelSourceFilter<TRawModel>;
  limit?: number;
  modelIds?: readonly string[];
  providers?: readonly string[];
  signal?: AbortSignal;
  suggestedModelIds?: readonly string[];
};

export type VercelAIGatewayModel = {
  context_window?: number;
  created?: number;
  description?: string;
  id: string;
  max_tokens?: number;
  name?: string;
  object?: string;
  owned_by?: string;
  pricing?: {
    input?: string;
    output?: string;
  };
  released?: number;
  tags?: readonly string[];
  type?: string;
};

export type OpenRouterModel = {
  architecture?: {
    input_modalities?: readonly string[];
    modality?: string;
    output_modalities?: readonly string[];
  };
  canonical_slug?: string;
  context_length?: number;
  created?: number;
  description?: string;
  id: string;
  name?: string;
  pricing?: {
    completion?: string;
    prompt?: string;
  };
  supported_parameters?: readonly string[];
};

type ModelListResponse<TModel> = {
  data: TModel[];
};

export async function fetchVercelAIGatewayModels(
  options: ModelPickerModelSourceOptions<VercelAIGatewayModel> = {},
) {
  const payload = await fetchModelList<VercelAIGatewayModel>(
    "https://ai-gateway.vercel.sh/v1/models",
    options,
  );

  return selectSourceModels(payload.data, options).map((model) =>
    createModelPickerModel({
      description: model.description,
      id: model.id,
      integrations: {
        aiSdk: {
          modelId: model.id,
        },
      },
      keywords: [model.type, ...(model.tags ?? [])].filter(isPresent),
      label: model.name ?? prettifyModelId(model.id),
      metadata: {
        contextWindow: model.context_window,
        inputTokenPrice: model.pricing?.input,
        maxOutputTokens: model.max_tokens,
        outputTokenPrice: model.pricing?.output,
        source: "vercel-ai-gateway",
      },
      provider: model.owned_by ?? getProviderFromModelId(model.id),
      providerLabel: prettifyProvider(
        model.owned_by ?? getProviderFromModelId(model.id),
      ),
      suggested: options.suggestedModelIds?.includes(model.id),
    }),
  );
}

export async function fetchOpenRouterModels(
  options: ModelPickerModelSourceOptions<OpenRouterModel> & {
    outputModalities?: readonly string[];
    supportedParameters?: readonly string[];
  } = {},
) {
  const searchParams = new URLSearchParams();

  if (options.outputModalities?.length) {
    searchParams.set("output_modalities", options.outputModalities.join(","));
  }

  if (options.supportedParameters?.length) {
    searchParams.set(
      "supported_parameters",
      options.supportedParameters.join(","),
    );
  }

  const url = `https://openrouter.ai/api/v1/models${
    searchParams.size > 0 ? `?${searchParams}` : ""
  }`;
  const payload = await fetchModelList<OpenRouterModel>(url, options);

  return selectSourceModels(payload.data, options).map((model) =>
    createModelPickerModel({
      description: model.description,
      id: model.id,
      integrations: {
        openRouter: {
          modelId: model.id,
          packageName: "@tanstack/ai-openrouter",
        },
      },
      keywords: [
        model.architecture?.modality,
        ...(model.architecture?.input_modalities ?? []),
        ...(model.architecture?.output_modalities ?? []),
        ...(model.supported_parameters ?? []),
      ].filter(isPresent),
      label: model.name ?? prettifyModelId(model.id),
      metadata: {
        contextWindow: model.context_length,
        inputTokenPrice: model.pricing?.prompt,
        outputTokenPrice: model.pricing?.completion,
        source: "openrouter",
      },
      provider: getProviderFromModelId(model.id),
      providerLabel: prettifyProvider(getProviderFromModelId(model.id)),
      suggested: options.suggestedModelIds?.includes(model.id),
    }),
  );
}

export function filterModelPickerModels<
  const TModels extends readonly ModelPickerModelConfig[],
>(
  models: TModels,
  options: {
    excludeModelIds?: readonly string[];
    limit?: number;
    modelIds?: readonly TModels[number]["id"][];
    providers?: readonly string[];
  } = {},
) {
  return selectSourceModels(models, options);
}

async function fetchModelList<TModel>(
  url: string,
  options: Pick<ModelPickerModelSourceOptions<TModel>, "fetcher" | "signal">,
) {
  const response = await (options.fetcher ?? fetch)(url, {
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
    );
  }

  const payload: unknown = await response.json();

  if (!isModelListResponse<TModel>(payload)) {
    throw new Error(`Unexpected model list response from ${url}.`);
  }

  return payload;
}

function isModelListResponse<TModel>(
  value: unknown,
): value is ModelListResponse<TModel> {
  return isRecord(value) && Array.isArray(value.data);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function selectSourceModels<
  TRawModel extends { id: string; owned_by?: string; provider?: string },
>(
  models: readonly TRawModel[],
  options: ModelPickerModelSourceOptions<TRawModel>,
) {
  const modelIdSet = options.modelIds ? new Set(options.modelIds) : null;
  const excludedModelIdSet = new Set(options.excludeModelIds ?? []);
  const providerSet = options.providers ? new Set(options.providers) : null;

  const selectedModels = models.filter((model) => {
    if (modelIdSet && !modelIdSet.has(model.id)) {
      return false;
    }

    if (excludedModelIdSet.has(model.id)) {
      return false;
    }

    if (
      providerSet &&
      !providerSet.has(
        model.owned_by ?? model.provider ?? getProviderFromModelId(model.id),
      )
    ) {
      return false;
    }

    return options.filter ? options.filter(model) : true;
  });

  return typeof options.limit === "number"
    ? selectedModels.slice(0, options.limit)
    : selectedModels;
}

function getProviderFromModelId(modelId: string) {
  const provider = modelId.split("/")[0]?.trim();
  return provider || "custom";
}

function prettifyModelId(modelId: string) {
  const name = modelId.split("/").at(-1) ?? modelId;
  return name
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function prettifyProvider(provider: string) {
  if (provider === "xai" || provider === "x-ai") {
    return "xAI";
  }

  return provider
    .split(/[-_\s]+/g)
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function isPresent(value: string | undefined): value is string {
  return Boolean(value);
}
