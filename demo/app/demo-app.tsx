"use client";

import { ArrowUpIcon } from "lucide-react";
import Image from "next/image";
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
    defaultReasoningLevel: "high",
    fastMode: {
      creditMultiplier: 1.4,
      speedMultiplier: 2,
    },
    id: "openai/gpt-5.5",
    integrations: {
      aiSdk: {
        modelId: "gpt-5.5",
      },
    },
    keywords: ["coding", "reasoning", "professional"],
    label: "GPT-5.5",
    provider: "openai",
    providerLabel: "OpenAI",
    reasoningLevels: ["low", "medium", "high", "xhigh"],
    shortLabel: "GPT-5.5",
    speedModes: ["standard", "fast"],
  }),
  createModelPickerModel({
    defaultReasoningLevel: "high",
    fastMode: {
      creditMultiplier: 1.5,
      speedMultiplier: 2,
    },
    id: "anthropic/claude-sonnet-4.6",
    integrations: {
      aiSdk: {
        modelId: "anthropic/claude-sonnet-4.6",
      },
      openRouter: {
        modelId: "anthropic/claude-sonnet-4.6",
      },
    },
    keywords: ["coding", "agent", "analysis"],
    label: "Claude Sonnet 4.6",
    provider: "anthropic",
    providerLabel: "Anthropic",
    reasoningLevels: ["low", "medium", "high", "xhigh"],
    shortLabel: "Sonnet 4.6",
    speedModes: ["standard", "fast"],
  }),
  createModelPickerModel({
    defaultReasoningLevel: "high",
    id: "anthropic/claude-opus-4.7",
    integrations: {
      aiSdk: {
        modelId: "anthropic/claude-opus-4.7",
      },
      openRouter: {
        modelId: "anthropic/claude-opus-4.7",
      },
    },
    keywords: ["coding", "agent", "frontier"],
    label: "Claude Opus 4.7",
    provider: "anthropic",
    providerLabel: "Anthropic",
    reasoningLevels: ["medium", "high", "xhigh"],
    shortLabel: "Opus 4.7",
  }),
  createModelPickerModel({
    fastMode: {
      creditMultiplier: 1.2,
      speedMultiplier: 2,
    },
    id: "openai/gpt-5.4-mini",
    integrations: {
      aiSdk: {
        modelId: "gpt-5.4-mini",
      },
    },
    keywords: ["mini", "fast", "coding"],
    label: "GPT-5.4 Mini",
    provider: "openai",
    providerLabel: "OpenAI",
    reasoningLevels: ["minimal", "low", "medium", "high"],
    shortLabel: "GPT-5.4 Mini",
    speedModes: ["standard", "fast"],
  }),
  createModelPickerModel({
    defaultReasoningLevel: "high",
    id: "google/gemini-3.1-pro",
    integrations: {
      aiSdk: {
        modelId: "gemini-3.1-pro",
      },
    },
    keywords: ["multimodal", "reasoning", "research"],
    label: "Gemini 3.1 Pro",
    provider: "google",
    providerLabel: "Google",
    reasoningLevels: ["low", "medium", "high"],
    shortLabel: "Gemini 3.1 Pro",
  }),
  createModelPickerModel({
    fastMode: {
      creditMultiplier: 1.15,
      speedMultiplier: 2,
    },
    id: "google/gemini-3-flash",
    integrations: {
      aiSdk: {
        modelId: "gemini-3-flash",
      },
    },
    keywords: ["fast", "multimodal", "general"],
    label: "Gemini 3 Flash",
    provider: "google",
    providerLabel: "Google",
    reasoningLevels: ["low", "medium"],
    shortLabel: "Gemini 3 Flash",
    speedModes: ["standard", "fast"],
  }),
]);

export function DemoApp() {
  const [value, setValue] = useState<
    ModelPickerControlValue<(typeof models)[number]["id"]>
  >(() => createModelPickerControlValue(models[0], { planMode: true }));

  return (
    <main className="demo-shell grid min-h-svh place-items-center overflow-hidden px-4 py-8 text-foreground">
      <Image
        alt=""
        aria-hidden="true"
        className="absolute inset-0 z-0 object-cover"
        fill
        priority
        sizes="100vw"
        src="/backgrounds/2-grain-gradient-background-by-freeject.jpg"
      />
      <section className="relative z-10 w-full max-w-xl">
        <div className="overflow-hidden rounded-xl border border-white/12 bg-card/78 text-card-foreground shadow-2xl shadow-black/35 backdrop-blur-2xl">
          <div className="min-h-24 p-4">
            <textarea
              aria-label="Message"
              className="min-h-20 w-full resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-muted-foreground/70"
              id="demo-message"
              name="message"
              placeholder="Plan a compact launch update..."
              spellCheck={false}
            />
          </div>

          <div className="flex min-w-0 items-center justify-end gap-2 border-t border-white/10 bg-muted/24 px-2.5 py-2">
            <ModelPicker
              models={models}
              onValueChange={setValue}
              value={value}
            />
            <button
              aria-label="Send message"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/80"
              type="button"
            >
              <ArrowUpIcon className="size-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
