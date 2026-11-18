import * as React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shape?: "text" | "circle" | "rectangle";
}

const shapeClasses = {
  text: "h-4 w-full rounded",
  circle: "size-10 rounded-full",
  rectangle: "min-h-10 w-full rounded-md",
} as const;

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { className, shape = "rectangle", ...props },
  ref,
) {
  return <div ref={ref} aria-hidden="true" data-slot="skeleton" className={cn("animate-pulse bg-muted", shapeClasses[shape], className)} {...props} />;
});

export { Skeleton };
