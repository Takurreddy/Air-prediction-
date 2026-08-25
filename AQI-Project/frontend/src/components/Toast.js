/**
 * Toast — Lightweight custom toast notification component.
 *
 * Features:
 * - Auto-dismiss after configurable duration
 * - Stacks multiple toasts
 * - Success/error/warning/info variants
 * - Slide-in animation
 *
 * Usage:
 *   import { ToastProvider, useToast } from "./Toast";
 *
 *   // Wrap your app:
 *   <ToastProvider><App /></ToastProvider>
 *
 *   // In any component:
 *   const toast = useToast();
 *   toast.success("City added to favorites!");
 *   toast.error("Failed to load data.");
 */
import { createContext, useContext, useState, useCallback, useEffect } from "react";

const ToastContext = createContext(null);

let toastId = 0;

const ICONS = {
  success: "✓",
  error: "✕",
  warning: "⚠",
  info: "ℹ",
};

const COLORS = {
  success: { bg: "#22c55e18", border: "#22c55e", text: "#22c55e" },
  error:   { bg: "#ef444418", border: "#ef4444", text: "#ef4444" },
  warning: { bg: "#eab30818", border: "#eab308", text: "#eab308" },
  info:    { bg: "#3b82f618", border: "#3b82f6", text: "#3b82f6" },
};

function ToastItem({ toast, onDismiss }) {
  const [isVisible, setIsVisible] = useState(false);
  const colors = COLORS[toast.type] || COLORS.info;

  useEffect(() => {
    // Trigger slide-in
    requestAnimationFrame(() => setIsVisible(true));

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onDismiss(toast.id), 300);
    }, toast.duration || 4000);

    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <div
      className={`toast-item toast-item--${toast.type} ${isVisible ? "toast-item--visible" : ""}`}
      style={{
        background: colors.bg,
        borderLeft: `3px solid ${colors.border}`,
        color: "var(--text-main)",
        padding: "12px 16px",
        borderRadius: "var(--radius, 8px)",
        marginBottom: 8,
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontSize: 13,
        backdropFilter: "blur(12px)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        transform: isVisible ? "translateX(0)" : "translateX(120%)",
        opacity: isVisible ? 1 : 0,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: "pointer",
        maxWidth: 360,
      }}
      onClick={() => {
        setIsVisible(false);
        setTimeout(() => onDismiss(toast.id), 300);
      }}
    >
      <span style={{ fontWeight: 700, fontSize: 16, color: colors.text, flexShrink: 0 }}>
        {ICONS[toast.type]}
      </span>
      <span>{toast.message}</span>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message, duration = 4000) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, type, message, duration }]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => addToast("success", msg, dur),
    error: (msg, dur) => addToast("error", msg, dur),
    warning: (msg, dur) => addToast("warning", msg, dur),
    info: (msg, dur) => addToast("info", msg, dur),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container - fixed bottom-right */}
      <div
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 10000,
          display: "flex",
          flexDirection: "column-reverse",
          alignItems: "flex-end",
          pointerEvents: "none",
        }}
      >
        <div style={{ pointerEvents: "auto" }}>
          {toasts.map(t => (
            <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export default ToastProvider;
