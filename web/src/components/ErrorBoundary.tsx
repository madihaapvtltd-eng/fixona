import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl">
            <h2 className="text-red-800 text-lg font-bold mb-4">Something went wrong</h2>
            <div className="text-red-600 text-sm mb-4">
              <p className="font-mono bg-red-100 p-2 rounded">
                {this.state.error?.toString()}
              </p>
            </div>
            {this.state.errorInfo && (
              <details className="text-red-500 text-xs">
                <summary>Component Stack</summary>
                <pre className="mt-2 bg-red-100 p-2 rounded overflow-auto">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <button
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Clear cache and reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
