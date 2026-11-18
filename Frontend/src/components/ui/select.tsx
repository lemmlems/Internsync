import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: React.ReactNode;
  error?: React.ReactNode;
  helperText?: React.ReactNode;
  placeholder?: string;
  options?: SelectOption[];
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, id, label, error, helperText, placeholder, options, children, "aria-describedby": describedBy, "aria-invalid": ariaInvalid, ...props },
  ref,
) {
  const generatedId = React.useId();
  const selectId = id ?? generatedId;
  const messageId = `${selectId}-message`;
  const hasMessage = Boolean(error || helperText);

  return (
    <div className="grid w-full gap-1.5">
      {label && <label className="text-sm font-medium text-foreground" htmlFor={selectId}>{label}</label>}
      <span className="relative block">
        <select
          ref={ref}
          id={selectId}
          data-slot="select"
          aria-invalid={error ? true : ariaInvalid}
          aria-describedby={[describedBy, hasMessage ? messageId : undefined].filter(Boolean).join(" ") || undefined}
          className={cn(
            "border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive flex h-9 w-full appearance-none rounded-md border bg-background py-1 pl-3 pr-9 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options?.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>
          ))}
          {children}
        </select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      </span>
      {hasMessage && (
        <p id={messageId} className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")} role={error ? "alert" : undefined}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

export { Select };
