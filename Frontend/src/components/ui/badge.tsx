import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex min-h-6 items-center justify-center whitespace-nowrap rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold leading-none transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        success: "bg-green/10 text-green",
        warning: "bg-yellow/20 text-amber-800",
        destructive: "bg-destructive/10 text-destructive",
        outline: "border-border bg-transparent text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(function Badge({ className, variant, ...props }, ref) {
  return <span ref={ref} data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
});

export { Badge, badgeVariants };
