'use client';

import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';
import { useAuth } from '../../hooks/use-auth';

interface LogoutButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Enterprise Logout Button
 * 
 * Uses the consolidated useAuth hook for consistent logout behavior
 * across the application.
 */
export function LogoutButton({ 
  variant = 'ghost', 
  size = 'default',
  showIcon = true,
  className,
  children
}: LogoutButtonProps) {
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    await logout();
  };
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={className}
      aria-label="Sign Out"
    >
      {showIcon && <LogOut className="mr-2 h-4 w-4" />}
      {children || (isLoggingOut ? 'Logging out...' : 'Sign Out')}
    </Button>
  );
}
