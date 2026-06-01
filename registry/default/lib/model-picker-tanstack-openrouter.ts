import { openRouterText } from "@tanstack/ai-openrouter";
import {
  type ModelPickerModelConfig,
  type ModelPickerResolvedSelection,
  createModelPickerModel,
} from "@/lib/model-picker-core";

export type ModelPickerOpenRouterTextModelId = Parameters<
  typeof openRouterText
>[0];

export type ModelPickerOpenRouterModel<
  TModelId extends string = string,
  TOpenRouterModelId extends ModelPickerOpenRouterTextModelId =
    ModelPickerOpenRouterTextModelId,
> = Omit<ModelPickerModelConfig<TModelId>, "integrations"> & {
  integrations: {
    openRouter: {
      modelId: TOpenRouterModelId;
      packageName: "@tanstack/ai-openrouter";
    };
  };
};

export type ModelPickerOpenRouterModelInput<
  TModelId extends string,
  TOpenRouterModelId extends ModelPickerOpenRouterTextModelId,
> = Omit<ModelPickerModelConfig<TModelId>, "id" | "integrations" | "label"> & {
  id: TModelId;
  label: string;
  openRouterModelId: TOpenRouterModelId;
};

export function createModelPickerOpenRouterModel<
  const TModelId extends string,
  const TOpenRouterModelId extends ModelPickerOpenRouterTextModelId,
>(
  config: ModelPickerOpenRouterModelInput<TModelId, TOpenRouterModelId>,
): ModelPickerOpenRouterModel<TModelId, TOpenRouterModelId> {
  const model = createModelPickerModel({
    ...config,
    integrations: {
      openRouter: {
        modelId: config.openRouterModelId,
        packageName: "@tanstack/ai-openrouter",
      },
    },
  });

  return {
    ...model,
    integrations: {
      openRouter: {
        modelId: config.openRouterModelId,
        packageName: "@tanstack/ai-openrouter",
      },
    },
  };
}

export function createModelPickerOpenRouterTextAdapter<
  const TModel extends ModelPickerOpenRouterModel,
>(
  selection: ModelPickerResolvedSelection<TModel>,
  config?: Parameters<typeof openRouterText>[1],
) {
  return openRouterText(
    selection.model.integrations.openRouter.modelId,
    config,
  );
}
