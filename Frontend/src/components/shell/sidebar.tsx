import { useState } from "react";
import { BookOpenText, Briefcase, ClipboardList, FileText, LayoutDashboard, LogOut, Users } from "lucide-react";

const navItems = [
  { page: "student-dashboard", label: "Dashboard", icon: LayoutDashboard },
  { page: "requirements-progress", label: "Requirements Progress", icon: ClipboardList },
  { page: "partner-companies", label: "Partner Companies", icon: Briefcase },
  { page: "my-ojt", label: "My OJT", icon: Users },
  { page: "moa-moa", label: "MOU/MOA", icon: FileText },
  { page: "reflection", label: "Reflection", icon: BookOpenText },
];

export default function Sidebar() {
  const [activeItem, setActiveItem] = useState("Dashboard");

  return (
    <aside
      className="fixed inset-y-0 left-0 z-40 [transform:translateX(-100%)] flex w-[250px] flex-col overflow-y-auto bg-[#11177f] text-white shadow-[0_0_20px_rgba(15,28,109,0.15)] [&.open]:[transform:translateX(0)] transition-none lg:[transform:translateX(0)]"
      id="sidebar"
    >
      <img
        className="pointer-events-none absolute bottom-16 right-[-48px] z-0 size-[200px] opacity-[0.06]"
        src="/InternSync_Logo.png"
        alt=""
        aria-hidden="true"
      />
      <div className="relative z-20 flex h-[184px] shrink-0 flex-col items-center justify-center bg-[#f0efef] px-4 text-center">
        <img
          className="pointer-events-none absolute inset-x-0 top-[28px] z-0 h-[250px] w-full object-fill"
          src="/Sidebar%20Art.svg"
          alt=""
          aria-hidden="true"
        />
        <a
          className="absolute left-1/2 top-6 z-10 m-0 flex h-auto -translate-x-1/2 flex-col items-center gap-1 text-navy no-underline"
          href="#"
          data-page="dashboard"
          aria-label="InternSync dashboard"
        >
          <img className="h-[48px] w-[48px] object-contain" src="/InternSync_Logo.png" alt="" />
          <span className="font-heading text-[1.5rem] font-extrabold leading-[1.1] tracking-[-0.04em]">InternSync</span>
          <small className="mt-0.5 text-[8px] font-medium tracking-[0.14em] text-[#6d7ca4] uppercase">Quezon City University</small>
        </a>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-4 pb-4 pt-[48px]">
        <nav className="main-nav relative grid gap-1 pt-1" aria-label="Main navigation">
          {navItems.map(({ page, label, icon: Icon }) => {
            const isActive = activeItem === label;

            return (
              <button
                key={label}
                type="button"
                data-page={page}
                onClick={() => setActiveItem(label)}
                className={[
                  "flex items-center gap-3 rounded-lg border-l-2 px-3 py-2 text-left text-[14px] font-medium transition-colors duration-150",
                  isActive
                    ? "border-[#f2d51d] bg-[#ffffff1a] pl-[10px] text-white"
                    : "border-transparent text-white/75 hover:border-[#f2d51d]/70 hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                <span className="grid size-4 place-items-center text-white/90">
                  <Icon size={13} aria-hidden="true" />
                </span>
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom mt-auto pt-6">
          <button
            className="profile-card flex w-full items-center gap-3 border-0 bg-transparent px-1 py-3 text-left text-white"
            id="profile-button"
            type="button"
          >
            <span className="avatar avatar-navy grid size-8 shrink-0 place-items-center rounded-full bg-white/15 text-[11px] font-bold text-white" id="profile-initials">
              JD
            </span>
            <span className="profile-copy grid min-w-0 flex-1 gap-0.5">
              <strong className="truncate text-sm" id="profile-name">Juan Dela Cruz</strong>
              <small className="truncate text-[10px] text-white/65" id="profile-role">QCU Student</small>
            </span>
          </button>
          <button
            className="logout-button mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-transparent px-3 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/10"
            id="logout-button"
            type="button"
          >
            <LogOut size={16} aria-hidden="true" />
            Log out
          </button>
        </div>
      </div>
    </aside>
  );
}
