export interface LoadingProps {
  /** Loading message to display */
  message?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Full screen overlay */
  fullScreen?: boolean;
  /** Show spinner */
  showSpinner?: boolean;
  /** Custom className */
  className?: string;
  /** Timeout in ms */
  timeout?: number;
  /** Callback on timeout */
  onTimeout?: () => void;
  /** Data test id */
  testId?: string;
}

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}
