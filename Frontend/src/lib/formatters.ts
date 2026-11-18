import { DATE_TIME_CONFIG } from "@/lib/constants";

export type DateValue = Date | string | number | null | undefined;

function toValidDate(value: DateValue): Date | null {
  if (value == null || value === "") return null;
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(
  value: DateValue,
  options: Intl.DateTimeFormatOptions = DATE_TIME_CONFIG.dateOptions,
  locale = DATE_TIME_CONFIG.locale,
): string {
  const date = toValidDate(value);
  return date ? new Intl.DateTimeFormat(locale, options).format(date) : "";
}

export function formatDateTime(
  value: DateValue,
  options: Intl.DateTimeFormatOptions = DATE_TIME_CONFIG.dateTimeOptions,
  locale = DATE_TIME_CONFIG.locale,
): string {
  const date = toValidDate(value);
  return date ? new Intl.DateTimeFormat(locale, options).format(date) : "";
}

export function formatCurrency(
  value: number,
  currency = DATE_TIME_CONFIG.currency,
  locale = DATE_TIME_CONFIG.locale,
): string {
  if (!Number.isFinite(value)) return "";
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
}

export function formatNumber(value: number, locale = DATE_TIME_CONFIG.locale): string {
  if (!Number.isFinite(value)) return "";
  return new Intl.NumberFormat(locale).format(value);
}

export function formatPercentage(
  value: number,
  maximumFractionDigits = 1,
  locale = DATE_TIME_CONFIG.locale,
): string {
  if (!Number.isFinite(value)) return "";
  return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits }).format(value / 100);
}

export function formatRelativeTime(value: DateValue, now: DateValue = Date.now(), locale = DATE_TIME_CONFIG.locale): string {
  const date = toValidDate(value);
  const currentDate = toValidDate(now);
  if (!date || !currentDate) return "";

  const differenceSeconds = (date.getTime() - currentDate.getTime()) / 1000;
  const absoluteSeconds = Math.abs(differenceSeconds);
  const units: ReadonlyArray<{ limit: number; seconds: number; unit: Intl.RelativeTimeFormatUnit }> = [
    { limit: 60, seconds: 1, unit: "second" },
    { limit: 3600, seconds: 60, unit: "minute" },
    { limit: 86400, seconds: 3600, unit: "hour" },
    { limit: 604800, seconds: 86400, unit: "day" },
    { limit: 2629800, seconds: 604800, unit: "week" },
    { limit: 31557600, seconds: 2629800, unit: "month" },
    { limit: Number.POSITIVE_INFINITY, seconds: 31557600, unit: "year" },
  ];
  const selectedUnit = units.find(({ limit }) => absoluteSeconds < limit) ?? units[units.length - 1];
  const amount = Math.round(differenceSeconds / selectedUnit.seconds);

  return new Intl.RelativeTimeFormat(locale, DATE_TIME_CONFIG.relativeTime).format(amount, selectedUnit.unit);
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB", "TB"] as const;
  let size = bytes;
  let unitIndex = -1;
  do {
    size /= 1024;
    unitIndex += 1;
  } while (size >= 1024 && unitIndex < units.length - 1);

  return `${new Intl.NumberFormat(DATE_TIME_CONFIG.locale, { maximumFractionDigits: 2 }).format(size)} ${units[unitIndex]}`;
}

export function formatPhoneNumber(value: string | null | undefined): string {
  if (!value) return "";

  const digits = value.replace(/\D/g, "");
  const nationalNumber = digits.startsWith("0063")
    ? digits.slice(4)
    : digits.startsWith("63")
      ? digits.slice(2)
      : digits.startsWith("0")
        ? digits.slice(1)
        : digits;

  if (!/^9\d{9}$/.test(nationalNumber)) return value.trim();
  return `+63 ${nationalNumber.slice(0, 3)} ${nationalNumber.slice(3, 6)} ${nationalNumber.slice(6)}`;
}
