import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type TooltipContextValue = { id: string };
const TooltipContext = React.createContext<TooltipContextValue | null>(null);

function useTooltipContext(componentName: string) {
  const context = React.useContext(TooltipContext);
  if (!context) throw new Error(`${componentName} must be used inside <Tooltip>.`);
  return context;
}

function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function Tooltip({ children }: { children: React.ReactNode }) {
  const id = React.useId();
  return <TooltipContext.Provider value={{ id }}><span data-slot="tooltip" className="group/tooltip relative inline-flex">{children}</span></TooltipContext.Provider>;
}

export interface TooltipTriggerProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}

const TooltipTrigger = React.forwardRef<HTMLElement, TooltipTriggerProps>(function TooltipTrigger(
  { className, asChild = false, "aria-describedby": describedBy, ...props },
  ref,
) {
  const { id } = useTooltipContext("TooltipTrigger");
  const Component = asChild ? Slot : "span";
  return <Component ref={ref} data-slot="tooltip-trigger" tabIndex={asChild ? undefined : (props.tabIndex ?? 0)} aria-describedby={[describedBy, id].filter(Boolean).join(" ")} className={cn("cursor-help", className)} {...props} />;
});

export interface TooltipContentProps extends React.HTMLAttributes<HTMLSpanElement> {
  side?: "top" | "right" | "bottom" | "left";
}

const TooltipContent = React.forwardRef<HTMLSpanElement, TooltipContentProps>(function TooltipContent(
  { className, side = "top", ...props },
  ref,
) {
  const { id } = useTooltipContext("TooltipContent");
  const positions = {
    top: "bottom-full left-1/2 mb-2 -translate-x-1/2",
    right: "left-full top-1/2 ml-2 -translate-y-1/2",
    bottom: "left-1/2 top-full mt-2 -translate-x-1/2",
    left: "right-full top-1/2 mr-2 -translate-y-1/2",
  };

  return (
    <span
      ref={ref}
      id={id}
      role="tooltip"
      data-slot="tooltip-content"
      data-side={side}
      className={cn("pointer-events-none invisible absolute z-50 w-max max-w-64 rounded-md bg-foreground px-3 py-1.5 text-xs text-background opacity-0 shadow-md transition-opacity group-hover/tooltip:visible group-hover/tooltip:opacity-100 group-focus-within/tooltip:visible group-focus-within/tooltip:opacity-100", positions[side], className)}
      {...props}
    />
  );
});

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent };
