import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || 'An unexpected error occurred.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('NALA ErrorBoundary caught an error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 text-center">
          <h1 className="font-display text-3xl text-nala-gold">NALA</h1>
          <p className="mt-3 text-base font-medium text-white">Something went wrong</p>
          <p className="mt-2 text-sm text-white/60">
            We could not complete that request. Reload the app to continue.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 h-11 rounded-xl bg-nala-gold px-6 font-semibold text-black"
          >
            Reload app
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
