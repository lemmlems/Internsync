import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex min-h-6 items-center justify-center rounded-full px-2.5 text-xs font-semibold leading-none",
  {
    variants: {
      variant: {
        approved: "bg-green/10 text-green",
        pending: "bg-yellow/20 text-amber-800",
        returned: "bg-red/10 text-red",
        neutral: "bg-secondary text-muted-foreground",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {}

function StatusBadge({ className, variant, ...props }: StatusBadgeProps) {
  return <span className={cn(statusBadgeVariants({ variant }), className)} {...props} />;
}

export { StatusBadge, statusBadgeVariants };
