import * as React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EditorErrorBoundaryProps {
  children: React.ReactNode;
}

interface EditorErrorBoundaryState {
  hasError: boolean;
}

/**
 * Error boundary that catches rendering errors inside the Plate editor
 * (e.g. malformed Slate nodes with missing `children`) and shows a
 * recoverable fallback instead of a white screen.
 */
export class EditorErrorBoundary extends React.Component<
  EditorErrorBoundaryProps,
  EditorErrorBoundaryState
> {
  constructor(props: EditorErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): EditorErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[EditorErrorBoundary] Caught rendering error:', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-md border border-destructive/30 bg-destructive/5 p-8 text-center">
          <AlertTriangle className="size-10 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">
              Something went wrong while rendering the editor.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              This may be caused by corrupted content. Try reloading the page.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={this.handleRetry}
            className="hover:cursor-pointer"
          >
            <RefreshCw className="mr-2 size-4" />
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
