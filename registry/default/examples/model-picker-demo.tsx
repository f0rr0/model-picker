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
    description: "General purpose model for everyday chat.",
    id: "openai/gpt-5.4-mini",
    integrations: {
      aiSdk: {
        modelId: "openai/gpt-5.4-mini",
      },
    },
    label: "GPT-5.4 Mini",
    provider: "openai",
    providerLabel: "OpenAI",
    shortLabel: "GPT Mini",
    suggested: true,
  }),
  createModelPickerModel({
    defaultReasoningLevel: "high",
    description: "Strong coding and agentic work.",
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
    shortLabel: "Sonnet",
    suggested: true,
  }),
  createModelPickerModel({
    description: "Your own routed model.",
    id: "acme/internal-agent",
    keywords: ["agent", "tool-use"],
    label: "Internal Agent",
    provider: "acme",
    providerLabel: "Acme",
    shortLabel: "Internal",
  }),
]);

export function ModelPickerDemo() {
  const [value, setValue] = useState<
    ModelPickerControlValue<(typeof models)[number]["id"]>
  >(() => createModelPickerControlValue(models[0]));

  return (
    <div className="flex w-full max-w-3xl items-center justify-end rounded-2xl border bg-background p-3">
      <ModelPicker
        enableModelSearch
        models={models}
        onValueChange={setValue}
        showSuggestedModels
        value={value}
      />
    </div>
  );
}
