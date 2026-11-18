import * as React from "react";
import { ChevronDown, ChevronLeft, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SidebarNavItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  children?: SidebarNavItem[];
  onSelect?: () => void;
}

export interface SidebarProps extends Omit<React.HTMLAttributes<HTMLElement>, "children" | "title"> {
  items: SidebarNavItem[];
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  onNavigate?: (item: SidebarNavItem) => void;
}

function Sidebar({ className, items, collapsed: controlledCollapsed, defaultCollapsed = false, onCollapsedChange, open: controlledOpen, defaultOpen = false, onOpenChange, title = "Navigation", footer, onNavigate, ...props }: SidebarProps) {
  const [uncontrolledCollapsed, setUncontrolledCollapsed] = React.useState(defaultCollapsed);
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({});
  const collapsed = controlledCollapsed ?? uncontrolledCollapsed;
  const open = controlledOpen ?? uncontrolledOpen;

  const setCollapsed = (next: boolean) => {
    if (controlledCollapsed === undefined) setUncontrolledCollapsed(next);
    onCollapsedChange?.(next);
  };
  const setOpen = (next: boolean) => {
    if (controlledOpen === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  function selectItem(item: SidebarNavItem) {
    if (item.disabled) return;
    item.onSelect?.();
    onNavigate?.(item);
    setOpen(false);
  }

  function renderItems(entries: SidebarNavItem[], nested = false) {
    return entries.map((item) => {
      const hasChildren = Boolean(item.children?.length);
      const expanded = expandedGroups[item.label] ?? false;
      const sharedClassName = cn(
        "flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
        item.active && "bg-primary/10 text-primary",
        collapsed && "justify-center px-0",
        nested && "min-h-9 text-[13px]",
      );
      const icon = item.icon && <span className="grid size-5 shrink-0 place-items-center" aria-hidden="true">{item.icon}</span>;
      const label = <span className={cn("min-w-0 flex-1 truncate", collapsed && "sr-only")}>{item.label}</span>;

      return (
        <li key={item.label} className="min-w-0">
          {hasChildren ? (
            <button
              type="button"
              className={sharedClassName}
              aria-expanded={expanded}
              aria-label={collapsed ? item.label : undefined}
              title={collapsed ? item.label : undefined}
              disabled={item.disabled}
              onClick={() => {
                if (collapsed) setCollapsed(false);
                setExpandedGroups((current) => ({ ...current, [item.label]: !expanded }));
              }}
            >
              {icon}{label}
              {!collapsed && <ChevronDown aria-hidden="true" className={cn("size-4 shrink-0 transition-transform", expanded && "rotate-180")} />}
            </button>
          ) : (
            <a
              href={item.href ?? "#"}
              className={sharedClassName}
              aria-current={item.active ? "page" : undefined}
              aria-label={collapsed ? item.label : undefined}
              title={collapsed ? item.label : undefined}
              aria-disabled={item.disabled || undefined}
              tabIndex={item.disabled ? -1 : undefined}
              onClick={(event) => {
                if (item.disabled || !item.href) event.preventDefault();
                selectItem(item);
              }}
            >
              {icon}{label}
            </a>
          )}
          {hasChildren && expanded && !collapsed && (
            <ul className="mt-1 grid gap-1 pl-4" aria-label={`${item.label} submenu`}>
              {renderItems(item.children ?? [], true)}
            </ul>
          )}
        </li>
      );
    });
  }

  return (
    <>
      {open && <button type="button" aria-label="Close navigation" className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setOpen(false)} />}
      <button
        type="button"
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        className="fixed left-4 top-4 z-[60] grid size-10 place-items-center rounded-md border border-border bg-background text-foreground shadow-sm md:hidden"
        onClick={() => setOpen(!open)}
      >
        {open ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
      </button>
      <aside
        data-slot="sidebar"
        data-collapsed={collapsed}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card text-card-foreground shadow-sm transition-[width,transform] duration-200 md:translate-x-0",
          collapsed && "md:w-16",
          open ? "translate-x-0" : "-translate-x-full",
          className,
        )}
        {...props}
      >
        <div className="flex min-h-14 items-center justify-between gap-2 border-b border-border px-4">
          {!collapsed && <div className="min-w-0 truncate text-sm font-semibold">{title}</div>}
          <button type="button" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed} className="hidden size-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:grid" onClick={() => setCollapsed(!collapsed)}>
            <ChevronLeft aria-hidden="true" className={cn("size-4 transition-transform", collapsed && "rotate-180")} />
          </button>
          <button type="button" aria-label="Close navigation" className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:hidden" onClick={() => setOpen(false)}>
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
        <nav aria-label={typeof title === "string" ? title : "Sidebar"} className="min-h-0 flex-1 overflow-y-auto p-3">
          <ul className="grid gap-1">{renderItems(items)}</ul>
        </nav>
        {footer && <div className={cn("border-t border-border p-3", collapsed && "md:px-2")}>{footer}</div>}
      </aside>
    </>
  );
}

export { Sidebar };
