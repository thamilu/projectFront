import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  AlertTriangle, 
  X, 
  WifiOff,
  Download
} from 'lucide-react';

interface ToastProps {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: (id: string) => void;
}

export function Toast({ 
  id, 
  title, 
  description, 
  type = 'info', 
  duration = 5000, 
  action,
  onClose 
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(id), 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, id, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return null;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-background border-border';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`
      transform transition-all duration-300 ease-in-out
      ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      max-w-sm w-full shadow-lg rounded-lg border p-4 ${getBackgroundColor()}
    `}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            {title}
          </p>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {description}
            </p>
          )}
          {action && (
            <div className="mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            </div>
          )}
        </div>
        <div className="ml-4 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onClose?.(id), 300);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ToastContextType {
  addToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => void;
  removeToast: (id: string) => void;
}

let toastContext: ToastContextType | null = null;

export const toast = {
  success: (title: string, description?: string, action?: ToastProps['action']) => {
    toastContext?.addToast({ title, description, type: 'success', action });
  },
  error: (title: string, description?: string, action?: ToastProps['action']) => {
    toastContext?.addToast({ title, description, type: 'error', action });
  },
  warning: (title: string, description?: string, action?: ToastProps['action']) => {
    toastContext?.addToast({ title, description, type: 'warning', action });
  },
  info: (title: string, description?: string, action?: ToastProps['action']) => {
    toastContext?.addToast({ title, description, type: 'info', action });
  },
  custom: (props: Omit<ToastProps, 'id' | 'onClose'>) => {
    toastContext?.addToast(props);
  }
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflinePrompt, setShowOfflinePrompt] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connection restored', 'You are back online');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflinePrompt(true);
      toast.warning('Connection lost', 'You are currently offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addToast = (toastProps: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Date.now().toString();
    const newToast: ToastProps = {
      ...toastProps,
      id,
      onClose: removeToast
    };
    
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Set up the toast context
  toastContext = { addToast, removeToast };

  return (
    <>
      {children}
      
      {/* ...existing code... */}

      {/* Offline Prompt */}
      {!isOnline && showOfflinePrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-md mx-4 border">
            <div className="flex items-center gap-3 mb-4">
              <WifiOff className="h-6 w-6 text-red-500" />
              <h3 className="font-semibold">You're offline</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Some features may not be available. Your cart and wishlist are saved locally.
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowOfflinePrompt(false)}
                className="flex-1"
              >
                Continue Browsing
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </>
  );
}

// PWA Install Prompt Component
export function PWAInstallPrompt() {
  const [showInstall, setShowInstall] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any | null>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        toast.success('App installed!', 'eShop has been added to your home screen');
      }
      
      setDeferredPrompt(null);
      setShowInstall(false);
    }
  };

  if (!showInstall) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50">
      <div className="bg-background border rounded-lg p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <Download className="h-5 w-5 text-blue-500 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-sm">Install eShop</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Get the full app experience with offline browsing and push notifications.
            </p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleInstall}>
                Install
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowInstall(false)}
              >
                Not now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}