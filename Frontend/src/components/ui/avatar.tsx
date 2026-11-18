import * as React from "react";
import { cn } from "@/lib/utils";

export type AvatarSize = "sm" | "default" | "lg" | "xl";

export interface AvatarProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  src?: string;
  alt?: string;
  initials?: string;
  size?: AvatarSize;
  fallback?: React.ReactNode;
}

const avatarSizes: Record<AvatarSize, string> = {
  sm: "size-7 text-[10px]",
  default: "size-9 text-xs",
  lg: "size-12 text-sm",
  xl: "size-16 text-base",
};

const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  { className, src, alt = "User avatar", initials, size = "default", fallback, ...props },
  ref,
) {
  const [imageFailed, setImageFailed] = React.useState(false);

  React.useEffect(() => setImageFailed(false), [src]);

  const fallbackContent = fallback ?? initials ?? alt.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return (
    <span
      ref={ref}
      data-slot="avatar"
      role="img"
      aria-label={alt}
      className={cn("relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary font-semibold text-secondary-foreground", avatarSizes[size], className)}
      {...props}
    >
      {src && !imageFailed ? (
        <img src={src} alt="" className="size-full object-cover" onError={() => setImageFailed(true)} />
      ) : (
        <span aria-hidden="true">{fallbackContent}</span>
      )}
    </span>
  );
});

export { Avatar };
