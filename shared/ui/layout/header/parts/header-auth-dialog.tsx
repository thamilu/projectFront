import { useRouter } from 'next/navigation';
import { Loader2, User } from 'lucide-react';
import { useI18n } from '@/core/i18n';
import { Button } from '@/shared/ui/atoms/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui/atoms/dialog';
import { APP_ROUTES } from '@/shared/routes';
import { DIALOG_TARGET } from '../header.constants';
import type { DialogTarget } from '../header.types';

interface HeaderAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dialogTarget: DialogTarget | null;
  onLogin: () => void;
  isPending: boolean;
}

export function HeaderAuthDialog({
  open,
  onOpenChange,
  dialogTarget,
  onLogin,
  isPending,
}: HeaderAuthDialogProps) {
  const { t } = useI18n();
  const router = useRouter();

  const getDialogContent = (target: DialogTarget | null) => {
    if (target === DIALOG_TARGET.CART) {
      return {
        title: t('header.dialog.cartTitle'),
        description: t('header.dialog.cartEmpty'),
      };
    }
    if (target === DIALOG_TARGET.WISHLIST) {
      return {
        title: t('header.dialog.wishlistTitle'),
        description: t('header.dialog.wishlistEmpty'),
      };
    }
    return {
      title: t('header.dialog.accountRequired'),
      description: t('header.dialog.accountRequiredDesc'),
    };
  };

  const content = getDialogContent(dialogTarget);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background/80 border-white/10 p-6 backdrop-blur-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{content.title}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {content.description}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <Button
            onClick={() => {
              onOpenChange(false);
              router.push(`${APP_ROUTES.PRODUCTS}?filter=deals`);
            }}
            className="h-12 w-full bg-emerald-500 font-bold text-white hover:bg-emerald-600"
          >
            {t('header.dialog.shopDeals')}
          </Button>

          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              onClick={onLogin}
              disabled={isPending}
              className="h-12 w-full border-emerald-500/20 bg-emerald-500/5 font-bold text-emerald-600 hover:bg-emerald-500 hover:text-white"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <User className="mr-2 h-4 w-4" />
              )}
              {isPending ? t('common.loading') : t('header.dialog.signInWithKeycloak')}
            </Button>

            <p className="text-muted-foreground text-center text-xs">
              {t('header.dialog.newUserHint')}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
