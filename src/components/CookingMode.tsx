import React, { RefObject, useEffect, useRef, useState } from 'react';
import {
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
  Timer,
  X,
} from 'lucide-react';
import { Recipe } from '../types/cook';
import {
  notifyTimerDone,
  playTimerChime,
  requestTimerNotificationPermission,
} from '../utils/sound';
import { useFocusTrap } from '../utils/useFocusTrap';

export interface CookingStepTimerState {
  remainingSeconds: number;
  totalSeconds: number;
  running: boolean;
  finished: boolean;
}

interface CookingModeProps {
  open: boolean;
  recipe: Recipe;
  timersByStep: Record<number, CookingStepTimerState>;
  onToggleStepTimer: (stepIndex: number, defaultSeconds: number) => void;
  onAdjustStepTimer: (
    stepIndex: number,
    deltaSeconds: number,
    defaultSeconds: number
  ) => void;
  onResetStepTimer: (stepIndex: number, defaultSeconds: number) => void;
  onDoneCooking: () => void;
  onClose: () => void;
  returnFocusRef?: RefObject<HTMLButtonElement | null>;
}

function formatTimer(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const CookingMode: React.FC<CookingModeProps> = ({
  open,
  recipe,
  timersByStep,
  onToggleStepTimer,
  onAdjustStepTimer,
  onResetStepTimer,
  onDoneCooking,
  onClose,
  returnFocusRef,
}) => {
  const steps = Array.isArray(recipe?.steps) ? recipe.steps : [];
  const totalSteps = steps.length;
  const [stepIdx, setStepIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const handleClose = () => {
    onClose();
    window.requestAnimationFrame(() => {
      if (returnFocusRef?.current && returnFocusRef.current.isConnected) {
        returnFocusRef.current.focus();
      }
    });
  };

  useFocusTrap(open, containerRef, handleClose, closeBtnRef);

  // Reset to step 0 when opened for a recipe
  useEffect(() => {
    if (open) {
      setStepIdx(0);
    }
  }, [open, recipe?.id]);

  // Screen Wake Lock with silent fallback
  useEffect(() => {
    if (!open) return;
    let wakeLockSentinel: { release?: () => Promise<void> } | null = null;
    let cancelled = false;

    const requestWakeLock = async () => {
      try {
        const nav = navigator as Navigator & {
          wakeLock?: { request: (type: string) => Promise<{ release?: () => Promise<void> }> };
        };
        if (nav.wakeLock && typeof nav.wakeLock.request === 'function') {
          const sentinel = await nav.wakeLock.request('screen');
          if (cancelled) {
            await sentinel?.release?.();
          } else {
            wakeLockSentinel = sentinel;
          }
        }
      } catch {
        // Wake lock unavailable or denied; ignore safely.
      }
    };

    void requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !wakeLockSentinel && !cancelled) {
        void requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      try {
        void wakeLockSentinel?.release?.();
      } catch {
        // Ignore release errors.
      }
      wakeLockSentinel = null;
    };
  }, [open]);

  if (!open || totalSteps === 0) return null;

  const safeIdx = Math.min(Math.max(0, stepIdx), totalSteps - 1);
  const currentStep = steps[safeIdx];
  const defaultSeconds =
    typeof currentStep?.timerSeconds === 'number' && currentStep.timerSeconds > 0
      ? currentStep.timerSeconds
      : 120;
  const activeTimer = timersByStep[safeIdx] ?? null;
  const displaySeconds = activeTimer ? activeTimer.remainingSeconds : defaultSeconds;
  const isFinalStep = safeIdx === totalSteps - 1;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (
      touchStartXRef.current === null ||
      touchStartYRef.current === null ||
      e.changedTouches.length === 0
    ) {
      return;
    }
    const dx = e.changedTouches[0].clientX - touchStartXRef.current;
    const dy = e.changedTouches[0].clientY - touchStartYRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;

    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      if (dx < 0 && safeIdx < totalSteps - 1) {
        setStepIdx((i) => Math.min(totalSteps - 1, i + 1));
      } else if (dx > 0 && safeIdx > 0) {
        setStepIdx((i) => Math.max(0, i - 1));
      }
    }
  };

  const handleTimerTap = () => {
    requestTimerNotificationPermission();
    onToggleStepTimer(safeIdx, defaultSeconds);
  };

  // Suppress unused warning on helper imports when used by parent sound hooks
  void notifyTimerDone;
  void playTimerChime;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cooking-mode-title"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-50 bg-[#FFF9F2] text-[#2B2B2B] flex flex-col justify-between p-4 sm:p-8 overflow-y-auto no-print"
    >
      {/* Top Bar */}
      <header className="max-w-2xl w-full mx-auto flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#C5411B]">
            Cooking mode
          </p>
          <h1
            id="cooking-mode-title"
            className="font-heading text-lg sm:text-xl font-bold text-[#2B2B2B] truncate"
          >
            {recipe.name}
          </h1>
        </div>

        <button
          ref={closeBtnRef}
          type="button"
          onClick={handleClose}
          className="min-h-[44px] min-w-[44px] px-3.5 rounded-xl bg-white border border-[#DFD3C5] hover:border-[#2B2B2B] text-sm font-medium text-[#2B2B2B] inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
        >
          <X className="w-4 h-4" aria-hidden="true" />
          <span>Exit</span>
        </button>
      </header>

      {/* Main Step Card */}
      <main className="max-w-2xl w-full mx-auto my-6 flex-1 flex flex-col justify-center space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-[#6B6B6B] tabular-nums">
            <span>
              Step {safeIdx + 1} of {totalSteps}
            </span>
            <span>
              {Math.round(((safeIdx + 1) / totalSteps) * 100)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-[#EADFD2] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#C5411B] transition-all duration-200"
              style={{ width: `${Math.round(((safeIdx + 1) / totalSteps) * 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#EADFD2] shadow-sm p-6 sm:p-8 space-y-6">
          <p className="font-heading text-xl sm:text-2xl leading-relaxed font-semibold text-[#2B2B2B]">
            {currentStep?.text || '-'}
          </p>

          {/* Integrated Step Timer */}
          <div className="pt-4 border-t border-[#F3EAE0] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Timer className="w-5 h-5 text-[#C5411B]" aria-hidden="true" />
              <span className="font-heading text-2xl font-bold tabular-nums text-[#2B2B2B]">
                {activeTimer?.finished
                  ? 'Done'
                  : formatTimer(displaySeconds)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleTimerTap}
                className={`min-h-[44px] px-4 rounded-xl text-sm font-heading font-semibold inline-flex items-center gap-2 cursor-pointer ${
                  activeTimer?.running
                    ? 'bg-[#C5411B] text-white'
                    : activeTimer?.finished
                    ? 'bg-[#1F6E42] text-white'
                    : 'bg-[#FFF9F2] border border-[#DFD3C5] text-[#2B2B2B] hover:border-[#C5411B]'
                }`}
              >
                {activeTimer?.running ? (
                  <>
                    <Pause className="w-4 h-4" aria-hidden="true" />
                    <span>Pause</span>
                  </>
                ) : activeTimer?.finished ? (
                  <>
                    <RotateCcw className="w-4 h-4" aria-hidden="true" />
                    <span>Restart</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" aria-hidden="true" />
                    <span>{activeTimer ? 'Resume' : 'Start timer'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  onAdjustStepTimer(safeIdx, -30, defaultSeconds)
                }
                className="min-h-[44px] min-w-[44px] px-3 rounded-xl border border-[#DFD3C5] bg-white text-xs font-semibold tabular-nums cursor-pointer"
              >
                -30s
              </button>
              <button
                type="button"
                onClick={() =>
                  onAdjustStepTimer(safeIdx, 60, defaultSeconds)
                }
                className="min-h-[44px] min-w-[44px] px-3 rounded-xl border border-[#DFD3C5] bg-white text-xs font-semibold tabular-nums cursor-pointer"
              >
                +1m
              </button>
              {activeTimer && (
                <button
                  type="button"
                  onClick={() => onResetStepTimer(safeIdx, defaultSeconds)}
                  aria-label="Reset timer"
                  className="min-h-[44px] min-w-[44px] rounded-xl border border-[#DFD3C5] bg-white flex items-center justify-center text-[#6B6B6B] cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>

        {isFinalStep && (
          <div className="bg-[#EEF7F1] border border-[#1F6E42]/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-heading font-bold text-base text-[#1F6E42]">
                Done cooking?
              </p>
              <p className="text-xs sm:text-sm text-[#2B2B2B]">
                Log this meal to your calendar or save leftover portions.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onDoneCooking();
              }}
              className="min-h-[44px] px-5 rounded-xl bg-[#1F6E42] hover:bg-[#185734] text-white font-heading font-semibold text-sm inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <ChefHat className="w-4 h-4" aria-hidden="true" />
              <span>I cooked this</span>
            </button>
          </div>
        )}
      </main>

      {/* Bottom Previous / Next Controls */}
      <footer className="max-w-2xl w-full mx-auto flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          disabled={safeIdx === 0}
          onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
          className="flex-1 min-h-[48px] px-4 rounded-xl bg-white border border-[#DFD3C5] hover:border-[#2B2B2B] disabled:opacity-40 disabled:cursor-not-allowed font-heading font-semibold text-sm text-[#2B2B2B] inline-flex items-center justify-center gap-2 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          <span>Previous</span>
        </button>

        <button
          type="button"
          disabled={isFinalStep}
          onClick={() => setStepIdx((i) => Math.min(totalSteps - 1, i + 1))}
          className="flex-1 min-h-[48px] px-4 rounded-xl bg-[#C5411B] hover:bg-[#AE3715] disabled:opacity-40 disabled:cursor-not-allowed text-white font-heading font-semibold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </footer>
    </div>
  );
};
