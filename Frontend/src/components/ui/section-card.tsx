import * as React from "react";
import { cn } from "@/lib/utils";

export interface SectionCardProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  title?: React.ReactNode;
  viewAll?: React.ReactNode;
  description?: React.ReactNode;
}

function SectionCard({ title, viewAll, description, className, children, ...props }: SectionCardProps) {
  const hasHeader = title != null || viewAll != null || description != null;

  return (
    <section
      className={cn("min-w-0 rounded-[16px] border border-[#dfe5ef] bg-white p-4", className)}
      {...props}
    >
      {hasHeader && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title != null && <h2 className="font-heading text-[17px] font-extrabold leading-tight text-[#1d2438]">{title}</h2>}
            {description != null && <p className="mt-1 text-xs leading-relaxed text-muted">{description}</p>}
          </div>
          {viewAll}
        </header>
      )}
      {children}
    </section>
  );
}

export { SectionCard };
