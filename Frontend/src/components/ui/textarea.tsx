import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  error?: React.ReactNode;
  helperText?: React.ReactNode;
  resize?: "none" | "vertical" | "horizontal" | "both";
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, id, label, error, helperText, rows = 4, resize = "vertical", "aria-describedby": describedBy, "aria-invalid": ariaInvalid, ...props },
  ref,
) {
  const generatedId = React.useId();
  const textareaId = id ?? generatedId;
  const messageId = `${textareaId}-message`;
  const hasMessage = Boolean(error || helperText);

  return (
    <div className="grid w-full gap-1.5">
      {label && <label className="text-sm font-medium text-foreground" htmlFor={textareaId}>{label}</label>}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        data-slot="textarea"
        aria-invalid={error ? true : ariaInvalid}
        aria-describedby={[describedBy, hasMessage ? messageId : undefined].filter(Boolean).join(" ") || undefined}
        className={cn(
          "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 flex min-h-20 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          resize === "none" ? "resize-none" : resize === "horizontal" ? "resize-x" : resize === "both" ? "resize" : "resize-y",
          className,
        )}
        {...props}
      />
      {hasMessage && (
        <p id={messageId} className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")} role={error ? "alert" : undefined}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

export { Textarea };
