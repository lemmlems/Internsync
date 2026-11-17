import { cn } from "@/lib/utils";

export interface ProgressBarProps {
  value: number;
  className?: string;
  barClassName?: string;
  label?: string;
}

function ProgressBar({ value, className, barClassName, label }: ProgressBarProps) {
  const progress = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;

  return (
    <div
      className={cn("h-2 overflow-hidden rounded-full bg-secondary", className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
    >
      <div
        className={cn("h-full rounded-full bg-primary transition-[width]", barClassName)}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export { ProgressBar };
