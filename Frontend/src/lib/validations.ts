import { FILE_UPLOAD_CONFIG } from "@/lib/constants";

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export function isValidEmail(value: string | null | undefined): boolean {
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export function validateEmail(value: string | null | undefined): ValidationResult {
  return isValidEmail(value) ? { valid: true } : { valid: false, message: "Enter a valid email address." };
}

export function isValidPassword(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length >= 6;
}

export function validatePassword(value: string | null | undefined): ValidationResult {
  return isValidPassword(value)
    ? { valid: true }
    : { valid: false, message: "Use at least 6 characters for your password." };
}

function normalizedPhilippineMobileNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("0063")) return digits.slice(4);
  if (digits.startsWith("63")) return digits.slice(2);
  if (digits.startsWith("0")) return digits.slice(1);
  return digits;
}

export function isValidPhoneNumber(value: string | null | undefined): boolean {
  if (!value || !/^[+\d\s().-]+$/.test(value.trim())) return false;
  const plusCount = (value.match(/\+/g) ?? []).length;
  if (plusCount > 1 || (plusCount === 1 && !value.trim().startsWith("+"))) return false;
  return /^9\d{9}$/.test(normalizedPhilippineMobileNumber(value));
}

export function validatePhoneNumber(value: string | null | undefined): ValidationResult {
  return isValidPhoneNumber(value)
    ? { valid: true }
    : { valid: false, message: "Enter a valid Philippine mobile number, such as 09171234567 or +639171234567." };
}

export function isRequired(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export function validateRequired(value: unknown, fieldName = "This field"): ValidationResult {
  return isRequired(value) ? { valid: true } : { valid: false, message: `${fieldName} is required.` };
}

export function isValidName(value: string | null | undefined): boolean {
  if (!value || !isRequired(value)) return false;
  return /\p{L}/u.test(value) && /^[\p{L}\p{M}\s.'’-]+$/u.test(value.trim());
}

export function validateName(value: string | null | undefined): ValidationResult {
  return isValidName(value)
    ? { valid: true }
    : { valid: false, message: "Enter a name using letters, spaces, apostrophes, or hyphens." };
}

// The current project requires a student ID but does not define a format.
export function isValidStudentId(value: string | null | undefined): boolean {
  return isRequired(value);
}

export function validateStudentId(value: string | null | undefined): ValidationResult {
  return isValidStudentId(value) ? { valid: true } : { valid: false, message: "Student ID is required." };
}

function fileNameFrom(value: File | string | null | undefined): string {
  if (typeof value === "string") return value;
  return value?.name ?? "";
}

export function isValidFileType(file: File | string | null | undefined): boolean {
  const fileName = fileNameFrom(file);
  const extension = `.${fileName.split(".").pop()?.toLowerCase() ?? ""}`;
  if (!FILE_UPLOAD_CONFIG.allowedExtensions.some((allowedExtension) => allowedExtension === extension)) return false;
  if (typeof file === "string") return true;

  const mimeType = file?.type || "application/octet-stream";
  const allowedMimeTypes: readonly string[] = FILE_UPLOAD_CONFIG.allowedMimeTypes[extension as keyof typeof FILE_UPLOAD_CONFIG.allowedMimeTypes];
  return allowedMimeTypes.includes(mimeType);
}

export function validateFileType(file: File | string | null | undefined): ValidationResult {
  return isValidFileType(file)
    ? { valid: true }
    : { valid: false, message: "Choose a PDF, Word, TXT, JPG, or PNG document." };
}

export function isValidFileSize(fileOrBytes: File | number | null | undefined): boolean {
  const bytes = typeof fileOrBytes === "number" ? fileOrBytes : fileOrBytes?.size;
  return typeof bytes === "number"
    && Number.isFinite(bytes)
    && bytes >= FILE_UPLOAD_CONFIG.minFileSizeBytes
    && bytes <= FILE_UPLOAD_CONFIG.maxFileSizeBytes;
}

export function validateFileSize(fileOrBytes: File | number | null | undefined): ValidationResult {
  return isValidFileSize(fileOrBytes)
    ? { valid: true }
    : { valid: false, message: "The document must be between 1 byte and 5 MB." };
}
