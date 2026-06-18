"use client";

import { CheckIcon, ChevronDownIcon, MapIcon, ZapIcon } from "lucide-react";
import { motion, MotionConfig, useReducedMotion } from "motion/react";
import {
  type ComponentProps,
  type ReactNode,
  type RefObject,
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

const controlPillClassName =
  "h-7 rounded-lg text-xs transition-[background-color,color,gap,padding] duration-200 motion-reduce:transition-none";
const quietControlClassName =
  "bg-transparent text-muted-foreground hover:bg-muted/70 hover:text-foreground data-[active=true]:bg-muted data-[active=true]:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground";
const controlIconClassName =
  "opacity-70 transition-opacity motion-reduce:transition-none group-hover/control:opacity-100 group-focus-visible/control:opacity-100 group-data-[active=true]/control:opacity-100 group-data-[state=open]/control:opacity-100";
const emptySuggestedModelIds: readonly string[] = [];
const controlStructuralDurationMs = 250;
const controlWidthDurationMs = 220;
const controlMotionEasing = "cubic-bezier(0.2, 0, 0, 1)";
const modelPickerMotionTransition = {
  duration: 0.22,
  ease: [0.2, 0, 0, 1],
} as const;

export type ModelPickerProps<
  TModel extends ModelPickerModelConfig = ModelPickerModelConfig,
> = {
  className?: string;
  disabled?: boolean;
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
  const layoutTransition = useSourceAwareLayoutAnimation<HTMLDivElement>();
  const [animateModelWidth, setAnimateModelWidth] = useState(true);
  const [snapCapabilitySlots, setSnapCapabilitySlots] = useState(false);

  useLayoutEffect(() => {
    if (!snapCapabilitySlots) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      setSnapCapabilitySlots(false);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [snapCapabilitySlots]);

  function changeModel(model: TModel) {
    if (model.id !== activeModel.id) {
      const changesCapabilityVisibility = hasCapabilityVisibilityChange(
        activeModel,
        model,
        { showSpeedMode },
      );

      if (changesCapabilityVisibility) {
        layoutTransition.capture();
        setSnapCapabilitySlots(true);
      }

      setAnimateModelWidth(!changesCapabilityVisibility);
    }

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

  const controls = [
    <LayoutAnimatedItem key="model" layoutId="model">
      <ModelPickerMenu
        animateWidth={animateModelWidth}
        disabled={disabled}
        models={models}
        onSelect={changeModel}
        providerLogoSrc={providerLogoSrc}
        selectedModel={activeModel}
        showSuggestedModels={showSuggestedModels}
        suggestedModelIds={suggestedModelIds}
        suggestedModelsLabel={suggestedModelsLabel}
      />
    </LayoutAnimatedItem>,
    <CollapsiblePillSlot
      key="reasoning"
      layoutId="reasoning"
      snapStructure={snapCapabilitySlots}
      visible={hasReasoningSelection}
    >
      <ReasoningPicker
        disabled={disabled}
        onSelect={changeReasoning}
        selectedModel={activeModel}
        value={normalizedValue.reasoningLevel}
      />
    </CollapsiblePillSlot>,
    hasSpeedSelection ? (
      <CollapsiblePillSlot
        key="speed"
        layoutId="speed"
        snapStructure={snapCapabilitySlots}
        visible
      >
        <SpeedToggle
          active={speedMode.id === "fast"}
          disabled={disabled}
          onToggle={toggleSpeed}
          selectedModel={activeModel}
        />
      </CollapsiblePillSlot>
    ) : null,
    showPlanMode ? (
      <LayoutAnimatedItem key="plan" layoutId="plan">
        <PlanToggle
          active={normalizedValue.planMode}
          disabled={disabled}
          onToggle={togglePlanMode}
        />
      </LayoutAnimatedItem>
    ) : null,
  ];

  return (
    <MotionConfig reducedMotion="user" transition={modelPickerMotionTransition}>
      <TooltipProvider>
        <motion.div
          className={cn(
            "flex min-w-0 items-center justify-end gap-1.5",
            className,
          )}
          layout
          ref={layoutTransition.ref}
        >
          {controls}
        </motion.div>
      </TooltipProvider>
    </MotionConfig>
  );
}

function ModelPickerMenu<const TModel extends ModelPickerModelConfig>({
  animateWidth,
  disabled,
  models,
  onSelect,
  providerLogoSrc,
  selectedModel,
  showSuggestedModels,
  suggestedModelIds,
  suggestedModelsLabel,
}: {
  animateWidth: boolean;
  disabled?: boolean;
  models: readonly TModel[];
  onSelect: (model: TModel) => void;
  providerLogoSrc: (model: TModel) => string | null;
  selectedModel: TModel;
  showSuggestedModels: boolean;
  suggestedModelIds: readonly string[];
  suggestedModelsLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const suggestedModels = showSuggestedModels
    ? getSuggestedModels(models, suggestedModelIds)
    : [];
  const suggestedModelIdSet = new Set(suggestedModels.map((model) => model.id));
  const remainingModels =
    suggestedModels.length > 0
      ? models.filter((model) => !suggestedModelIdSet.has(model.id))
      : models;

  const selectModel = (model: TModel) => {
    onSelect(model);
    setOpen(false);
  };

  return (
    <ShadcnDropdownMenu onOpenChange={setOpen}>
      <AnimatedIntrinsicWidth
        animate={animateWidth}
        watchKey={selectedModel.id}
      >
        <DropdownMenuTrigger
          aria-label="Select model"
          className={cn(
            "group/control inline-flex min-w-0 shrink-0 items-center justify-center border border-transparent bg-clip-padding font-medium outline-none select-none focus-visible:border-ring disabled:pointer-events-none disabled:opacity-50",
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
      </AnimatedIntrinsicWidth>
      <PickerMenuContent
        align="start"
        className="w-[min(22rem,calc(100vw-2rem))]"
        side="top"
      >
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
                  onSelect={selectModel}
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
              Models
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              {remainingModels.map((model) => (
                <ModelMenuItem
                  key={model.id}
                  model={model}
                  onSelect={selectModel}
                  providerLogoSrc={providerLogoSrc}
                  selected={model.id === selectedModel.id}
                />
              ))}
            </DropdownMenuGroup>
          </>
        ) : null}
      </PickerMenuContent>
    </ShadcnDropdownMenu>
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
      <ModelMenuItemContent
        model={model}
        providerLogoSrc={providerLogoSrc}
        selected={selected}
      />
    </PickerMenuItem>
  );
}

function ModelMenuItemContent<const TModel extends ModelPickerModelConfig>({
  model,
  providerLogoSrc,
  selected,
}: {
  model: TModel;
  providerLogoSrc: (model: TModel) => string | null;
  selected: boolean;
}) {
  const description = getModelMenuDescription(model);

  return (
    <>
      <ProviderLogo model={model} src={providerLogoSrc(model)} />
      <span className="grid min-w-0 flex-1 text-left">
        <span className="truncate">{model.label}</span>
        {description ? (
          <span className="truncate text-muted-foreground text-xs">
            {description}
          </span>
        ) : null}
      </span>
      {selected ? (
        <CheckIcon className="ml-auto size-4 text-muted-foreground" />
      ) : null}
    </>
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
      <AnimatedIntrinsicWidth
        watchKey={`${selectedModel.id}:${selectedReasoning.id}`}
      >
        <DropdownMenuTrigger
          aria-label="Select reasoning"
          className={cn(
            "group/control inline-flex min-w-0 shrink-0 items-center justify-center border border-transparent bg-clip-padding font-medium outline-none select-none focus-visible:border-ring disabled:pointer-events-none disabled:opacity-50",
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
      </AnimatedIntrinsicWidth>
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
        "group/control inline-flex min-w-0 shrink-0 items-center justify-center border border-transparent bg-clip-padding font-medium outline-none select-none focus-visible:border-ring disabled:pointer-events-none disabled:opacity-50",
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
          "group/control inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding font-medium outline-none select-none focus-visible:border-ring disabled:pointer-events-none disabled:opacity-50",
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
        <motion.span
          animate={{ opacity: active ? 1 : 0, width: active ? "auto" : 0 }}
          className="inline-flex overflow-hidden whitespace-nowrap"
          initial={false}
          transition={modelPickerMotionTransition}
        >
          {label}
        </motion.span>
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

function LayoutAnimatedItem({
  children,
  layoutId,
}: {
  children: ReactNode;
  layoutId: string;
}) {
  return (
    <motion.div
      className="flex min-w-0 items-center"
      data-layout-animate-id={layoutId}
      data-layout-animate-item
      layout="position"
    >
      {children}
    </motion.div>
  );
}

function CollapsiblePillSlot({
  children,
  layoutId,
  snapStructure = false,
  visible,
}: {
  children: ReactNode;
  layoutId: string;
  snapStructure?: boolean;
  visible: boolean;
}) {
  return (
    <motion.div
      animate={{
        gridTemplateColumns: visible ? "1fr" : "0fr",
        marginLeft: visible ? 0 : -6,
        opacity: visible ? 1 : 0,
      }}
      aria-hidden={!visible}
      className={cn(
        "grid",
        visible ? "pointer-events-auto" : "pointer-events-none",
      )}
      data-layout-animate-id={layoutId}
      data-layout-animate-item
      inert={!visible}
      initial={false}
      layout="position"
      transition={snapStructure ? { duration: 0 } : modelPickerMotionTransition}
    >
      <div className="min-w-0 overflow-hidden">{children}</div>
    </motion.div>
  );
}

function AnimatedIntrinsicWidth({
  animate = true,
  children,
  watchKey,
}: {
  animate?: boolean;
  children: ReactNode;
  watchKey: string;
}) {
  const reduceMotion = usePrefersReducedMotion();
  const innerRef = useRef<HTMLDivElement | null>(null);
  const previousKeyRef = useRef(watchKey);
  const previousWidthRef = useRef<number | null>(null);
  const frameRef = useRef<number | undefined>(undefined);
  const transitionFrameRef = useRef<number | undefined>(undefined);
  const releaseTimerRef = useRef<number | undefined>(undefined);
  const [lockedWidth, setLockedWidth] = useState<number | null>(null);

  useLayoutEffect(
    () => () => {
      clearWidthAnimationTimers(frameRef, transitionFrameRef, releaseTimerRef);
    },
    [],
  );

  useLayoutEffect(() => {
    const element = innerRef.current;
    if (!element) {
      return;
    }

    clearWidthAnimationTimers(frameRef, transitionFrameRef, releaseTimerRef);

    const nextWidth = element.getBoundingClientRect().width;
    const previousWidth = previousWidthRef.current;
    const keyChanged = previousKeyRef.current !== watchKey;

    previousKeyRef.current = watchKey;
    previousWidthRef.current = nextWidth;

    if (
      !animate ||
      reduceMotion ||
      !keyChanged ||
      previousWidth === null ||
      Math.abs(previousWidth - nextWidth) < 0.5
    ) {
      setLockedWidth(null);
      return;
    }

    setLockedWidth(previousWidth);
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = undefined;
      transitionFrameRef.current = window.requestAnimationFrame(() => {
        transitionFrameRef.current = undefined;
        setLockedWidth(nextWidth);
        releaseTimerRef.current = window.setTimeout(() => {
          setLockedWidth(null);
          releaseTimerRef.current = undefined;
        }, controlWidthDurationMs + 40);
      });
    });
  }, [animate, reduceMotion, watchKey]);

  return (
    <motion.div
      className="min-w-0 overflow-hidden transition-[width] duration-200 motion-reduce:transition-none"
      layout="size"
      style={lockedWidth === null ? undefined : { width: lockedWidth }}
    >
      <div className="inline-flex min-w-0 items-center" ref={innerRef}>
        {children}
      </div>
    </motion.div>
  );
}

function clearWidthAnimationTimers(
  frameRef: RefObject<number | undefined>,
  transitionFrameRef: RefObject<number | undefined>,
  releaseTimerRef: RefObject<number | undefined>,
) {
  if (frameRef.current !== undefined) {
    window.cancelAnimationFrame(frameRef.current);
    frameRef.current = undefined;
  }

  if (transitionFrameRef.current !== undefined) {
    window.cancelAnimationFrame(transitionFrameRef.current);
    transitionFrameRef.current = undefined;
  }

  if (releaseTimerRef.current !== undefined) {
    window.clearTimeout(releaseTimerRef.current);
    releaseTimerRef.current = undefined;
  }
}

function usePrefersReducedMotion() {
  return useReducedMotion();
}

type ElementAnimationState = {
  animation: Animation;
  previousWillChange: string;
};

type LayoutElementSnapshot = {
  hidden: boolean;
  rect: DOMRectReadOnly;
};

function useSourceAwareLayoutAnimation<T extends HTMLElement>() {
  const reduceMotion = usePrefersReducedMotion();
  const ref = useRef<T | null>(null);
  const previousSnapshotsRef = useRef<Map<
    HTMLElement,
    LayoutElementSnapshot
  > | null>(null);
  const animationsByElementRef = useRef(
    new WeakMap<HTMLElement, ElementAnimationState>(),
  );
  const activeAnimationsRef = useRef(new Set<Animation>());

  const capture = useCallback(() => {
    const container = ref.current;
    if (!container || reduceMotion) {
      previousSnapshotsRef.current = null;
      return;
    }

    cancelActiveLayoutAnimations(activeAnimationsRef.current);
    previousSnapshotsRef.current = measureLayoutElements(container);
  }, [reduceMotion]);

  useLayoutEffect(() => {
    const container = ref.current;
    const previousSnapshots = previousSnapshotsRef.current;
    if (!container || !previousSnapshots || reduceMotion) {
      previousSnapshotsRef.current = null;
      return;
    }

    previousSnapshotsRef.current = null;

    for (const element of getLayoutElements(container)) {
      const previous = previousSnapshots.get(element);
      if (!previous || typeof element.animate !== "function") {
        continue;
      }

      if (previous.hidden !== isLayoutElementHidden(element)) {
        continue;
      }

      const nextRect = element.getBoundingClientRect();
      const deltaX = previous.rect.left - nextRect.left;
      const deltaY = previous.rect.top - nextRect.top;
      if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5) {
        continue;
      }

      const previousWillChange = cancelElementLayoutAnimation(
        element,
        animationsByElementRef.current,
      );
      element.style.willChange = mergeWillChange(
        previousWillChange,
        "transform",
      );

      const animation = element.animate(
        [
          { transform: `translate3d(${deltaX}px, ${deltaY}px, 0)` },
          { transform: "translate3d(0, 0, 0)" },
        ],
        {
          duration: controlStructuralDurationMs,
          easing: controlMotionEasing,
        },
      );

      animationsByElementRef.current.set(element, {
        animation,
        previousWillChange,
      });
      activeAnimationsRef.current.add(animation);

      const cleanup = () => {
        activeAnimationsRef.current.delete(animation);
        const activeState = animationsByElementRef.current.get(element);
        if (activeState?.animation === animation) {
          element.style.willChange = activeState.previousWillChange;
          animationsByElementRef.current.delete(element);
        }
      };

      animation.addEventListener("finish", cleanup, { once: true });
      animation.addEventListener("cancel", cleanup, { once: true });
    }
  });

  useLayoutEffect(
    () => () => {
      cancelActiveLayoutAnimations(activeAnimationsRef.current);
    },
    [],
  );

  return { capture, ref };
}

function measureLayoutElements(container: HTMLElement) {
  const snapshots = new Map<HTMLElement, LayoutElementSnapshot>();
  for (const element of getLayoutElements(container)) {
    snapshots.set(element, {
      hidden: isLayoutElementHidden(element),
      rect: element.getBoundingClientRect(),
    });
  }
  return snapshots;
}

function getLayoutElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>("[data-layout-animate-item]"),
  ).filter((element) => element.parentElement === container);
}

function isLayoutElementHidden(element: HTMLElement) {
  return element.getAttribute("aria-hidden") === "true";
}

function cancelActiveLayoutAnimations(activeAnimations: Set<Animation>) {
  for (const animation of activeAnimations) {
    animation.cancel();
  }
  activeAnimations.clear();
}

function cancelElementLayoutAnimation(
  element: HTMLElement,
  animationsByElement: WeakMap<HTMLElement, ElementAnimationState>,
) {
  const activeState = animationsByElement.get(element);
  if (!activeState) {
    return element.style.willChange;
  }

  activeState.animation.cancel();
  animationsByElement.delete(element);
  element.style.willChange = activeState.previousWillChange;
  return activeState.previousWillChange;
}

function mergeWillChange(current: string, next: string) {
  if (!current || current === "auto") {
    return next;
  }

  const values = current.split(",").map((value) => value.trim());
  return values.includes(next) ? current : [...values, next].join(", ");
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

function getModelMenuDescription(model: ModelPickerModelConfig) {
  return model.description?.trim() || null;
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

function hasCapabilityVisibilityChange(
  currentModel: ModelPickerModelConfig,
  nextModel: ModelPickerModelConfig,
  {
    showSpeedMode,
  }: {
    showSpeedMode: boolean;
  },
) {
  return (
    getModelPickerModelReasoningLevels(currentModel).length > 1 !==
      getModelPickerModelReasoningLevels(nextModel).length > 1 ||
    (showSpeedMode &&
      getModelPickerModelSpeedModes(currentModel).length > 1 !==
        getModelPickerModelSpeedModes(nextModel).length > 1)
  );
}
