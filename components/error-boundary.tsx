"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="rounded-lg border bg-destructive/10 p-6 text-center">
              <h2 className="text-xl font-bold text-destructive mb-2">
                Something went wrong
              </h2>
              <p className="text-muted-foreground mb-4">
                {this.state.error?.message}
              </p>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
              >
                Try Again
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}