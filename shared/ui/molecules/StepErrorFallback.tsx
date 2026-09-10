import { FallbackProps } from 'react-error-boundary';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';

export function StepErrorFallback({ resetErrorBoundary }: FallbackProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-4 py-8 text-center"
      data-testid="step-error-fallback"
    >
      <AlertTriangle className="text-destructive h-8 w-8" aria-hidden="true" />
      <p className="text-muted-foreground text-sm">Something went wrong loading this step.</p>
      <Button variant="outline" onClick={resetErrorBoundary}>
        Try Again
      </Button>
    </div>
  );
}
