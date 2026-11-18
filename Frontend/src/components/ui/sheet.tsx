import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;

export interface SheetContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: "left" | "right" | "top" | "bottom";
  showClose?: boolean;
}

const sideClasses = {
  left: "inset-y-0 left-0 h-full w-[min(20rem,85vw)] border-r data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0",
  right: "inset-y-0 right-0 h-full w-[min(20rem,85vw)] border-l data-[state=closed]:translate-x-full data-[state=open]:translate-x-0",
  top: "inset-x-0 top-0 max-h-[85dvh] w-full border-b data-[state=closed]:-translate-y-full data-[state=open]:translate-y-0",
  bottom: "inset-x-0 bottom-0 max-h-[85dvh] w-full border-t data-[state=closed]:translate-y-full data-[state=open]:translate-y-0",
} as const;

const SheetContent = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, SheetContentProps>(function SheetContent(
  { className, children, side = "right", showClose = true, ...props },
  ref,
) {
  return (
    <SheetPortal>
      <DialogPrimitive.Overlay data-slot="sheet-overlay" className="fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=open]:animate-in" />
      <DialogPrimitive.Content
        ref={ref}
        data-slot="sheet-content"
        className={cn("fixed z-50 flex flex-col gap-4 overflow-y-auto bg-background p-6 text-foreground shadow-lg outline-none transition-transform duration-300 ease-in-out", sideClasses[side], className)}
        {...props}
      >
        {children}
        {showClose && (
          <DialogPrimitive.Close aria-label="Close panel" data-slot="sheet-close" className="absolute right-4 top-4 rounded-sm p-1 text-muted-foreground opacity-80 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none">
            <X aria-hidden="true" className="size-4" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </SheetPortal>
  );
});

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="sheet-header" className={cn("flex flex-col gap-2", className)} {...props} />;
}

function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="sheet-footer" className={cn("mt-auto flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />;
}

function SheetTitle({ className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title data-slot="sheet-title" className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />;
}

function SheetDescription({ className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description data-slot="sheet-description" className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export { Sheet, SheetTrigger, SheetClose, SheetPortal, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription };
