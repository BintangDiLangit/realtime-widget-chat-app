/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in child component tree
 * and displays a fallback UI
 */

"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  className?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error caught by ErrorBoundary:", error);
      console.error("Component stack:", errorInfo.componentStack);
    }
    
    // TODO: Send to error reporting service in production
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.onReset?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className={cn(
            "flex flex-col items-center justify-center p-8 text-center",
            "bg-background rounded-lg border border-destructive/20",
            this.props.className
          )}
        >
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            An unexpected error occurred. Please try again or refresh the page.
          </p>

          {process.env.NODE_ENV === "development" && this.state.error && (
            <details className="mb-4 text-left w-full max-w-md">
              <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                Error details
              </summary>
              <pre className="mt-2 p-3 bg-secondary rounded text-xs overflow-auto max-h-40">
                {this.state.error.message}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={this.handleReset}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try again
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Refresh page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Compact error boundary for widget/chat components
 */
export class ChatErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    console.error("Chat error:", error.message);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.onReset?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          className={cn(
            "flex flex-col items-center justify-center p-4 text-center",
            this.props.className
          )}
        >
          <AlertTriangle className="w-6 h-6 text-destructive mb-2" />
          <p className="text-sm text-muted-foreground mb-3">
            Chat encountered an error
          </p>
          <Button variant="ghost" size="sm" onClick={this.handleReset}>
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
