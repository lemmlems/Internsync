import * as React from "react";
import { cn } from "@/lib/utils";

export interface NotificationItemProps extends Omit<React.HTMLAttributes<HTMLLIElement>, "title"> {
  title: React.ReactNode;
  text: React.ReactNode;
  time: React.ReactNode;
}

function NotificationItem({ title, text, time, className, ...props }: NotificationItemProps) {
  return (
    <li className={cn("flex min-w-0 items-start justify-between gap-3 border-b border-slate-200 py-3 last:border-b-0", className)} {...props}>
      <div className="min-w-0 pr-3">
        <h3 className="text-[15px] font-semibold text-[#1d2438]">{title}</h3>
        <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[#65718a]">{text}</p>
      </div>
      <time className="shrink-0 pt-1 text-[11px] text-[#7c879c]">{time}</time>
    </li>
  );
}

export { NotificationItem };
