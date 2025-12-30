import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type ErrorBoundaryProps = {
  children: React.ReactNode;
  title?: string;
  description?: string;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-[60vh] flex items-center justify-center p-6">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle className="font-heading">
              {this.props.title ?? "Something went wrong"}
            </CardTitle>
            <CardDescription>
              {this.props.description ??
                "A temporary error occurred while rendering this page. You can try again safely."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {this.state.error?.message ? (
              <p className="text-sm text-muted-foreground break-words">
                {this.state.error.message}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button
                variant="default"
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                Try again
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Reload page
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }
}
