import React from 'react';
import {
  Dialog as Sheet,
  DialogTrigger as SheetTrigger,
  DialogContent as DialogContent,
  DialogHeader as SheetHeader,
  DialogTitle as SheetTitle,
  DialogDescription as SheetDescription,
} from './dialog';

type Side = 'left' | 'right' | 'top' | 'bottom';

type SheetContentProps = React.ComponentPropsWithoutRef<typeof DialogContent> & {
  side?: Side;
};

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(({ side: _side, ...props }, ref) => {
  return <DialogContent ref={ref} {...props} />;
});

SheetContent.displayName = 'SheetContent';

export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription };
