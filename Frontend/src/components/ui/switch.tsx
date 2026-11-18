import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { className, id, label, disabled, ...props },
  ref,
) {
  const generatedId = React.useId();
  const switchId = id ?? generatedId;

  return (
    <span className="inline-flex items-center gap-2.5">
      <input
        ref={ref}
        id={switchId}
        type="checkbox"
        role="switch"
        data-slot="switch"
        disabled={disabled}
        className={cn(
          "peer relative h-5 w-9 shrink-0 cursor-pointer appearance-none rounded-full border border-transparent bg-input transition-colors checked:bg-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 after:absolute after:left-0.5 after:top-0.5 after:size-4 after:rounded-full after:bg-background after:shadow-sm after:transition-transform checked:after:translate-x-4 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
      {label && <label className={cn("cursor-pointer text-sm font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-50", disabled && "cursor-not-allowed opacity-50")} htmlFor={switchId}>{label}</label>}
    </span>
  );
});

export { Switch };
