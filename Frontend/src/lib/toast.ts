export type ToastVariant = "success" | "error" | "info";

export interface ToastOptions {
  duration?: number;
}

export interface ToastMessage {
  id: number;
  message: string;
  variant: ToastVariant;
  duration: number;
}

const TOAST_EVENT = "internsync:toast";
const DEFAULT_DURATION = 3200;
let nextToastId = 0;

function publishToast(message: string, variant: ToastVariant, options: ToastOptions = {}): void {
  if (!message.trim()) return;

  const duration = Number.isFinite(options.duration) && (options.duration ?? 0) > 0
    ? options.duration!
    : DEFAULT_DURATION;
  const detail: ToastMessage = {
    id: ++nextToastId,
    message,
    variant,
    duration,
  };

  window.dispatchEvent(new CustomEvent<ToastMessage>(TOAST_EVENT, { detail }));
}

export const toast = {
  success: (message: string, options?: ToastOptions) => publishToast(message, "success", options),
  error: (message: string, options?: ToastOptions) => publishToast(message, "error", options),
  info: (message: string, options?: ToastOptions) => publishToast(message, "info", options),
};

export function subscribeToToasts(listener: (message: ToastMessage) => void): () => void {
  const handleToast = (event: Event) => {
    listener((event as CustomEvent<ToastMessage>).detail);
  };

  window.addEventListener(TOAST_EVENT, handleToast);
  return () => window.removeEventListener(TOAST_EVENT, handleToast);
}
