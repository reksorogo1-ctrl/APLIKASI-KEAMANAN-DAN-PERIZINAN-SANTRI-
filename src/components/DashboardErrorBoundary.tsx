import React from 'react';
import { AlertTriangle, RotateCcw, LogOut } from 'lucide-react';

interface DashboardErrorBoundaryProps {
  children: React.ReactNode;
  onResetSession?: () => void;
}

interface DashboardErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class DashboardErrorBoundary extends React.Component<
  DashboardErrorBoundaryProps,
  DashboardErrorBoundaryState
> {
  constructor(props: DashboardErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error: Error): DashboardErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Terjadi kendala saat memuat tampilan Dashboard.',
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('DashboardErrorBoundary caught error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-[60dvh] w-full flex items-center justify-center p-4"
          style={{ opacity: 1, visibility: 'visible' }}
        >
          <div className="w-full max-w-md p-6 rounded-2xl bg-emerald-950/85 border border-red-500/45 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-500/50 flex items-center justify-center mx-auto text-red-300">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-white">
                Gagal Memuat Tampilan Dashboard
              </h2>
              <p className="text-xs text-[#D1FAE5] leading-relaxed">
                Sistem mendeteksi kendala tampilan pada perangkat ini. Silakan muat ulang tampilan atau kembali ke layar PIN.
              </p>
              {this.state.errorMessage && (
                <p className="mt-2 p-2.5 rounded-xl bg-[#041A13]/90 border border-emerald-500/25 text-[11px] font-mono text-red-200 break-words">
                  {this.state.errorMessage}
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                onClick={this.handleRetry}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#10B981] hover:bg-emerald-400 text-[#041A13] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer touch-manipulation"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Coba Muat Ulang</span>
              </button>
              {this.props.onResetSession && (
                <button
                  type="button"
                  onClick={() => {
                    this.setState({ hasError: false, errorMessage: '' });
                    this.props.onResetSession?.();
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#041A13] hover:bg-emerald-950 text-[#D4AF37] border border-[#D4AF37]/40 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer touch-manipulation"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Kembali ke PIN</span>
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
