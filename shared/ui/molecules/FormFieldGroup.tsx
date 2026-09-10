import React from 'react';
import { cn } from '@/shared/utils';

interface FormFieldGroupProps {
  children: React.ReactNode;
  label?: string;
  columns?: 1 | 2 | 3;
  className?: string;
}

export function FormFieldGroup({ children, label, columns = 2, className }: FormFieldGroupProps) {
  return (
    <fieldset
      className={cn(
        'm-0 grid gap-6 border-0 p-0',
        {
          'md:grid-cols-2': columns === 2,
          'md:grid-cols-3': columns === 3,
        },
        className
      )}
    >
      {label && <legend className="sr-only">{label}</legend>}
      {children}
    </fieldset>
  );
}
export default FormFieldGroup;
