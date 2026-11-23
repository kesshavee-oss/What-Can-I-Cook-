import React from 'react';
import { AlertTriangle, ChefHat, RefreshCw } from 'lucide-react';

interface TabErrorBoundaryProps {
  tabName: string;
  onGoToCook: () => void;
  onRetry?: () => void;
  children: React.ReactNode;
}

interface TabErrorBoundaryState {
  hasError: boolean;
  isModuleFetchError: boolean;
}

function checkIsModuleFetchError(err: unknown): boolean {
  const msg =
    err && typeof err === 'object' && 'message' in err
      ? String((err as { message?: unknown }).message || '')
      : String(err || '');
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('ChunkLoadError')
  );
}

/**
 * Per-tab React Error Boundary that isolates render/runtime errors inside a tab,
 * logs the error cleanly to console.error (without exposing stack traces in the UI),
 * and lets the user Retry or switch back to the Cook tab.
 */
export class TabErrorBoundary extends React.Component<
  TabErrorBoundaryProps,
  TabErrorBoundaryState
> {
  constructor(props: TabErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, isModuleFetchError: false };
  }

  static getDerivedStateFromError(error: unknown): TabErrorBoundaryState {
    return {
      hasError: true,
      isModuleFetchError: checkIsModuleFetchError(error),
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error(
      `Error inside "${this.props.tabName}" view:`,
      error,
      info.componentStack
    );
  }

  handleRetry = () => {
    if (this.state.isModuleFetchError && typeof window !== 'undefined') {
      window.location.reload();
      return;
    }
    this.setState({ hasError: false, isModuleFetchError: false });
    this.props.onRetry?.();
  };

  handleGoToCook = () => {
    this.setState({ hasError: false, isModuleFetchError: false });
    this.props.onGoToCook();
  };

  render() {
    if (this.state.hasError) {
      return (
        <section
          role="alert"
          className="bg-white rounded-2xl p-6 sm:p-10 shadow-sm border border-[#EADFD2] text-center space-y-5 max-w-lg mx-auto my-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#E4572E]/10 text-[#B83915] flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" aria-hidden="true" />
          </div>

          <div className="space-y-1.5">
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-[#2B2B2B]">
              This part of the app ran into a problem
            </h1>
            <p className="text-sm text-[#6B6B6B] leading-relaxed">
              Your saved kitchen data is safe. You can retry loading this view or
              return to Cook.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={this.handleRetry}
              className="min-h-[44px] px-5 rounded-xl bg-[#C5411B] hover:bg-[#AE3715] text-white font-heading font-semibold text-sm inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              <span>Retry</span>
            </button>

            <button
              type="button"
              onClick={this.handleGoToCook}
              className="min-h-[44px] px-5 rounded-xl border border-[#DFD3C5] bg-[#FFF9F2] hover:border-[#2B2B2B] text-sm font-semibold text-[#2B2B2B] inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ChefHat className="w-4 h-4" aria-hidden="true" />
              <span>Go to Cook</span>
            </button>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}
