const checks = [
  {
    label: "Vercel AI Gateway",
    minimumModelCount: 100,
    modelsUrl: "https://ai-gateway.vercel.sh/v1/models",
  },
  {
    label: "OpenRouter",
    minimumModelCount: 100,
    modelsUrl: "https://openrouter.ai/api/v1/models",
  },
];

const results = await Promise.all(
  checks.map(async (check) => {
    const modelIds = await fetchModelIds(check.modelsUrl);
    return { check, modelIds };
  }),
);

for (const { check, modelIds } of results) {
  if (modelIds.length < check.minimumModelCount) {
    throw new Error(
      `${check.label}: expected at least ${check.minimumModelCount} models, received ${modelIds.length}.`,
    );
  }

  console.log(`${check.label}: discovered ${modelIds.length} models.`);
}

async function fetchModelIds(modelsUrl) {
  const response = await fetch(modelsUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${modelsUrl}: ${response.status} ${response.statusText}`,
    );
  }

  const payload = await response.json();

  return payload.data.map((model) => model.id);
}
