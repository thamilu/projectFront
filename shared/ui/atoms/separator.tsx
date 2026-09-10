'use client';

import * as React from 'react';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { cn } from '@/shared/utils';

export interface SeparatorProps extends React.ComponentPropsWithoutRef<
  typeof SeparatorPrimitive.Root
> {
  className?: string;
}

const SeparatorComponent = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  SeparatorProps
>(function Separator({ className, orientation = 'horizontal', decorative = true, ...props }, ref) {
  return (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        'bg-border shrink-0',
        orientation === 'horizontal' ? 'my-4 h-[1px] w-full' : 'mx-4 h-full w-[1px]',
        className
      )}
      {...props}
    />
  );
});

SeparatorComponent.displayName = 'Separator';

export const Separator = React.memo(SeparatorComponent);
Separator.displayName = 'Separator';
