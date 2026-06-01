declare module "@/components/ui/dropdown-menu" {
  import type { ComponentType, ReactNode } from "react";

  type ShadcnPrimitiveProps = {
    children?: ReactNode;
    className?: string;
    [key: string]: unknown;
  };

  export const DropdownMenu: ComponentType<
    ShadcnPrimitiveProps & {
      defaultOpen?: boolean;
      onOpenChange?: (open: boolean, ...details: unknown[]) => void;
      open?: boolean;
    }
  >;
  export const DropdownMenuContent: ComponentType<ShadcnPrimitiveProps>;
  export const DropdownMenuGroup: ComponentType<ShadcnPrimitiveProps>;
  export const DropdownMenuItem: ComponentType<ShadcnPrimitiveProps>;
  export const DropdownMenuLabel: ComponentType<ShadcnPrimitiveProps>;
  export const DropdownMenuSeparator: ComponentType<ShadcnPrimitiveProps>;
  export const DropdownMenuTrigger: ComponentType<ShadcnPrimitiveProps>;
}

declare module "@/components/ui/tooltip" {
  import type { ComponentType, ReactNode } from "react";

  type ShadcnPrimitiveProps = {
    children?: ReactNode;
    className?: string;
    [key: string]: unknown;
  };

  export const Tooltip: ComponentType<ShadcnPrimitiveProps>;
  export const TooltipContent: ComponentType<ShadcnPrimitiveProps>;
  export const TooltipProvider: ComponentType<ShadcnPrimitiveProps>;
  export const TooltipTrigger: ComponentType<ShadcnPrimitiveProps>;
}
