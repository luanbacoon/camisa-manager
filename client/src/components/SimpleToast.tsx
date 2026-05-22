import { useState, useCallback, useEffect } from "react";
import { X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

const toastContext = new Map<string, (toast: Toast) => void>();

export function useSimpleToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const id = Math.random().toString(36);
    const handler = (toast: Toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 3000);
    };
    toastContext.set(id, handler);
    return () => toastContext.delete(id);
  }, []);

  return toasts;
}

export function toast(message: string, type: ToastType = "info") {
  const id = Date.now().toString();
  const newToast = { id, message, type };
  toastContext.forEach((handler) => handler(newToast));
}

export function SimpleToastContainer() {
  const toasts = useSimpleToast();

  const removeToast = (id: string) => {
    // Toast auto-removes after 3s, this is for manual close
  };

  const getStyles = (type: ToastType) => {
    switch (type) {
      case "success":
        return "bg-green-500 text-white";
      case "error":
        return "bg-red-500 text-white";
      case "warning":
        return "bg-yellow-500 text-white";
      default:
        return "bg-blue-500 text-white";
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${getStyles(t.type)} px-4 py-3 rounded-lg shadow-lg flex items-center justify-between gap-2 pointer-events-auto animate-in slide-in-from-top-2 fade-in duration-300`}
        >
          <span>{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            className="hover:opacity-80"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
