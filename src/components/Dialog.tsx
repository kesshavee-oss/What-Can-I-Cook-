import React, { useId, useRef } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from '../utils/useFocusTrap';

export interface DialogProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children?: React.ReactNode;
  maxWidthClass?: string;
  fullScreenOnMobile?: boolean;
  focusHeadingOnOpen?: boolean;
}

/**
 * Reusable accessible modal dialog with focus trapping, Escape key support,
 * backdrop click dismissal, optional mobile full-screen sheet mode,
 * optional heading focus on open, and focus restoration to the trigger element.
 */
export const Dialog: React.FC<DialogProps> = ({
  open,
  title,
  description,
  onClose,
  children,
  maxWidthClass = 'max-w-sm',
  fullScreenOnMobile = false,
  focusHeadingOnOpen = false,
}) => {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  useFocusTrap(
    open,
    panelRef,
    onClose,
    focusHeadingOnOpen ? headingRef : undefined
  );

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-center transition-opacity duration-200 ${
        fullScreenOnMobile
          ? 'items-stretch sm:items-center p-0 sm:p-4'
          : 'items-center p-4'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className={`w-full ${maxWidthClass} overflow-y-auto bg-white shadow-xl space-y-5 transition-transform duration-200 ${
          fullScreenOnMobile
            ? 'h-full sm:h-auto sm:max-h-[90vh] rounded-none sm:rounded-2xl p-5 sm:p-6 border-0 sm:border sm:border-[#EADFD2]'
            : 'max-h-[90vh] rounded-2xl p-6 border border-[#EADFD2]'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <h2
              id={titleId}
              ref={focusHeadingOnOpen ? headingRef : undefined}
              tabIndex={focusHeadingOnOpen ? -1 : undefined}
              className="font-heading text-lg sm:text-xl font-bold text-[#2B2B2B] focus:outline-none"
            >
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-sm text-[#6B6B6B] leading-relaxed">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="min-w-[44px] min-h-[44px] -mt-2 -mr-2 rounded-xl hover:bg-[#FFF9F2] flex items-center justify-center text-[#6B6B6B] shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
};
