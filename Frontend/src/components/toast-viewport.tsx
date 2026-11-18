import { useEffect, useState } from "react";
import { subscribeToToasts, type ToastMessage } from "@/lib/toast";

export default function ToastViewport() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const timers = new Map<number, number>();
    const unsubscribe = subscribeToToasts((message) => {
      setMessages((current) => [...current, message]);
      timers.set(message.id, window.setTimeout(() => {
        setMessages((current) => current.filter((item) => item.id !== message.id));
        timers.delete(message.id);
      }, message.duration));
    });

    return () => {
      unsubscribe();
      timers.forEach(window.clearTimeout);
    };
  }, []);

  function dismiss(id: number) {
    setMessages((current) => current.filter((message) => message.id !== id));
  }

  return (
    <div className="toast-region" id="toast-region" aria-live="polite" aria-relevant="additions">
      {messages.map((message) => (
        <div
          className={`toast toast-${message.variant}`}
          key={message.id}
          role={message.variant === "error" ? "alert" : "status"}
        >
          <span>{message.message}</span>
          <button
            type="button"
            className="toast-dismiss"
            aria-label="Dismiss notification"
            onClick={() => dismiss(message.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
