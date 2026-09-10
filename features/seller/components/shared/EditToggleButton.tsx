'use client';

import { forwardRef, memo } from 'react';
import { Edit2, Lock } from 'lucide-react';
import { cn } from '@/shared/utils';
import { Button } from '@/shared/ui/atoms/button';

export interface EditToggleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isEditing: boolean;
  onToggle: () => void;
  isValidating?: boolean;
  editLabel?: string;
  lockLabel?: string;
}

export const EditToggleButton = memo(
  forwardRef<HTMLButtonElement, EditToggleButtonProps>(function EditToggleButton(
    {
      isEditing,
      onToggle,
      isValidating = false,
      editLabel = 'Edit Details',
      lockLabel = 'Done Editing',
      className,
      ...props
    },
    ref
  ) {
    return (
      <Button
        ref={ref}
        type="button"
        variant="ghost"
        size="sm"
        onClick={onToggle}
        disabled={isValidating}
        aria-pressed={isEditing}
        aria-label={isEditing ? 'Lock fields and confirm edits' : `Edit ${editLabel.toLowerCase()}`}
        className={cn(
          'text-xxs h-8 px-3 font-bold tracking-widest uppercase transition-all',
          isEditing
            ? 'bg-primary/10 text-primary hover:bg-primary/20'
            : 'text-muted-foreground hover:text-primary',
          className
        )}
        {...props}
      >
        {isEditing ? (
          <>
            <Lock className="mr-2 h-3 w-3" aria-hidden="true" />
            {lockLabel}
          </>
        ) : (
          <>
            <Edit2 className="mr-2 h-3 w-3" aria-hidden="true" />
            {editLabel}
          </>
        )}
      </Button>
    );
  })
);

EditToggleButton.displayName = 'EditToggleButton';
export default EditToggleButton;
