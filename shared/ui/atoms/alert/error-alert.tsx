'use client';

import * as React from 'react';
import { Alert, AlertDescription } from './alert';
import { Icon } from '@/shared/ui/atoms/icons/Icon';

export interface ErrorAlertProps extends React.HTMLAttributes<HTMLDivElement> {
  message: string;
}

const ErrorAlertComponent = React.forwardRef<HTMLDivElement, ErrorAlertProps>(function ErrorAlert(
  { message, className, ...props },
  ref
) {
  return (
    <Alert ref={ref} variant="destructive" className={className} {...props}>
      <Icon name="AlertCircle" className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
});

ErrorAlertComponent.displayName = 'ErrorAlert';

export const ErrorAlert = React.memo(ErrorAlertComponent);
ErrorAlert.displayName = 'ErrorAlert';
