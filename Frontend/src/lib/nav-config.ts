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
    { page: "classroom", label: "Classroom", icon: LayoutDashboard },
    { page: "review", label: "Review submissions", icon: ClipboardList },
  ],
  spards: [
    { page: "classroom", label: "Overview", icon: BookOpenText },
    { page: "documents", label: "Documents", icon: Files },
  ],
};
