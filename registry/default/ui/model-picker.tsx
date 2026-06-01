"use client";

import { CheckIcon, ChevronDownIcon, MapIcon, ZapIcon } from "lucide-react";
import {
  type ComponentProps,
  type ReactNode,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  MODEL_PICKER_REASONING_LEVELS,
  type ModelPickerControlValue,
  type ModelPickerModelConfig,
  type ModelPickerReasoningLevel,
  createModelPickerControlValue,
  getModelPickerFastModeCreditMultiplier,
  getModelPickerModel,
  getModelPickerModelReasoningLevels,
  getModelPickerModelSpeedModes,
  getModelPickerReasoningLevel,
  getModelPickerSpeedMode,
  normalizeModelPickerControlValue,
} from "@/lib/model-picker-core";
import {
  DropdownMenu as ShadcnDropdownMenu,
  DropdownMenuContent as ShadcnDropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem as ShadcnDropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent as ShadcnTooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const controlPillClassName = "h-7 rounded-lg text-xs";
const quietControlClassName =
  "bg-transparent text-muted-foreground hover:bg-muted/70 hover:text-foreground data-[active=true]:bg-muted data-[active=true]:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground";
const controlIconClassName =
  "opacity-70 group-hover/control:opacity-100 group-focus-visible/control:opacity-100 group-data-[active=true]/control:opacity-100 group-data-[state=open]/control:opacity-100";
const emptySuggestedModelIds: readonly string[] = [];

export type ModelPickerProps<
  TModel extends ModelPickerModelConfig = ModelPickerModelConfig,
> = {
  className?: string;
  disabled?: boolean;
  emptyModelSearchMessage?: string;
  enableModelSearch?: boolean;
  modelSearchPlaceholder?: string;
  models: readonly TModel[];
  onValueChange: (value: ModelPickerControlValue<TModel["id"]>) => void;
  providerLogoSrc?: (model: TModel) => string | null;
  showPlanMode?: boolean;
  showSpeedMode?: boolean;
  showSuggestedModels?: boolean;
  suggestedModelIds?: readonly string[];
  suggestedModelsLabel?: string;
  value: ModelPickerControlValue<TModel["id"]>;
};

export function ModelPicker<const TModel extends ModelPickerModelConfig>({
  className,
  disabled,
  emptyModelSearchMessage = "No models found.",
  enableModelSearch = false,
  modelSearchPlaceholder = "Search models...",
  models,
  onValueChange,
  providerLogoSrc = getDefaultProviderLogoSrc,
  showPlanMode = true,
  showSpeedMode = true,
  showSuggestedModels = false,
  suggestedModelIds = emptySuggestedModelIds,
  suggestedModelsLabel = "Suggested",
  value,
}: ModelPickerProps<TModel>) {
  const selectedModel = getModelPickerModel(models, value.modelId) ?? models[0];

  if (!selectedModel) {
    return (
      <TooltipProvider>
        <div
          className={cn(
            "flex min-w-0 items-center justify-end gap-1.5",
            className,
          )}
        >
          <PickerButton disabled label="No models available">
            <span className="max-w-32 truncate">No models</span>
          </PickerButton>
        </div>
      </TooltipProvider>
    );
  }

  const activeModel = selectedModel;
  const normalizedValue = normalizeModelPickerControlValue(activeModel, value);
  const speedModes = getModelPickerModelSpeedModes(activeModel);
  const speedMode = getModelPickerSpeedMode(normalizedValue.speedMode);
  const hasSpeedSelection =
    showSpeedMode &&
    speedModes.length > 1 &&
    speedModes.some((mode) => mode === "fast");
  const reasoningLevels = getModelPickerModelReasoningLevels(activeModel);
  const hasReasoningSelection = reasoningLevels.length > 1;

  function changeModel(model: TModel) {
    const nextValue = createModelPickerControlValue(model);
    const nextSpeedModes = getModelPickerModelSpeedModes(model);

    onValueChange({
      ...nextValue,
      planMode: showPlanMode ? normalizedValue.planMode : false,
      reasoningLevel: includesValue(
        getModelPickerModelReasoningLevels(model),
        normalizedValue.reasoningLevel,
      )
        ? normalizedValue.reasoningLevel
        : nextValue.reasoningLevel,
      speedMode:
        showSpeedMode &&
        includesValue(nextSpeedModes, normalizedValue.speedMode)
          ? normalizedValue.speedMode
          : nextValue.speedMode,
    });
  }

  function changeReasoning(reasoningLevel: ModelPickerReasoningLevel) {
    onValueChange({ ...normalizedValue, reasoningLevel });
  }

  function toggleSpeed() {
    onValueChange({
      ...normalizedValue,
      speedMode: normalizedValue.speedMode === "fast" ? "standard" : "fast",
    });
  }

  function togglePlanMode() {
    onValueChange({
      ...normalizedValue,
      planMode: !normalizedValue.planMode,
    });
  }

  return (
    <TooltipProvider>
      <div
        className={cn(
          "flex min-w-0 items-center justify-end gap-1.5",
          className,
        )}
      >
        <ControlSlot>
          <ModelPickerMenu
            disabled={disabled}
            emptySearchMessage={emptyModelSearchMessage}
            enableSearch={enableModelSearch}
            modelSearchPlaceholder={modelSearchPlaceholder}
            models={models}
            onSelect={changeModel}
            providerLogoSrc={providerLogoSrc}
            selectedModel={activeModel}
            showSuggestedModels={showSuggestedModels}
            suggestedModelIds={suggestedModelIds}
            suggestedModelsLabel={suggestedModelsLabel}
          />
        </ControlSlot>
        {hasReasoningSelection ? (
          <ControlSlot>
            <ReasoningPicker
              disabled={disabled}
              onSelect={changeReasoning}
              selectedModel={activeModel}
              value={normalizedValue.reasoningLevel}
            />
          </ControlSlot>
        ) : null}
        {hasSpeedSelection ? (
          <ControlSlot>
            <SpeedToggle
              active={speedMode.id === "fast"}
              disabled={disabled}
              onToggle={toggleSpeed}
              selectedModel={activeModel}
            />
          </ControlSlot>
        ) : null}
        {showPlanMode ? (
          <ControlSlot>
            <PlanToggle
              active={normalizedValue.planMode}
              disabled={disabled}
              onToggle={togglePlanMode}
            />
          </ControlSlot>
        ) : null}
      </div>
    </TooltipProvider>
  );
}

function ModelPickerMenu<const TModel extends ModelPickerModelConfig>({
  disabled,
  emptySearchMessage,
  enableSearch,
  modelSearchPlaceholder,
  models,
  onSelect,
  providerLogoSrc,
  selectedModel,
  showSuggestedModels,
  suggestedModelIds,
  suggestedModelsLabel,
}: {
  disabled?: boolean;
  emptySearchMessage: string;
  enableSearch: boolean;
  modelSearchPlaceholder: string;
  models: readonly TModel[];
  onSelect: (model: TModel) => void;
  providerLogoSrc: (model: TModel) => string | null;
  selectedModel: TModel;
  showSuggestedModels: boolean;
  suggestedModelIds: readonly string[];
  suggestedModelsLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const normalizedSearchQuery = normalizeModelSearchValue(searchQuery);
  const filteredModels = getFilteredModels(models, normalizedSearchQuery);
  const suggestedModels = showSuggestedModels
    ? getSuggestedModels(filteredModels, suggestedModelIds)
    : [];
  const suggestedModelIdSet = new Set(suggestedModels.map((model) => model.id));
  const remainingModels =
    suggestedModels.length > 0
      ? filteredModels.filter((model) => !suggestedModelIdSet.has(model.id))
      : filteredModels;
  const hasSearchResults =
    suggestedModels.length > 0 || remainingModels.length > 0;

  return (
    <ShadcnDropdownMenu
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setSearchQuery("");
        }
      }}
    >
      <div className="inline-flex min-w-0 items-center">
        <DropdownMenuTrigger
          aria-label="Select model"
          className={cn(
            "group/control inline-flex min-w-0 shrink-0 items-center justify-center border border-transparent bg-clip-padding font-medium outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
            controlPillClassName,
            quietControlClassName,
            "gap-1.5 px-2",
          )}
          data-active={open ? true : undefined}
          disabled={disabled}
          title="Select model"
          type="button"
        >
          <ProviderLogo
            className={controlIconClassName}
            model={selectedModel}
            src={providerLogoSrc(selectedModel)}
          />
          <span className="max-w-32 truncate">
            {selectedModel.shortLabel ?? selectedModel.label}
          </span>
          <PickerChevron />
        </DropdownMenuTrigger>
      </div>
      <PickerMenuContent
        align="start"
        className="w-[min(22rem,calc(100vw-2rem))]"
        side="top"
      >
        {enableSearch ? (
          <ModelSearchInput
            onValueChange={setSearchQuery}
            placeholder={modelSearchPlaceholder}
            value={searchQuery}
          />
        ) : null}
        {suggestedModels.length > 0 ? (
          <>
            <DropdownMenuLabel className="px-2 py-1.5 font-medium text-muted-foreground text-xs">
              {suggestedModelsLabel}
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              {suggestedModels.map((model) => (
                <ModelMenuItem
                  key={model.id}
                  model={model}
                  onSelect={onSelect}
                  providerLogoSrc={providerLogoSrc}
                  selected={model.id === selectedModel.id}
                />
              ))}
            </DropdownMenuGroup>
            {remainingModels.length > 0 ? (
              <DropdownMenuSeparator className="-mx-2 my-2 h-px bg-border" />
            ) : null}
          </>
        ) : null}
        {remainingModels.length > 0 ? (
          <>
            <DropdownMenuLabel className="px-2 py-1.5 font-medium text-muted-foreground text-xs">
              {normalizedSearchQuery ? "Results" : "Models"}
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              {remainingModels.map((model) => (
                <ModelMenuItem
                  key={model.id}
                  model={model}
                  onSelect={onSelect}
                  providerLogoSrc={providerLogoSrc}
                  selected={model.id === selectedModel.id}
                />
              ))}
            </DropdownMenuGroup>
          </>
        ) : null}
        {hasSearchResults ? null : (
          <div className="px-2 py-6 text-center text-muted-foreground text-sm">
            {emptySearchMessage}
          </div>
        )}
      </PickerMenuContent>
    </ShadcnDropdownMenu>
  );
}

function ModelSearchInput({
  onValueChange,
  placeholder,
  value,
}: {
  onValueChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="px-1 pb-2">
      <input
        aria-label={placeholder}
        className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        autoComplete="off"
        onChange={(event) => onValueChange(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key !== "Escape") {
            event.stopPropagation();
          }
        }}
        placeholder={placeholder}
        ref={inputRef}
        spellCheck={false}
        type="search"
        value={value}
      />
    </div>
  );
}

function ModelMenuItem<const TModel extends ModelPickerModelConfig>({
  model,
  onSelect,
  providerLogoSrc,
  selected,
}: {
  model: TModel;
  onSelect: (model: TModel) => void;
  providerLogoSrc: (model: TModel) => string | null;
  selected: boolean;
}) {
  return (
    <PickerMenuItem onActivate={() => onSelect(model)}>
      <ProviderLogo model={model} src={providerLogoSrc(model)} />
      <span className="grid min-w-0 flex-1 text-left">
        <span className="truncate">{model.label}</span>
        <span className="truncate text-muted-foreground text-xs">
          {getModelMenuDescription(model)}
        </span>
      </span>
      {selected ? (
        <CheckIcon className="ml-auto size-4 text-muted-foreground" />
      ) : null}
    </PickerMenuItem>
  );
}

function ReasoningPicker({
  disabled,
  onSelect,
  selectedModel,
  value,
}: {
  disabled?: boolean;
  onSelect: (reasoningLevel: ModelPickerReasoningLevel) => void;
  selectedModel: ModelPickerModelConfig;
  value: ModelPickerReasoningLevel;
}) {
  const reasoningLevels = getModelPickerModelReasoningLevels(selectedModel);
  const selectedReasoning = getModelPickerReasoningLevel(
    includesValue(reasoningLevels, value)
      ? value
      : (reasoningLevels[0] ?? "medium"),
  );
  const [open, setOpen] = useState(false);

  return (
    <ShadcnDropdownMenu onOpenChange={setOpen}>
      <div className="inline-flex min-w-0 items-center">
        <DropdownMenuTrigger
          aria-label="Select reasoning"
          className={cn(
            "group/control inline-flex min-w-0 shrink-0 items-center justify-center border border-transparent bg-clip-padding font-medium outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
            controlPillClassName,
            quietControlClassName,
            "gap-1.5 px-2",
          )}
          data-active={open ? true : undefined}
          disabled={disabled}
          title="Select reasoning effort"
          type="button"
        >
          <ReasoningEffortIcon
            className={controlIconClassName}
            level={selectedReasoning.id}
          />
          <span>{selectedReasoning.label}</span>
          <PickerChevron />
        </DropdownMenuTrigger>
      </div>
      <PickerMenuContent align="start" className="w-64" side="top">
        <DropdownMenuLabel className="px-2 py-1.5 font-medium text-muted-foreground text-xs">
          Reasoning
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          {MODEL_PICKER_REASONING_LEVELS.filter((level) =>
            includesValue(reasoningLevels, level.id),
          ).map((level) => (
            <SelectableMenuItem
              checked={level.id === selectedReasoning.id}
              icon={<ReasoningEffortIcon level={level.id} />}
              key={level.id}
              label={level.label}
              onSelect={() => onSelect(level.id)}
            />
          ))}
        </DropdownMenuGroup>
      </PickerMenuContent>
    </ShadcnDropdownMenu>
  );
}

function SpeedToggle({
  active,
  disabled,
  onToggle,
  selectedModel,
}: {
  active: boolean;
  disabled?: boolean;
  onToggle: () => void;
  selectedModel: ModelPickerModelConfig;
}) {
  return (
    <TogglePill
      active={active}
      disabled={disabled}
      label="Fast"
      offLabel="Toggle fast mode"
      onToggle={onToggle}
      tooltip={getSpeedTooltip(selectedModel, active)}
    >
      <ZapIcon className={cn("size-4", controlIconClassName)} />
    </TogglePill>
  );
}

function PlanToggle({
  active,
  disabled,
  onToggle,
}: {
  active: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <TogglePill
      active={active}
      disabled={disabled}
      label="Plan"
      offLabel="Toggle plan mode"
      onToggle={onToggle}
      tooltip={active ? "Exit plan mode" : "Enable plan mode"}
    >
      <MapIcon className={cn("size-4", controlIconClassName)} />
    </TogglePill>
  );
}

function PickerButton({
  children,
  className,
  disabled,
  label,
  ...props
}: ComponentProps<"button"> & {
  label: string;
}) {
  return (
    <button
      aria-label={label}
      className={cn(
        "group/control inline-flex min-w-0 shrink-0 items-center justify-center border border-transparent bg-clip-padding font-medium outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
        controlPillClassName,
        quietControlClassName,
        "gap-1.5 px-2",
        className,
      )}
      disabled={disabled}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}

function PickerChevron() {
  return (
    <ChevronDownIcon
      aria-hidden="true"
      className={cn("size-3.5", controlIconClassName)}
      strokeWidth={2.5}
    />
  );
}

export function ReasoningEffortIcon({
  className,
  level,
  ...props
}: ComponentProps<"svg"> & {
  level: ModelPickerReasoningLevel;
}) {
  const depth = getReasoningIconDepth(level);

  return (
    <svg
      aria-hidden="true"
      className={cn("size-4 shrink-0", className)}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M17.6 6.5A3 3 0 0 0 12 5a3 3 0 0 0-5.6 1.5" />
      <path d="M18 5.1a4 4 0 0 1 2.5 5.8" />
      <path d="M18 18a4 4 0 0 0 2-7.5" />
      <path d="M20 17.5A4 4 0 0 1 12 18a4 4 0 0 1-8-.5" />
      <path d="M6 18a4 4 0 0 1-2-7.5" />
      <path d="M6 5.1a4 4 0 0 0-2.5 5.8" />
      {depth >= 1 ? <path d="M12 18V6" /> : null}
      {depth >= 2 ? <path d="M9 13c1.8-.8 3-2.2 3-4" /> : null}
      {depth >= 3 ? <path d="M15 13c-1.8-.8-3-2.2-3-4" /> : null}
      {depth >= 4 ? <path d="M8 9.5c1.2.2 2.1.8 2.8 1.8" /> : null}
      {depth >= 5 ? <path d="M16 9.5c-1.2.2-2.1.8-2.8 1.8" /> : null}
    </svg>
  );
}

function getReasoningIconDepth(level: ModelPickerReasoningLevel) {
  switch (level) {
    case "minimal":
      return 1;
    case "low":
      return 2;
    case "medium":
      return 3;
    case "high":
      return 4;
    case "xhigh":
      return 5;
  }

  return 3;
}

function TogglePill({
  active,
  children,
  disabled,
  label,
  offLabel,
  onToggle,
  tooltip,
}: {
  active: boolean;
  children: ReactNode;
  disabled?: boolean;
  label: string;
  offLabel: string;
  onToggle: () => void;
  tooltip: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        aria-label={active ? label : offLabel}
        aria-pressed={active}
        className={cn(
          "group/control inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding font-medium outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
          controlPillClassName,
          "min-w-7 overflow-hidden",
          active
            ? "gap-1.5 bg-muted px-2 text-foreground"
            : cn(quietControlClassName, "gap-0 px-1.5"),
        )}
        data-active={active ? true : undefined}
        disabled={disabled}
        onClick={onToggle}
        type="button"
      >
        {children}
        {active ? (
          <span className="min-w-0 overflow-hidden whitespace-nowrap">
            {label}
          </span>
        ) : null}
      </TooltipTrigger>
      <PickerTooltipContent>{tooltip}</PickerTooltipContent>
    </Tooltip>
  );
}

function PickerTooltipContent({ children }: { children: ReactNode }) {
  return (
    <ShadcnTooltipContent side="top" sideOffset={8}>
      {children}
    </ShadcnTooltipContent>
  );
}

function PickerMenuContent({
  className,
  ...props
}: {
  children?: ReactNode;
  className?: string;
  [key: string]: unknown;
}) {
  return (
    <ShadcnDropdownMenuContent
      className={cn("max-h-80 min-w-32 p-2", className)}
      sideOffset={8}
      {...props}
    />
  );
}

function PickerMenuItem({
  children,
  className,
  onActivate,
  ...props
}: {
  children?: ReactNode;
  className?: string;
  onActivate?: () => void;
  [key: string]: unknown;
}) {
  const didActivateRef = useRef(false);

  const activate = useCallback(() => {
    if (didActivateRef.current) {
      return;
    }

    didActivateRef.current = true;
    onActivate?.();
    queueMicrotask(() => {
      didActivateRef.current = false;
    });
  }, [onActivate]);

  const activationProps = onActivate
    ? ({
        onClick: activate,
        onSelect: activate,
      } as Record<string, unknown>)
    : undefined;

  return (
    <ShadcnDropdownMenuItem
      className={cn(
        "relative flex cursor-default items-center gap-2 py-2 text-sm [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      {...activationProps}
      {...props}
    >
      {children}
    </ShadcnDropdownMenuItem>
  );
}

function SelectableMenuItem({
  checked,
  icon,
  label,
  onSelect,
}: {
  checked: boolean;
  icon?: ReactNode;
  label: string;
  onSelect: () => void;
}) {
  return (
    <PickerMenuItem onActivate={onSelect}>
      {icon}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {checked ? (
        <CheckIcon className="ml-auto size-4 text-muted-foreground" />
      ) : null}
    </PickerMenuItem>
  );
}

function getSpeedTooltip(model: ModelPickerModelConfig, active: boolean) {
  if (active) {
    return "Disable fast mode";
  }

  const creditMultiplier = getModelPickerFastModeCreditMultiplier(model);

  if (model.fastMode?.speedMultiplier && creditMultiplier) {
    return `Enable fast mode (${model.fastMode.speedMultiplier}x faster, uses ${creditMultiplier}x credits)`;
  }

  if (model.fastMode?.speedMultiplier) {
    return `Enable fast mode (${model.fastMode.speedMultiplier}x faster)`;
  }

  if (creditMultiplier) {
    return `Enable fast mode (uses ${creditMultiplier}x credits)`;
  }

  return "Enable fast mode";
}

function ControlSlot({ children }: { children: ReactNode }) {
  return <div className="flex min-w-0 items-center">{children}</div>;
}

function getFilteredModels<const TModel extends ModelPickerModelConfig>(
  models: readonly TModel[],
  normalizedSearchQuery: string,
) {
  if (!normalizedSearchQuery) {
    return [...models];
  }

  return models.filter((model) =>
    getModelSearchText(model).includes(normalizedSearchQuery),
  );
}

function getSuggestedModels<const TModel extends ModelPickerModelConfig>(
  models: readonly TModel[],
  suggestedModelIds: readonly string[],
) {
  const modelsById = new Map(models.map((model) => [model.id, model]));
  const orderedSuggestedModels = suggestedModelIds
    .map((modelId) => modelsById.get(modelId))
    .filter((model): model is TModel => Boolean(model));
  const orderedSuggestedModelIds = new Set(
    orderedSuggestedModels.map((model) => model.id),
  );
  const flaggedSuggestedModels = models.filter(
    (model) => model.suggested && !orderedSuggestedModelIds.has(model.id),
  );

  return [...orderedSuggestedModels, ...flaggedSuggestedModels];
}

function getModelSearchText(model: ModelPickerModelConfig) {
  return normalizeModelSearchValue(
    [
      model.id,
      model.label,
      model.shortLabel,
      model.provider,
      model.providerLabel,
      model.description,
      ...(model.keywords ?? []),
      model.integrations?.aiSdk?.modelId,
      model.integrations?.openRouter?.modelId,
      model.metadata?.source,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function normalizeModelSearchValue(value: string) {
  return value.trim().toLowerCase();
}

function getModelMenuDescription(model: ModelPickerModelConfig) {
  const provider = model.providerLabel ?? model.provider ?? "Custom";
  const description = model.description?.trim();

  return description ? `${provider} - ${description}` : provider;
}

export type ProviderLogoProps = Omit<
  ComponentProps<"img">,
  "height" | "src" | "width"
> & {
  model: ModelPickerModelConfig;
  src?: string | null;
};

export function ProviderLogo({
  className,
  model,
  src,
  ...props
}: ProviderLogoProps) {
  if (!src) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-full bg-muted font-medium text-[0.55rem] text-muted-foreground uppercase",
          className,
        )}
      >
        {(model.providerLabel ?? model.provider ?? model.label).slice(0, 1)}
      </span>
    );
  }

  return (
    <img
      alt=""
      aria-hidden="true"
      className={cn("size-4 shrink-0", className)}
      height={16}
      src={src}
      width={16}
      {...props}
    />
  );
}

function getDefaultProviderLogoSrc(model: ModelPickerModelConfig) {
  if (!model.provider) {
    return null;
  }

  if (
    model.provider !== "anthropic" &&
    model.provider !== "google" &&
    model.provider !== "openai"
  ) {
    return null;
  }

  return `https://models.dev/logos/${model.provider}.svg`;
}

function includesValue<T extends string>(
  values: readonly T[],
  value: string,
): value is T {
  return values.some((candidate) => candidate === value);
}
