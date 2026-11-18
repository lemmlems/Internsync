import * as React from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "checked" | "defaultChecked"> {
  checked?: boolean | "indeterminate";
  defaultChecked?: boolean | "indeterminate";
  label?: React.ReactNode;
  indeterminate?: boolean;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, id, label, checked, defaultChecked, indeterminate = false, disabled, ...props },
  forwardedRef,
) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const inputRef = React.useRef<HTMLInputElement>(null);
  const isIndeterminate = indeterminate || checked === "indeterminate" || defaultChecked === "indeterminate";

  React.useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = isIndeterminate;
  }, [isIndeterminate]);

  const setRefs = (node: HTMLInputElement | null) => {
    inputRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };

  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative grid size-4 shrink-0 place-items-center">
        <input
          ref={setRefs}
          id={inputId}
          type="checkbox"
          data-slot="checkbox"
          checked={checked === "indeterminate" ? false : checked}
          defaultChecked={defaultChecked === "indeterminate" ? false : defaultChecked}
          disabled={disabled}
          className={cn(
            "peer col-start-1 row-start-1 size-4 cursor-pointer appearance-none rounded-[4px] border border-input bg-background transition-colors checked:border-primary checked:bg-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 indeterminate:border-primary indeterminate:bg-primary disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        />
        <Check aria-hidden="true" className="pointer-events-none absolute size-3 text-primary-foreground opacity-0 peer-checked:opacity-100" />
        <Minus aria-hidden="true" className="pointer-events-none absolute size-3 text-primary-foreground opacity-0 peer-indeterminate:opacity-100" />
      </span>
      {label && <label className={cn("cursor-pointer text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50", disabled && "cursor-not-allowed opacity-50")} htmlFor={inputId}>{label}</label>}
    </span>
  );
});

export { Checkbox };
