export const MODEL_PICKER_REASONING_LEVELS = [
  {
    description: "Smallest supported thinking allowance.",
    id: "minimal",
    label: "Minimal",
  },
  {
    description: "Lower latency and token use.",
    id: "low",
    label: "Low",
  },
  {
    description: "Balanced depth for routine work.",
    id: "medium",
    label: "Medium",
  },
  {
    description: "More depth for complex tasks.",
    id: "high",
    label: "High",
  },
  {
    description: "Maximum supported reasoning effort.",
    id: "xhigh",
    label: "Max",
  },
] as const;

export type ModelPickerReasoningLevel =
  (typeof MODEL_PICKER_REASONING_LEVELS)[number]["id"];

export const MODEL_PICKER_SPEED_MODES = [
  {
    description: "Default provider routing.",
    id: "standard",
    label: "Standard",
  },
  {
    description: "Higher-speed provider tier when available.",
    id: "fast",
    label: "Fast",
  },
] as const;

export type ModelPickerSpeedMode =
  (typeof MODEL_PICKER_SPEED_MODES)[number]["id"];

export type ModelPickerModelIntegration = {
  modelId?: string;
  packageName?: string;
};

export type ModelPickerModelIntegrations = {
  aiSdk?: ModelPickerModelIntegration;
  openRouter?: ModelPickerModelIntegration;
} & Record<string, unknown>;

export type ModelPickerModelMetadata = {
  contextWindow?: number;
  inputTokenPrice?: string | number;
  maxOutputTokens?: number;
  outputTokenPrice?: string | number;
  source?: string;
} & Record<string, unknown>;

export type ModelPickerModelConfig<
  TModelId extends string = string,
  TIntegrations extends ModelPickerModelIntegrations =
    ModelPickerModelIntegrations,
> = {
  defaultReasoningLevel?: ModelPickerReasoningLevel;
  defaultSpeedMode?: ModelPickerSpeedMode;
  description?: string;
  fastMode?: {
    creditMultiplier?: number;
    description?: string;
    label?: string;
    speedMultiplier?: number;
  };
  id: TModelId;
  integrations?: TIntegrations;
  keywords?: readonly string[];
  label: string;
  metadata?: ModelPickerModelMetadata;
  provider?: string;
  providerLabel?: string;
  reasoningLevels?: readonly ModelPickerReasoningLevel[];
  shortLabel?: string;
  speedModes?: readonly ModelPickerSpeedMode[];
  suggested?: boolean;
};

export type ModelPickerModel<
  TModelId extends string = string,
  TIntegrations extends ModelPickerModelIntegrations =
    ModelPickerModelIntegrations,
> = ModelPickerModelConfig<TModelId, TIntegrations>;

export type ModelPickerModelInput<
  TModelId extends string = string,
  TIntegrations extends ModelPickerModelIntegrations =
    ModelPickerModelIntegrations,
> = Omit<ModelPickerModelConfig<TModelId, TIntegrations>, "id" | "label"> & {
  id: TModelId;
  label: string;
};

export type ModelPickerControlValue<TModelId extends string = string> = {
  modelId: TModelId;
  planMode: boolean;
  reasoningLevel: ModelPickerReasoningLevel;
  speedMode: ModelPickerSpeedMode;
};

export type ModelPickerControlValueInput<TModelId extends string = string> =
  | Partial<ModelPickerControlValue<TModelId>>
  | null
  | undefined;

export type ModelPickerResolvedSelection<
  TModel extends ModelPickerModelConfig = ModelPickerModelConfig,
> = {
  aiSdkModelId: string;
  model: TModel;
  openRouterModelId?: string;
  value: ModelPickerControlValue<TModel["id"]>;
};

export const MODEL_PICKER_STANDARD_SPEED_MODES = ["standard"] as const;
export const MODEL_PICKER_FAST_SPEED_MODES = ["standard", "fast"] as const;
export const MODEL_PICKER_STANDARD_REASONING_LEVELS = [
  "low",
  "medium",
  "high",
] as const;

export function defineModelPickerModels<
  const TModels extends readonly ModelPickerModelConfig[],
>(models: TModels) {
  return models;
}

export function createModelPickerModel<
  const TModelId extends string,
  const TIntegrations extends ModelPickerModelIntegrations =
    ModelPickerModelIntegrations,
>(
  config: ModelPickerModelInput<TModelId, TIntegrations>,
): ModelPickerModelConfig<TModelId, TIntegrations> {
  return {
    ...config,
    defaultReasoningLevel: getDefaultReasoningLevel(config),
    defaultSpeedMode: getDefaultSpeedMode(config),
    provider: config.provider ?? getProviderFromModelId(config.id),
    providerLabel:
      config.providerLabel ??
      getProviderLabel(config.provider ?? getProviderFromModelId(config.id)),
    reasoningLevels: getModelPickerModelReasoningLevels(config),
    speedModes: getModelPickerModelSpeedModes(config),
  };
}

export function createModelPickerControlValue<
  const TModel extends ModelPickerModelConfig,
>(
  model: TModel,
  options: {
    planMode?: boolean;
  } = {},
): ModelPickerControlValue<TModel["id"]> {
  return {
    modelId: model.id,
    planMode: options.planMode ?? false,
    reasoningLevel: getDefaultReasoningLevel(model),
    speedMode: getDefaultSpeedMode(model),
  };
}

export function getModelPickerModel<
  const TModels extends readonly ModelPickerModelConfig[],
>(models: TModels, modelId: string | undefined): TModels[number] | undefined {
  return models.find((model) => model.id === modelId);
}

export function getModelPickerModelReasoningLevels(
  model: Pick<ModelPickerModelConfig, "reasoningLevels">,
) {
  return model.reasoningLevels?.length
    ? model.reasoningLevels
    : MODEL_PICKER_STANDARD_REASONING_LEVELS;
}

export function getModelPickerModelSpeedModes(
  model: Pick<ModelPickerModelConfig, "speedModes">,
) {
  return model.speedModes?.length
    ? model.speedModes
    : MODEL_PICKER_STANDARD_SPEED_MODES;
}

export function getModelPickerReasoningLevel(
  reasoningLevel: ModelPickerReasoningLevel,
) {
  return (
    MODEL_PICKER_REASONING_LEVELS.find(
      (level) => level.id === reasoningLevel,
    ) ?? {
      description: "Balanced depth for routine work.",
      id: "medium",
      label: "Medium",
    }
  );
}

export function getModelPickerSpeedMode(speedMode: ModelPickerSpeedMode) {
  return (
    MODEL_PICKER_SPEED_MODES.find((mode) => mode.id === speedMode) ?? {
      description: "Default provider routing.",
      id: "standard",
      label: "Standard",
    }
  );
}

export function getModelPickerAISDKModelId(model: ModelPickerModelConfig) {
  return model.integrations?.aiSdk?.modelId ?? model.id;
}

export function getModelPickerOpenRouterModelId(model: ModelPickerModelConfig) {
  return model.integrations?.openRouter?.modelId;
}

export function getModelPickerSelectedModel<
  const TModels extends readonly ModelPickerModelConfig[],
>(value: ModelPickerControlValueInput<TModels[number]["id"]>, models: TModels) {
  const selectedModel = getModelPickerModel(models, value?.modelId);
  const fallbackModel = models[0];

  if (selectedModel) {
    return selectedModel;
  }

  if (fallbackModel) {
    return fallbackModel;
  }

  throw new Error("ModelPicker requires at least one model.");
}

export function resolveModelPickerSelection<
  const TModels extends readonly ModelPickerModelConfig[],
>(
  value: ModelPickerControlValueInput<TModels[number]["id"]>,
  models: TModels,
): ModelPickerResolvedSelection<TModels[number]> {
  const model = getModelPickerSelectedModel(value, models);
  const normalizedValue = normalizeModelPickerControlValue(model, value);

  return {
    aiSdkModelId: getModelPickerAISDKModelId(model),
    model,
    openRouterModelId: getModelPickerOpenRouterModelId(model),
    value: normalizedValue,
  };
}

export function normalizeModelPickerControlValue<
  const TModel extends ModelPickerModelConfig,
>(
  model: TModel,
  value: ModelPickerControlValueInput<TModel["id"]>,
): ModelPickerControlValue<TModel["id"]> {
  const reasoningLevels = getModelPickerModelReasoningLevels(model);
  const speedModes = getModelPickerModelSpeedModes(model);
  const requestedReasoningLevel = value?.reasoningLevel;
  const requestedSpeedMode = value?.speedMode;

  return {
    modelId: model.id,
    planMode: value?.planMode ?? false,
    reasoningLevel:
      requestedReasoningLevel &&
      includesValue(reasoningLevels, requestedReasoningLevel)
        ? requestedReasoningLevel
        : getDefaultReasoningLevel(model),
    speedMode:
      requestedSpeedMode && includesValue(speedModes, requestedSpeedMode)
        ? requestedSpeedMode
        : getDefaultSpeedMode(model),
  };
}

export function getModelPickerFastModeCreditMultiplier(
  model: ModelPickerModelConfig,
) {
  const multiplier = model.fastMode?.creditMultiplier;

  if (typeof multiplier !== "number" || !Number.isFinite(multiplier)) {
    return null;
  }

  return Number(multiplier.toFixed(2));
}

function getDefaultReasoningLevel(
  model: Pick<
    ModelPickerModelConfig,
    "defaultReasoningLevel" | "reasoningLevels"
  >,
) {
  const reasoningLevels = getModelPickerModelReasoningLevels(model);
  const defaultReasoningLevel = model.defaultReasoningLevel ?? "medium";

  return includesValue(reasoningLevels, defaultReasoningLevel)
    ? defaultReasoningLevel
    : (reasoningLevels[0] ?? "medium");
}

function getDefaultSpeedMode(
  model: Pick<ModelPickerModelConfig, "defaultSpeedMode" | "speedModes">,
): ModelPickerSpeedMode {
  const speedModes = getModelPickerModelSpeedModes(model);
  const defaultSpeedMode = model.defaultSpeedMode ?? "standard";
  const fallbackSpeedMode = speedModes[0] ?? "standard";

  return includesValue(speedModes, defaultSpeedMode)
    ? defaultSpeedMode
    : fallbackSpeedMode;
}

function getProviderFromModelId(modelId: string) {
  const provider = modelId.split("/")[0]?.trim();
  return provider || "custom";
}

function getProviderLabel(provider: string) {
  if (provider === "xai") {
    return "xAI";
  }

  return provider
    .split(/[-_\s]+/g)
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function includesValue<T extends string>(
  values: readonly T[],
  value: string,
): value is T {
  return values.some((candidate) => candidate === value);
}
