import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tempRoot = mkdtempSync(join(tmpdir(), "model-picker-"));
const appDir = join(tempRoot, "smoke");
const animatedAppDir = join(tempRoot, "smoke-animated");

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    env: process.env,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    throw new Error(`Command failed in ${cwd}: ${command} ${args.join(" ")}`);
  }
}

try {
  run("bun", ["run", "build:registry"], repoRoot);
  run(
    "bunx",
    [
      "--bun",
      "shadcn@latest",
      "init",
      "--name",
      "smoke",
      "--template",
      "vite",
      "--preset",
      "nova",
      "--yes",
    ],
    tempRoot,
  );
  run(
    "bunx",
    [
      "--bun",
      "shadcn@latest",
      "add",
      join(repoRoot, "public/r/model-picker.json"),
      "-y",
    ],
    appDir,
  );

  const packageJsonAfterCoreInstall = JSON.parse(
    readFileSync(join(appDir, "package.json"), "utf8"),
  );

  if (packageJsonAfterCoreInstall.dependencies?.motion) {
    throw new Error("Core registry item must not install motion.");
  }

  run(
    "bunx",
    [
      "--bun",
      "shadcn@latest",
      "add",
      join(repoRoot, "public/r/model-picker-sources.json"),
      "-y",
    ],
    appDir,
  );
  run(
    "bunx",
    [
      "--bun",
      "shadcn@latest",
      "add",
      join(repoRoot, "public/r/model-picker-tanstack-openrouter.json"),
      "-y",
    ],
    appDir,
  );
  run("bun", ["add", "ai", "@tanstack/ai"], appDir);

  const installedFiles = [
    "src/components/ui/model-picker.tsx",
    "src/lib/model-picker-core.ts",
    "src/lib/model-picker-sources.ts",
    "src/lib/model-picker-tanstack-openrouter.ts",
    "src/lib/utils.ts",
  ];

  for (const file of installedFiles) {
    if (!existsSync(join(appDir, file))) {
      throw new Error(`Expected installed file is missing: ${file}`);
    }
  }

  writeFileSync(
    join(appDir, "src/App.tsx"),
    `"use client";

import { useState } from "react";
import { ModelPicker } from "@/components/ui/model-picker";
import {
  type ModelPickerControlValue,
  createModelPickerControlValue,
  createModelPickerModel,
  defineModelPickerModels,
  resolveModelPickerSelection,
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
    shortLabel: "GPT Mini",
    suggested: true,
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
    shortLabel: "Sonnet",
    suggested: true,
  }),
  createModelPickerModel({
    id: "acme/internal-agent",
    keywords: ["agent", "tool-use"],
    label: "Internal Agent",
    provider: "acme",
    shortLabel: "Internal",
  }),
]);

export default function App() {
  const [value, setValue] = useState<
    ModelPickerControlValue<(typeof models)[number]["id"]>
  >(() => createModelPickerControlValue(models[0]));
  const selection = resolveModelPickerSelection(value, models);

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6 text-foreground">
      <section className="flex w-full max-w-2xl flex-col gap-4">
        <div className="flex items-center justify-end rounded-xl border bg-card p-3 text-card-foreground shadow-sm">
          <ModelPicker
            enableModelSearch
            models={models}
            onValueChange={setValue}
            showSuggestedModels
            value={value}
          />
        </div>
        <output className="rounded-md border bg-muted px-3 py-2 text-muted-foreground text-sm">
          {selection.aiSdkModelId}
        </output>
      </section>
    </main>
  );
}
`,
  );

  writeFileSync(
    join(appDir, "src/consumer-smoke.ts"),
    `import { streamText } from "ai";
import { chat, toServerSentEventsResponse } from "@tanstack/ai";
import {
  createModelPickerOpenRouterModel,
  createModelPickerOpenRouterTextAdapter,
} from "@/lib/model-picker-tanstack-openrouter";
import {
  type ModelPickerControlValue,
  createModelPickerControlValue,
  defineModelPickerModels,
  resolveModelPickerSelection,
} from "@/lib/model-picker-core";
import { filterModelPickerModels } from "@/lib/model-picker-sources";

const models = defineModelPickerModels([
  createModelPickerOpenRouterModel({
    id: "openai/gpt-5.4-mini",
    label: "GPT-5.4 Mini",
    openRouterModelId: "openai/gpt-5.4-mini",
    provider: "openai",
  }),
  createModelPickerOpenRouterModel({
    id: "anthropic/claude-sonnet-4.6",
    label: "Claude Sonnet 4.6",
    openRouterModelId: "anthropic/claude-sonnet-4.6",
    provider: "anthropic",
  }),
]);

const pickerModels = filterModelPickerModels(models, {
  modelIds: ["openai/gpt-5.4-mini"],
});

export const defaultModelPickerValue = createModelPickerControlValue(models[0]);

export function createVercelAISDKStream(
  modelPicker: ModelPickerControlValue<(typeof models)[number]["id"]>,
) {
  const selection = resolveModelPickerSelection(modelPicker, models);

  return streamText({
    messages: [{ content: "Hello", role: "user" }],
    model: selection.aiSdkModelId,
  });
}

export function createTanStackAIStream(
  modelPicker: ModelPickerControlValue<(typeof models)[number]["id"]>,
) {
  const selection = resolveModelPickerSelection(modelPicker, models);

  return chat({
    adapter: createModelPickerOpenRouterTextAdapter(selection),
    messages: [{ content: "Hello", role: "user" }],
  });
}

export function createTanStackAIResponse(
  modelPicker: ModelPickerControlValue<(typeof models)[number]["id"]>,
) {
  return toServerSentEventsResponse(createTanStackAIStream(modelPicker));
}

export { pickerModels };
`,
  );

  run("bun", ["run", "build"], appDir);
  run(
    "bunx",
    [
      "--bun",
      "shadcn@latest",
      "init",
      "--name",
      "smoke-animated",
      "--template",
      "vite",
      "--preset",
      "nova",
      "--yes",
    ],
    tempRoot,
  );
  run(
    "bunx",
    [
      "--bun",
      "shadcn@latest",
      "add",
      join(repoRoot, "public/r/model-picker-animated.json"),
      "-y",
    ],
    animatedAppDir,
  );

  const animatedPackageJson = JSON.parse(
    readFileSync(join(animatedAppDir, "package.json"), "utf8"),
  );

  if (!animatedPackageJson.dependencies?.motion) {
    throw new Error("Animated registry item must install motion.");
  }

  for (const file of [
    "src/components/ui/dropdown-menu.tsx",
    "src/components/ui/tooltip.tsx",
    "src/components/ui/model-picker.tsx",
    "src/lib/model-picker-core.ts",
    "src/lib/utils.ts",
  ]) {
    if (!existsSync(join(animatedAppDir, file))) {
      throw new Error(`Expected animated installed file is missing: ${file}`);
    }
  }

  writeFileSync(
    join(animatedAppDir, "src/App.tsx"),
    readFileSync(join(appDir, "src/App.tsx"), "utf8"),
  );

  run("bun", ["run", "build"], animatedAppDir);
  console.log(`Consumer smoke app verified at ${appDir}`);
  console.log(`Animated consumer smoke app verified at ${animatedAppDir}`);
} finally {
  if (process.env.KEEP_SMOKE_APP === "1") {
    console.log(`Keeping smoke app at ${appDir}`);
    console.log(`Keeping animated smoke app at ${animatedAppDir}`);
  } else {
    rmSync(tempRoot, { force: true, recursive: true });
  }
}
