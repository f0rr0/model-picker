# Model Picker

A shadcn-style source component for AI model selection. The default install gives you a non-animated model picker, optional suggested models, reasoning effort, plan mode, and fast mode without shipping a bundled model catalog or Motion dependency.

The core registry item installs:

- `@ui/model-picker.tsx` - the client component.
- `@lib/model-picker-core.ts` - typed model/value helpers.

It composes shadcn `dropdown-menu` and `tooltip` as registry dependencies, so the CLI installs the implementation that matches the consuming project: Base UI for Base UI shadcn apps, Radix for Radix shadcn apps.

## Install

Install the non-animated baseline:

```bash
npx shadcn@latest add https://raw.githubusercontent.com/f0rr0/model-picker/main/public/r/model-picker.json
```

```bash
pnpm dlx shadcn@latest add https://raw.githubusercontent.com/f0rr0/model-picker/main/public/r/model-picker.json
```

```bash
bunx --bun shadcn@latest add https://raw.githubusercontent.com/f0rr0/model-picker/main/public/r/model-picker.json
```

Or install the animated variant. It uses the same import path and API, but installs Motion-powered layout, slot, and label width animations:

```bash
npx shadcn@latest add https://raw.githubusercontent.com/f0rr0/model-picker/main/public/r/model-picker-animated.json
```

Install one of `model-picker` or `model-picker-animated`; both target `@ui/model-picker.tsx`.

## Usage

```tsx
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
    label: "GPT-5.4 Mini",
    provider: "openai",
    providerLabel: "OpenAI",
    integrations: {
      aiSdk: { modelId: "openai/gpt-5.4-mini" },
    },
  }),
  createModelPickerModel({
    id: "anthropic/claude-sonnet-4.6",
    label: "Claude Sonnet 4.6",
    provider: "anthropic",
    providerLabel: "Anthropic",
    reasoningLevels: ["low", "medium", "high", "xhigh"],
    integrations: {
      aiSdk: { modelId: "anthropic/claude-sonnet-4.6" },
    },
  }),
]);

export function ModelPickerExample() {
  const [value, setValue] = useState<
    ModelPickerControlValue<(typeof models)[number]["id"]>
  >(() => createModelPickerControlValue(models[0]));

  return <ModelPicker models={models} onValueChange={setValue} value={value} />;
}
```

`models` is required on purpose. Your app decides exactly which models appear in the picker, so users do not pay bundle cost for a catalog they do not use.

## Model Sources

For full live catalog coverage, install the optional source helpers:

```bash
npx shadcn@latest add https://raw.githubusercontent.com/f0rr0/model-picker/main/public/r/model-picker-sources.json
```

```ts
import { fetchVercelAIGatewayModels } from "@/lib/model-picker-sources";

export async function getPickerModels() {
  return fetchVercelAIGatewayModels({
    modelIds: ["openai/gpt-5.4-mini", "anthropic/claude-sonnet-4.6"],
  });
}
```

The helper also supports `fetchOpenRouterModels({ providers, modelIds, filter, limit })`. Use an allowlist or filter before passing models to the picker if you expose a large gateway.

## Vercel AI SDK

```ts
import { streamText } from "ai";
import { resolveModelPickerSelection } from "@/lib/model-picker-core";

export async function POST(request: Request) {
  const { messages, modelPicker } = await request.json();
  const selection = resolveModelPickerSelection(modelPicker, models);

  return streamText({
    messages,
    model: selection.aiSdkModelId,
  }).toUIMessageStreamResponse();
}
```

## TanStack AI

Install the optional OpenRouter helper only if your app uses TanStack AI with OpenRouter:

```bash
npx shadcn@latest add https://raw.githubusercontent.com/f0rr0/model-picker/main/public/r/model-picker-tanstack-openrouter.json
```

```ts
import { chat, toServerSentEventsResponse } from "@tanstack/ai";
import {
  createModelPickerOpenRouterModel,
  createModelPickerOpenRouterTextAdapter,
} from "@/lib/model-picker-tanstack-openrouter";
import {
  defineModelPickerModels,
  resolveModelPickerSelection,
} from "@/lib/model-picker-core";

const models = defineModelPickerModels([
  createModelPickerOpenRouterModel({
    id: "openai/gpt-5.4-mini",
    label: "GPT-5.4 Mini",
    openRouterModelId: "openai/gpt-5.4-mini",
    provider: "openai",
  }),
]);

export async function POST(request: Request) {
  const { messages, modelPicker } = await request.json();
  const selection = resolveModelPickerSelection(modelPicker, models);

  const stream = chat({
    adapter: createModelPickerOpenRouterTextAdapter(selection),
    messages,
  });

  return toServerSentEventsResponse(stream);
}
```

The OpenRouter model ID is checked against the installed `@tanstack/ai-openrouter` adapter type, so app code does not need a cast.

## Development

```bash
bun install
bun run validate
bun run smoke:consumer
bun run models:verify
```

`bun run build:registry` writes installable shadcn JSON to `public/r`. The default `model-picker` item intentionally has no `motion`, `ai`, `@tanstack/ai`, or static catalog dependency; `model-picker-animated` adds Motion only when devs choose the animated install.
