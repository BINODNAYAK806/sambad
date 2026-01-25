import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-slate-100 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Something went wrong</CardTitle>
                  <CardDescription>The application encountered an unexpected error</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Details</AlertTitle>
                <AlertDescription>
                  {this.state.error?.message || 'An unknown error occurred'}
                </AlertDescription>
              </Alert>

              {this.state.errorInfo && (
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
                    Stack Trace (click to expand)
                  </summary>
                  <pre className="mt-2 p-4 bg-slate-900 text-slate-100 rounded-lg overflow-auto text-xs">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={this.handleReload} className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reload Application
                </Button>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Need Help?</AlertTitle>
                <AlertDescription>
                  If this error persists, try restarting the application or checking the console for more details.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
