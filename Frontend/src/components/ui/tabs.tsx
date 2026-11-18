import * as React from "react";
import { cn } from "@/lib/utils";

type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;
  baseId: string;
  orientation: "horizontal" | "vertical";
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext(componentName: string) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error(`${componentName} must be used inside <Tabs>.`);
  return context;
}

export interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: "horizontal" | "vertical";
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  { className, value: controlledValue, defaultValue = "", onValueChange, orientation = "horizontal", ...props },
  ref,
) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
  const baseId = React.useId();
  const value = controlledValue ?? uncontrolledValue;
  const setValue = React.useCallback((nextValue: string) => {
    if (controlledValue === undefined) setUncontrolledValue(nextValue);
    onValueChange?.(nextValue);
  }, [controlledValue, onValueChange]);

  return (
    <TabsContext.Provider value={{ value, setValue, baseId, orientation }}>
      <div ref={ref} data-slot="tabs" data-orientation={orientation} className={cn("flex min-w-0 flex-col gap-2", className)} {...props} />
    </TabsContext.Provider>
  );
});

const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function TabsList(
  { className, onKeyDown, ...props },
  ref,
) {
  const { orientation } = useTabsContext("TabsList");

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    const direction = orientation === "horizontal"
      ? event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0
      : event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
    const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)'));
    if (tabs.length === 0) return;

    let nextIndex = -1;
    if (direction !== 0) {
      const currentIndex = tabs.indexOf(document.activeElement as HTMLButtonElement);
      nextIndex = (currentIndex + direction + tabs.length) % tabs.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = tabs.length - 1;
    }

    if (nextIndex >= 0) {
      event.preventDefault();
      tabs[nextIndex].focus();
      tabs[nextIndex].click();
    }
  }

  return (
    <div
      ref={ref}
      role="tablist"
      aria-orientation={orientation}
      data-slot="tabs-list"
      onKeyDown={handleKeyDown}
      className={cn("inline-flex w-fit items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground", orientation === "vertical" && "h-fit flex-col items-stretch", className)}
      {...props}
    />
  );
});

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(function TabsTrigger(
  { className, value, disabled, onClick, ...props },
  ref,
) {
  const context = useTabsContext("TabsTrigger");
  const selected = context.value === value;
  const triggerId = `${context.baseId}-trigger-${value}`;

  return (
    <button
      ref={ref}
      id={triggerId}
      type="button"
      role="tab"
      aria-selected={selected}
      aria-controls={`${context.baseId}-panel-${value}`}
      tabIndex={selected ? 0 : -1}
      disabled={disabled}
      data-slot="tabs-trigger"
      data-state={selected ? "active" : "inactive"}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && !disabled) context.setValue(value);
      }}
      className={cn("inline-flex min-h-8 items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm", className)}
      {...props}
    />
  );
});

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  forceMount?: boolean;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(function TabsContent(
  { className, value, forceMount = false, ...props },
  ref,
) {
  const context = useTabsContext("TabsContent");
  const selected = context.value === value;
  if (!selected && !forceMount) return null;

  return (
    <div
      ref={ref}
      id={`${context.baseId}-panel-${value}`}
      role="tabpanel"
      aria-labelledby={`${context.baseId}-trigger-${value}`}
      tabIndex={0}
      hidden={!selected}
      data-slot="tabs-content"
      className={cn("min-w-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50", className)}
      {...props}
    />
  );
});

export { Tabs, TabsList, TabsTrigger, TabsContent };
