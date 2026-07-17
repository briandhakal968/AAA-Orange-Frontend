"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { X } from "lucide-react";

type AlertType = "success" | "error" | "warning" | "info" | "confirm" | "secondary";

interface AlertModalContent {
  message: string;
  type: AlertType;
  onConfirm?: () => void;
}

interface AlertContextType {
  showAlert: (message: string, type?: AlertType, onConfirm?: () => void) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alert, setAlert] = useState<AlertModalContent | null>(null);

  const showAlert = useCallback((message: string, type: AlertType = "info", onConfirm?: () => void) => {
    setAlert({ message, type, onConfirm });
  }, []);

  const closeAlert = useCallback(() => {
    setAlert(null);
  }, []);

  const handleConfirm = useCallback(() => {
    if (alert?.onConfirm) {
      alert.onConfirm();
    }
    closeAlert();
  }, [alert, closeAlert]);

  const typeStyles = {
    success: {
      bg: "bg-white",
      border: "border-neutral-200",
      icon: "text-green-500",
      title: "text-neutral-800",
      message: "text-neutral-700",
      button: "bg-[var(--primary)] hover:bg-[var(--primary-dark)]",
    },
    error: {
      bg: "bg-white",
      border: "border-neutral-200",
      icon: "text-red-500",
      title: "text-neutral-800",
      message: "text-neutral-700",
      button: "bg-[var(--primary)] hover:bg-[var(--primary-dark)]",
    },
    warning: {
      bg: "bg-white",
      border: "border-neutral-200",
      icon: "text-yellow-500",
      title: "text-neutral-800",
      message: "text-neutral-700",
      button: "bg-[var(--primary)] hover:bg-[var(--primary-dark)]",
    },
    info: {
      bg: "bg-white",
      border: "border-neutral-200",
      icon: "text-blue-500",
      title: "text-neutral-800",
      message: "text-neutral-700",
      button: "bg-[var(--primary)] hover:bg-[var(--primary-dark)]",
    },
    confirm: {
      bg: "bg-white",
      border: "border-neutral-200",
      icon: "text-blue-500",
      title: "text-neutral-800",
      message: "text-neutral-700",
      button: "bg-[var(--primary)] hover:bg-[var(--primary-dark)]",
    },
    secondary: {
      bg: "bg-white",
      border: "border-neutral-200",
      icon: "text-yellow-500",
      title: "text-neutral-800",
      message: "text-neutral-700",
      button: "hover:opacity-90",
    },
  };

  const icons = {
    success: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    warning: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    info: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    confirm: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.057-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.434-3.073 3.5-1.025.561-1.927 1.227-2.927 2.5M7.5 21h9m-9-9h6m-6 4h6m-2 4h2" />
      </svg>
    ),
    secondary: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {alert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={closeAlert} 
          />
          <div className={`relative ${typeStyles[alert.type].bg} border ${typeStyles[alert.type].border} rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl`}>
            <button
              onClick={closeAlert}
              className="absolute top-3 right-3 p-1 hover:bg-black/5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>
            <div className={`flex items-center gap-3 mb-4 ${typeStyles[alert.type].icon}`}>
              {icons[alert.type]}
              <h3 className={`font-semibold text-lg ${typeStyles[alert.type].title}`}>
                {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
              </h3>
            </div>
            <p className={`mb-6 ${typeStyles[alert.type].message}`}>
              {alert.message}
            </p>
            <div className="flex gap-3">
              {alert.type === 'confirm' && (
                <button
                  onClick={closeAlert}
                  className={`flex-1 py-2.5 rounded-lg text-white transition-colors ${typeStyles[alert.type].button}`}
                  style={(alert.type as string) === 'secondary' ? { backgroundColor: 'var(--secondary)' } : {}}
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleConfirm}
                className={`flex-1 px-4 py-2 text-white rounded-lg text-sm font-medium ${typeStyles[alert.type].button} transition-colors`}
                style={alert.type === 'secondary' ? { backgroundColor: 'var(--secondary)' } : {}}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within AlertProvider");
  }
  return context;
}
