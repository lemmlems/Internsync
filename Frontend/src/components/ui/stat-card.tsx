import * as React from "react";
import { cn } from "@/lib/utils";

export interface StatCardProps extends React.HTMLAttributes<HTMLElement> {
  label: React.ReactNode;
  value: React.ReactNode;
  caption?: React.ReactNode;
  icon?: React.ReactNode;
}

function StatCard({ label, value, caption, icon, className, ...props }: StatCardProps) {
  return (
    <article
      className={cn("min-w-0 rounded-[16px] border border-[#dfe5ef] border-t-4 border-t-primary bg-white p-4", className)}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-semibold uppercase tracking-[0.02em] text-[#58657d]">{label}</p>
        {icon && <span className="shrink-0 text-primary" aria-hidden="true">{icon}</span>}
      </div>
      <div className="mt-3 text-[18px] font-bold leading-tight text-[#1d2438]">{value}</div>
      {caption != null && <div className="mt-2 text-[12px] leading-relaxed text-[#73809a]">{caption}</div>}
    </article>
  );
}

export { StatCard };
