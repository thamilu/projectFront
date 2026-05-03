// src/components/auth/LogoutButton.tsx
'use client';

import { LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLogout } from '@/hooks/useLogout';

interface LogoutButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  showIcon?: boolean;
}

export function LogoutButton({ 
  variant = 'ghost', 
  size = 'default',
  showIcon = true 
}: LogoutButtonProps) {
  const logoutMutation = useLogout();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      disabled={logoutMutation.isPending}
    >
      {logoutMutation.isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Logging out...
        </>
      ) : (
        <>
          {showIcon && <LogOut className="mr-2 h-4 w-4" />}
          Logout
        </>
      )}
    </Button>
  );
}
