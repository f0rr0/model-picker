"use client";

import { useState } from "react";
import { ModelPicker } from "@/components/ui/model-picker";
import {
  type ModelPickerControlValue,
  createModelPickerControlValue,
  createModelPickerModel,
  defineModelPickerModels,
} from "@/lib/model-picker-core";

const models = defineModelPickerModels([
  createModelPickerModel({
    id: "openai/gpt-5.4-mini",
    integrations: {
      aiSdk: {
        modelId: "openai/gpt-5.4-mini",
      },
    },
    label: "GPT-5.4 Mini",
    provider: "openai",
    providerLabel: "OpenAI",
    shortLabel: "GPT-5.4 Mini",
  }),
  createModelPickerModel({
    defaultReasoningLevel: "high",
    id: "anthropic/claude-sonnet-4.6",
    integrations: {
      aiSdk: {
        modelId: "anthropic/claude-sonnet-4.6",
      },
    },
    label: "Claude Sonnet 4.6",
    provider: "anthropic",
    providerLabel: "Anthropic",
    reasoningLevels: ["low", "medium", "high", "xhigh"],
    shortLabel: "Sonnet 4.6",
  }),
  createModelPickerModel({
    defaultReasoningLevel: "high",
    id: "google/gemini-3.1-pro",
    integrations: {
      aiSdk: {
        modelId: "google/gemini-3.1-pro",
      },
    },
    label: "Gemini 3.1 Pro",
    provider: "google",
    providerLabel: "Google",
    reasoningLevels: ["low", "medium", "high"],
    shortLabel: "Gemini 3.1 Pro",
  }),
]);

export function ModelPickerDemo() {
  const [value, setValue] = useState<
    ModelPickerControlValue<(typeof models)[number]["id"]>
  >(() => createModelPickerControlValue(models[0]));

  return (
    <div className="flex w-full max-w-3xl items-center justify-end rounded-2xl border bg-background p-3">
      <ModelPicker models={models} onValueChange={setValue} value={value} />
    </div>
  );
}
