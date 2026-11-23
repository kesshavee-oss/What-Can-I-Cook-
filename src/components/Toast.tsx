import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export interface ToastProps {
  message: string | null;
  variant?: 'success' | 'error' | 'info';
  durationMs?: number;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
}

/**
 * Reusable bottom-anchored toast notification that auto-dismisses after durationMs.
 */
export const Toast: React.FC<ToastProps> = ({
  message,
  variant = 'success',
  durationMs = 4000,
  actionLabel,
  onAction,
  onDismiss,
}) => {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => {
      onDismiss();
    }, durationMs);
    return () => window.clearTimeout(timer);
  }, [message, durationMs, onDismiss]);

  if (!message) return null;

  const isError = variant === 'error';
  const isInfo = variant === 'info';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      className={`fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between gap-3 text-sm font-medium transition-opacity duration-200 ${
        isError ? 'bg-[#A63429] text-white' : 'bg-[#2B2B2B] text-white'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {isError ? (
          <AlertCircle className="w-4 h-4 shrink-0 text-white" aria-hidden="true" />
        ) : isInfo ? (
          <AlertCircle className="w-4 h-4 shrink-0 text-[#F3B65B]" aria-hidden="true" />
        ) : (
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#4CC38A]" aria-hidden="true" />
        )}
        <span className="leading-snug">{message}</span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={() => {
              onDismiss();
              onAction();
            }}
            className="min-h-[44px] px-3 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold cursor-pointer"
          >
            {actionLabel}
          </button>
        )}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="min-w-[44px] min-h-[44px] -my-2 -mr-2 rounded-xl hover:bg-white/10 flex items-center justify-center shrink-0 cursor-pointer"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
