import { RefObject, useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

// Track open focus traps in a stack so nested dialogs only trap/dismiss the topmost one.
const activeTrapStack: symbol[] = [];

/**
 * Trap keyboard focus (Tab / Shift+Tab) inside a dialog container while open,
 * support Escape dismissal, and restore focus to the trigger element on close.
 */
export function useFocusTrap(
  open: boolean,
  containerRef: RefObject<HTMLElement | null>,
  onClose?: () => void,
  initialFocusRef?: RefObject<HTMLElement | null>
): void {
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    const trapId = Symbol('focus-trap');
    activeTrapStack.push(trapId);

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const raf = window.requestAnimationFrame(() => {
      if (activeTrapStack[activeTrapStack.length - 1] !== trapId) return;
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
        return;
      }
      const container = containerRef.current;
      if (!container) return;
      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
      focusable[0]?.focus();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTrapStack[activeTrapStack.length - 1] !== trapId) return;

      if (e.key === 'Escape' && onCloseRef.current) {
        e.preventDefault();
        e.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (e.key !== 'Tab') return;
      const container = containerRef.current;
      if (!container) return;

      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeEl = document.activeElement as HTMLElement | null;
      const isFocusableActive = Boolean(activeEl && focusable.includes(activeEl));

      if (e.shiftKey) {
        if (!isFocusableActive || activeEl === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (!isFocusableActive || activeEl === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      const idx = activeTrapStack.lastIndexOf(trapId);
      if (idx !== -1) activeTrapStack.splice(idx, 1);
      window.cancelAnimationFrame(raf);
      window.removeEventListener('keydown', handleKeyDown, true);
      if (previousFocusRef.current && previousFocusRef.current.isConnected) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
    };
  }, [open, containerRef, initialFocusRef]);
}
