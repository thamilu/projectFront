import React, { useMemo } from 'react';

type Props = {
  password?: string | null;
};

export function PasswordStrength({ password }: Props) {
  const strengthId = React.useId();
  const score = useMemo(() => {
    if (!password || password.length === 0) return 0;
    let s = 0;
    if (password.length >= 8) s += 1;
    if (password.length >= 12) s += 1;
    if (/[A-Z]/.test(password)) s += 1;
    if (/[0-9]/.test(password)) s += 1;
    if (/[^A-Za-z0-9]/.test(password)) s += 1;
    return Math.min(s, 5);
  }, [password]);

  const labels = ['', 'Very weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = [
    'bg-transparent',
    'bg-red-500',
    'bg-orange-400',
    'bg-yellow-400',
    'bg-green-400',
    'bg-green-600',
  ];

  return (
    <div className="mt-2" aria-live="polite">
      <div className="h-2 w-full overflow-hidden rounded bg-slate-200 dark:bg-slate-700">
        <div
          className={`${colors[score]} transition-width h-full duration-200`}
          style={{ width: `${(score / 5) * 100}%` }}
          aria-hidden
        />
      </div>
      <p id={strengthId} className="text-muted-foreground mt-1 text-xs">
        {password ? labels[score] : 'Enter a password'}
      </p>
    </div>
  );
}

// Default export kept for the existing call site; named export added for
// import-style consistency with every other atom in this directory (this
// was the only default export among 54 files here).
export default PasswordStrength;
