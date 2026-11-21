import { useEffect, useState } from "react";
import { Bell, ChevronDown, LogOut, Menu, UserRound } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ProfileReminder = {
  title: string;
  detail: string;
  time: string;
};

function getProfileReminder(): ProfileReminder | null {
  const sessionValue = sessionStorage.getItem("internsync-auth-session");
  if (!sessionValue) return null;

  let session;
  try {
    session = JSON.parse(sessionValue);
  } catch (error) {
    console.error("Could not read the active session for profile reminders.", error);
    return null;
  }
  if (session?.role !== "student" || !session.email) return null;

  const profileValue = localStorage.getItem(`internsync-student-profile:${session.email.toLowerCase()}`);
  let profile: { phone?: unknown; address?: unknown } = {};
  if (profileValue) {
    try {
      profile = JSON.parse(profileValue);
    } catch (error) {
      console.error("Could not read the saved student profile for reminders.", error);
      return {
        title: "Review your profile",
        detail: "Open My Profile and check that your information is complete.",
        time: "Action needed",
      };
    }
  }

  const missingFields = [
    { label: "contact number", value: profile.phone },
    { label: "home address", value: profile.address },
  ].filter(({ value }) => typeof value !== "string" || !value.trim());

  if (!missingFields.length) return null;
  const missing = missingFields.map(({ label }) => label);
  const missingText = missing.length === 2 ? `${missing[0]} and ${missing[1]}` : missing[0];
  return {
    title: "Complete your profile",
    detail: `Add your ${missingText} in My Profile.`,
    time: "Action needed",
  };
}

export default function Topbar() {
  const [account, setAccount] = useState(() => {
    try {
      const session = JSON.parse(sessionStorage.getItem("internsync-auth-session") || "null");
      return {
        initials: session?.initials || "",
        name: session?.name || "",
        role: session?.role === "student" ? "Student" : session?.title || "OJT Adviser",
        photo: "",
      };
    } catch {
      return { initials: "", name: "", role: "", photo: "" };
    }
  });
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [avatarPhoto, setAvatarPhoto] = useState("");
  const [avatarInitials, setAvatarInitials] = useState("SR");
  const [profileReminder, setProfileReminder] = useState<ProfileReminder | null>(null);
  const notifications = [
    { title: "Internship Agreement", detail: "Your internship agreement was returned for revision.", time: "2h" },
    { title: "Endorsement Letter approved", detail: "Your endorsement letter has been approved by your adviser.", time: "10h" },
    { title: "Weekly report due tomorrow", detail: "Submit your weekly report by 8:00 AM.", time: "1d" },
    { title: "MOU revision updated", detail: "Your MOU document needs corrections.", time: "3d" },
  ];

  useEffect(() => {
    const updateProfileReminder = () => setProfileReminder(getProfileReminder());
    const handleProfileAvatarUpdate = (event: Event) => {
      const profileEvent = event as CustomEvent<{ profilePhoto?: string; initials?: string }>;
      setAvatarPhoto(profileEvent.detail?.profilePhoto || "");
      setAvatarInitials(profileEvent.detail?.initials || "SR");
    };

    updateProfileReminder();
    window.addEventListener("internsync-student-profile-updated", updateProfileReminder);
    window.addEventListener("storage", updateProfileReminder);
    window.addEventListener("internsync-profile-avatar-updated", handleProfileAvatarUpdate);
    return () => {
      window.removeEventListener("internsync-student-profile-updated", updateProfileReminder);
      window.removeEventListener("storage", updateProfileReminder);
      window.removeEventListener("internsync-profile-avatar-updated", handleProfileAvatarUpdate);
    };
  }, []);

  const visibleNotifications = profileReminder ? [profileReminder, ...notifications] : notifications;
  const unreadCount = visibleNotifications.length;

  return (
    <header className="topbar sticky top-0 z-30 flex h-[76px] items-center justify-between gap-2 border-b border-[#dfe5ef] bg-[#f6f7fb] px-3 md:gap-3 md:px-6">
      <button
        type="button"
        id="mobile-menu"
        className="mobile-menu grid size-9 shrink-0 place-items-center border-0 bg-transparent p-0 lg:hidden"
        aria-label="Open navigation menu"
        aria-controls="sidebar"
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      <div className="workspace-heading min-w-0 flex-1">
        <h1 className="m-0 truncate font-heading text-[18px] font-extrabold leading-none tracking-[-0.03em] text-[#1d2438] md:text-[20px]" id="workspace-heading">
          OJT Student Dashboard
        </h1>
        <p className="mt-1 text-[12px] font-medium text-[#6c788d]" id="workspace-subtitle">
          Quezon City University Internship Management System
        </p>
      </div>

      <div className="topbar-actions flex shrink-0 items-center gap-2 sm:gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="icon-button notification-button relative grid size-9 place-items-center border-0 bg-transparent text-[#4a5368] shadow-none"
              aria-label={`Notifications, ${unreadCount} unread`}
              type="button"
            >
              <Bell size={16} aria-hidden="true" />
              <span className="absolute -right-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full border-2 border-[#f6f7fb] bg-[#ed3a4a] px-0.5 text-[9px] font-bold leading-none text-white" aria-hidden="true">{unreadCount}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-[min(360px,calc(100vw-24px))] rounded-xl border-[#dfe5ef] bg-white p-2 text-[#1d2438] shadow-lg">
            <DropdownMenuLabel className="flex items-center justify-between px-2 py-1.5">
              <span className="text-sm font-semibold">Notifications</span>
              <span className="text-xs font-medium text-[#6c788d]">{unreadCount} unread</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1 bg-[#e9edf4]" />
            {visibleNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.title}
                data-page={notification === profileReminder ? "student-profile" : undefined}
                className="items-start rounded-lg px-2 py-2.5 focus:bg-[#f4f6fb]"
              >
                <span className={`mt-1 size-2 shrink-0 rounded-full ${notification === profileReminder ? "bg-[#ed9c26]" : "bg-[#ed3a4a]"}`} aria-hidden="true" />
                <span className="grid min-w-0 flex-1 gap-1">
                  <span className="truncate text-sm font-semibold">{notification.title}</span>
                  <span className="line-clamp-2 text-xs leading-relaxed text-[#65718a]">{notification.detail}</span>
                </span>
                <span className="shrink-0 text-[10px] text-[#7c879c]">{notification.time}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="topbar-action-divider h-8 w-px bg-[#c9cbd0]" aria-hidden="true" />

        <DropdownMenu
          open={accountMenuOpen}
          onOpenChange={(open) => {
            setAccountMenuOpen(open);
            if (open) {
              setAccount({
                initials: avatarInitials,
                name: document.getElementById("topbar-name")?.textContent || "",
                role: document.getElementById("topbar-role")?.textContent || "",
                photo: avatarPhoto,
              });
            }
          }}
        >
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="top-profile flex items-center gap-2 border-0 bg-transparent p-0 text-left"
              aria-label={accountMenuOpen ? "Close account menu" : "Open account menu"}
            >
              <span
                className="top-avatar grid size-8 shrink-0 place-items-center rounded-full bg-[#e9ebfb] text-[11px] font-bold text-[#1d2438]"
                id="topbar-avatar"
                aria-hidden="true"
              >
                {avatarPhoto ? <img className="size-full rounded-full object-cover" src={avatarPhoto} alt="" /> : avatarInitials}
              </span>
              <span className="top-profile-copy min-w-0 text-left">
                <span className="text-[12px] font-semibold leading-none text-[#1d2438]" id="topbar-name">Sofia Reyes</span>
                <span className="mt-0.5 text-[10px] leading-none text-[#6c788d]" id="topbar-role">Student</span>
              </span>
              <span
                className="top-profile-chevron-trigger grid size-8 place-items-center text-[#6c788d]"
                aria-hidden="true"
              >
                <ChevronDown
                  size={14}
                  className={`top-profile-chevron transition-transform duration-200 ${accountMenuOpen ? "rotate-180" : "rotate-0"}`}
                />
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-56 rounded-xl border-[#dfe5ef] bg-white p-1.5 text-[#1d2438] shadow-lg">
            <DropdownMenuLabel className="flex items-center gap-3 px-2.5 py-2.5 font-normal">
              <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[#e9ebfb] text-xs font-bold text-[#1d2438]">
                {account.photo ? <img className="size-full object-cover" src={account.photo} alt="" /> : account.initials || "U"}
              </span>
              <span className="grid min-w-0 gap-1">
                <span className="truncate text-sm font-semibold">{account.name || "Account"}</span>
                <span className="truncate text-xs text-[#6c788d]">{account.role}</span>
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1 bg-[#e9edf4]" />
            <DropdownMenuItem data-page={account.role === "OJT Adviser" || account.role.includes("Adviser") ? "adviser-profile" : "student-profile"} className="cursor-pointer rounded-lg px-2.5 py-2 text-sm focus:bg-[#f1f3fa]">
              <UserRound size={15} aria-hidden="true" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem id="logout-button" className="cursor-pointer rounded-lg px-2.5 py-2 text-sm text-[#d33445] focus:bg-[#fff1f2] focus:text-[#d33445]">
              <LogOut size={15} aria-hidden="true" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
