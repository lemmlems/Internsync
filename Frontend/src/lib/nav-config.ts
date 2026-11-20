import {
  BriefcaseBusiness,
  BookOpenText,
  ClipboardList,
  Files,
  LayoutDashboard,
  type LucideIcon,
  Users,
} from "lucide-react";

export type AppRole = "student" | "adviser" | "spards";

export interface NavItem {
  page: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS_BY_ROLE: Record<AppRole, NavItem[]> = {
  student: [
    { page: "student-dashboard", label: "Dashboard", icon: LayoutDashboard },
    { page: "requirements-progress", label: "Requirements Progress", icon: ClipboardList },
    { page: "partner-companies", label: "Partner Companies", icon: BriefcaseBusiness },
    { page: "my-ojt", label: "My OJT", icon: Users },
    { page: "moa-moa", label: "MOU/MOA", icon: Files },
    { page: "reflection", label: "Reflection", icon: BookOpenText },
  ],
  adviser: [
    { page: "adviser-dashboard", label: "Dashboard", icon: LayoutDashboard },
    { page: "sections", label: "Section", icon: Users },
    { page: "monitoring-overview", label: "Monitoring Overview", icon: ClipboardList },
    { page: "report", label: "Report", icon: Files },
  ],
  spards: [
    { page: "spards-dashboard", label: "Dashboard", icon: LayoutDashboard },
    { page: "documents", label: "Documents", icon: Files },
  ],
};

export const HOME_PAGE_BY_ROLE: Record<AppRole, string> = {
  student: "student-dashboard",
  adviser: "adviser-dashboard",
  spards: "spards-dashboard",
};
