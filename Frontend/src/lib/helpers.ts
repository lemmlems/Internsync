import { APPLICATION_STATUSES, DOCUMENT_STATUSES } from "@/lib/constants";
import type { DateValue } from "@/lib/formatters";

export function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return "";
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase();
}

export function getFullName(
  firstName: string | null | undefined,
  middleName: string | null | undefined,
  lastName: string | null | undefined,
): string {
  return [firstName, middleName, lastName].filter((part): part is string => Boolean(part?.trim())).map((part) => part.trim()).join(" ");
}

export type StatusColor = "success" | "warning" | "destructive" | "info" | "neutral";

export function getStatusColor(status: string | null | undefined): StatusColor {
  const normalizedStatus = status?.trim().toLowerCase();
  if (!normalizedStatus) return "neutral";

  if ([APPLICATION_STATUSES.approved, APPLICATION_STATUSES.accepted, APPLICATION_STATUSES.active, "verified", "ongoing"].map((item) => item.toLowerCase()).includes(normalizedStatus)) {
    return "success";
  }
  if ([APPLICATION_STATUSES.pending, APPLICATION_STATUSES.underReview, DOCUMENT_STATUSES.pendingAdviserReview].map((item) => item.toLowerCase()).includes(normalizedStatus)) {
    return "warning";
  }
  if ([APPLICATION_STATUSES.rejected, APPLICATION_STATUSES.returned, DOCUMENT_STATUSES.needsRevision].map((item) => item.toLowerCase()).includes(normalizedStatus)) {
    return "destructive";
  }
  if (normalizedStatus === DOCUMENT_STATUSES.submittedToSpards.toLowerCase()) return "info";
  return "neutral";
}

export function getStatusLabel(status: string | null | undefined): string {
  if (!status?.trim()) return "";
  const normalizedStatus = status.trim().toLowerCase();
  const knownStatuses = [...Object.values(APPLICATION_STATUSES), ...Object.values(DOCUMENT_STATUSES)];
  const matchingStatus = knownStatuses.find((knownStatus) => knownStatus.toLowerCase() === normalizedStatus);
  const trimmedStatus = status.trim();
  if (!matchingStatus && /^[A-Z\d/_-]+$/.test(trimmedStatus)) return trimmedStatus;
  const label = matchingStatus ?? trimmedStatus;
  return label.replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase());
}

export function groupBy<T, K extends PropertyKey>(items: readonly T[], getKey: (item: T) => K): Map<K, T[]> {
  const groups = new Map<K, T[]>();
  for (const item of items) {
    const key = getKey(item);
    const group = groups.get(key);
    if (group) group.push(item);
    else groups.set(key, [item]);
  }
  return groups;
}

function toTimestamp(value: DateValue): number | null {
  if (value == null || value === "") return null;
  const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function isDateValue(value: unknown): value is DateValue {
  return value instanceof Date || typeof value === "string" || typeof value === "number" || value == null;
}

export function sortByDate<T>(
  items: readonly T[],
  getDate: keyof T | ((item: T) => DateValue),
  direction: "asc" | "desc" = "asc",
): T[] {
  const multiplier = direction === "asc" ? 1 : -1;
  return items
    .map((item, index) => {
      const value = typeof getDate === "function" ? getDate(item) : item[getDate];
      const dateValue = isDateValue(value) ? value : null;
      return { item, index, timestamp: toTimestamp(dateValue) };
    })
    .sort((left, right) => {
      if (left.timestamp == null) return right.timestamp == null ? left.index - right.index : 1;
      if (right.timestamp == null) return -1;
      return (left.timestamp - right.timestamp) * multiplier || left.index - right.index;
    })
    .map(({ item }) => item);
}

export function filterBySearch<T>(
  items: readonly T[],
  keyword: string | null | undefined,
  fields: readonly (keyof T)[],
): T[] {
  const query = keyword?.trim().toLocaleLowerCase();
  if (!query) return [...items];

  return items.filter((item) => fields.some((field) => {
    const value = item[field];
    return (typeof value === "string" || typeof value === "number" || typeof value === "bigint")
      && String(value).toLocaleLowerCase().includes(query);
  }));
}

export function getFileExtension(fileName: string | null | undefined): string {
  if (!fileName) return "";
  const baseName = fileName.split(/[\\/]/).pop() ?? "";
  const dotIndex = baseName.lastIndexOf(".");
  return dotIndex > 0 ? baseName.slice(dotIndex + 1).toLowerCase() : "";
}

export function isImageFile(file: File | string | null | undefined): boolean {
  if (typeof file === "string") return /\.(?:jpe?g|png|gif|webp|svg|bmp|avif)$/i.test(file);
  if (!file) return false;
  return file.type.startsWith("image/") || isImageFile(file.name);
}
