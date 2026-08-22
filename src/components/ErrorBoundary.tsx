import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[CineMorph AI ErrorBoundary Caught]:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('cinemorph-utube-storage');
    } catch (e) {}
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#08080c] text-white flex flex-col items-center justify-center p-6 select-none font-sans">
          <div className="max-w-md w-full bg-[#14121c] border border-purple-500/30 rounded-3xl p-8 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center mx-auto border border-purple-500/40 animate-pulse">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-white">CineMorph AI Recovery</h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                An unexpected state conflict occurred. Our automated engine is ready to restore your workspace.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-[#0b0a10] border border-white/10 rounded-xl p-3 text-left text-[11px] font-mono text-purple-300 max-h-24 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-purple-950/50 flex items-center justify-center gap-2 transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Reset Workspace & Reload
              </button>
              <a
                href="/"
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 font-semibold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all border border-white/10"
              >
                <Home className="w-4 h-4" /> Return to Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
