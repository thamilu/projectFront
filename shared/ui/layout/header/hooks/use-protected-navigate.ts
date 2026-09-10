import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DialogTarget } from '../header.types';

interface UseProtectedNavigateReturn {
  dialogOpen: boolean;
  dialogTarget: DialogTarget | null;
  handleProtectedNavigate: (href: string, target: DialogTarget) => void;
  handleSellClick: () => void;
  handleCloseDialog: () => void;
  handleOpenDialog: (target: DialogTarget | null) => void;
}

/**
 * Custom hook to manage navigation paths requiring authentication.
 * Manages modal visibility and state check transitions.
 *
 * @param isUserAuthenticated - Current authentication state
 * @internal Uses useRouter() for Next.js routing transitions
 */
export function useProtectedNavigate(isUserAuthenticated: boolean): UseProtectedNavigateReturn {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTarget, setDialogTarget] = useState<DialogTarget | null>(null);

  const handleProtectedNavigate = useCallback(
    (href: string, target: DialogTarget) => {
      if (!isUserAuthenticated) {
        setDialogTarget(target);
        setDialogOpen(true);
        return;
      }
      router.push(href);
    },
    [isUserAuthenticated, router]
  );

  const handleSellClick = useCallback(() => {
    setDialogTarget(null);
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const handleOpenDialog = useCallback((target: DialogTarget | null) => {
    setDialogTarget(target);
    setDialogOpen(true);
  }, []);

  return {
    dialogOpen,
    dialogTarget,
    handleProtectedNavigate,
    handleSellClick,
    handleCloseDialog,
    handleOpenDialog,
  };
}
