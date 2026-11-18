import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (value instanceof Map || value instanceof Set) return value.size === 0;
  if (typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    return (prototype === Object.prototype || prototype === null) && Object.keys(value).length === 0;
  }
  return false;
}

export function capitalize(value: string): string {
  if (!value) return "";
  return value.charAt(0).toLocaleUpperCase() + value.slice(1);
}

export function truncateText(value: string, maxLength: number, suffix = "…"): string {
  if (!Number.isFinite(maxLength) || maxLength <= 0) return "";
  if (value.length <= maxLength) return value;
  if (suffix.length >= maxLength) return suffix.slice(0, maxLength);
  return `${value.slice(0, maxLength - suffix.length).trimEnd()}${suffix}`;
}

export function generateId(prefix = ""): string {
  const identifier = typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return prefix ? `${prefix}${identifier}` : identifier;
}

export type DebouncedFunction<T extends (...args: never[]) => unknown> = ((...args: Parameters<T>) => void) & {
  cancel: () => void;
};

export function debounce<T extends (...args: never[]) => unknown>(callback: T, delayMs: number): DebouncedFunction<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const debounced = ((...args: Parameters<T>) => {
    if (timeout !== undefined) clearTimeout(timeout);
    timeout = setTimeout(() => {
      timeout = undefined;
      callback(...args);
    }, Math.max(0, delayMs));
  }) as DebouncedFunction<T>;

  debounced.cancel = () => {
    if (timeout !== undefined) clearTimeout(timeout);
    timeout = undefined;
  };

  return debounced;
}
