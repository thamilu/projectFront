'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils';

const switchVariants = cva(
  [
    'peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent',
    'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
  ],
  {
    variants: {
      size: {
        sm: 'h-5 w-9',
        md: 'h-6 w-11',
        lg: 'h-7 w-[52px]',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

const thumbVariants = cva(
  [
    'pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform',
    'data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',
  ],
  {
    variants: {
      size: {
        sm: 'h-4 w-4 data-[state=checked]:translate-x-4',
        md: 'h-5 w-5 data-[state=checked]:translate-x-5',
        lg: 'h-6 w-6 data-[state=checked]:translate-x-6',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface SwitchProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof switchVariants> {
  label?: string;
  containerClassName?: string;
}

const SwitchComponent = React.forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  {
    label,
    size = 'md',
    className,
    containerClassName,
    checked,
    defaultChecked,
    onChange,
    disabled,
    ...props
  },
  ref
) {
  const [isChecked, setIsChecked] = React.useState(checked ?? defaultChecked ?? false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const setRefs = React.useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
    },
    [ref]
  );

  React.useEffect(() => {
    if (checked !== undefined) {
      setIsChecked(checked);
    }
  }, [checked]);

  const handleToggle = () => {
    if (disabled) return;

    const nextChecked = !isChecked;
    if (checked === undefined) {
      setIsChecked(nextChecked);
    }

    // Built from the real hidden <input>, not the visible <button> that
    // received the click — the button has no `checked`/`name`/`value` of
    // its own, so onChange consumers previously received a ChangeEvent
    // whose target was a button DOM node reshaped to look like an input.
    // `.checked` is set explicitly first: React hasn't re-rendered yet at
    // this point in the handler, so the DOM node's own `checked` property
    // still reflects the pre-toggle value — reading it as-is would report
    // the wrong state to onChange consumers.
    if (onChange && inputRef.current) {
      inputRef.current.checked = nextChecked;
      const event = {
        target: inputRef.current,
        currentTarget: inputRef.current,
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(event);
    }
  };

  const stateStr = isChecked ? 'checked' : 'unchecked';

  return (
    <div className={cn('inline-flex min-h-[44px] items-center gap-2', containerClassName)}>
      <button
        type="button"
        role="switch"
        aria-checked={isChecked}
        aria-label={props['aria-label'] || label}
        aria-labelledby={props['aria-labelledby']}
        aria-describedby={props['aria-describedby']}
        data-state={stateStr}
        disabled={disabled}
        onClick={handleToggle}
        className={cn(switchVariants({ size }), className)}
      >
        <span data-state={stateStr} className={cn(thumbVariants({ size }))} />
      </button>

      {/* Hidden input for form validation/ref registration only — the button
          above is the sole keyboard/AT-reachable control; without tabIndex=-1
          and aria-hidden this real <input type="checkbox"> was independently
          focusable, creating a second, redundant tab stop for the same switch. */}
      <input
        type="checkbox"
        ref={setRefs}
        checked={isChecked}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        readOnly
        {...props}
      />

      {label && <span className="text-foreground text-sm font-medium select-none">{label}</span>}
    </div>
  );
});

SwitchComponent.displayName = 'Switch';

export const Switch = React.memo(SwitchComponent);
Switch.displayName = 'Switch';
