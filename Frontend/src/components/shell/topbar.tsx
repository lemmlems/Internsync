import { Bell } from "lucide-react";

export default function Topbar() {
  return (
    <header className="topbar sticky top-0 z-30 flex h-[76px] items-center justify-between gap-3 border-b border-[#dfe5ef] bg-[#f6f7fb] px-4 md:px-6">
      <div className="workspace-heading min-w-0 flex-1">
        <h1 className="m-0 truncate font-heading text-[18px] font-extrabold leading-none tracking-[-0.03em] text-[#1d2438] md:text-[20px]" id="workspace-heading">
          OJT Student Dashboard
        </h1>
        <p className="mt-1 text-[12px] font-medium text-[#6c788d]" id="workspace-subtitle">
          Quezon City University Internship Management System
        </p>
      </div>

      <div className="topbar-actions flex shrink-0 items-center gap-2 sm:gap-3">
        <button
          className="icon-button notification-button relative grid size-9 place-items-center rounded-lg border border-[#dfe5ef] bg-white text-[#4a5368] shadow-sm transition hover:bg-slate-50"
          aria-label="Notifications"
          type="button"
        >
          <Bell size={16} aria-hidden="true" />
          <i className="absolute right-1.5 top-1.5 size-2 rounded-full border border-white bg-[#ed3a4a]" />
        </button>

        <div className="top-profile flex items-center gap-2 rounded-lg border border-[#dfe5ef] bg-white px-2 py-1.5 shadow-sm">
          <button
            className="top-avatar grid size-8 shrink-0 place-items-center rounded-full bg-[#e9ebfb] text-[11px] font-bold text-[#1d2438]"
            id="topbar-avatar"
            aria-label="Account"
            type="button"
          >
            JP
          </button>
          <div className="top-profile-copy hidden min-w-0 text-left sm:block">
            <div className="text-[12px] font-semibold leading-none text-[#1d2438]">Janna Perez</div>
            <div className="mt-0.5 text-[10px] leading-none text-[#6c788d]">Student</div>
          </div>
          <span className="hidden text-[#6c788d] sm:inline" aria-hidden="true">⌄</span>
        </div>
      </div>
    </header>
  );
}
