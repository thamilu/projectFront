'use client';

import * as React from 'react';
import { Moon, Sun, Laptop, Check, Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/shared/ui/atoms/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/atoms/dropdown-menu';

/**
 * ThemeToggle Component
 *
 * Allows users to switch between light, dark, and system themes with a dropdown menu.
 */
export const ThemeToggle = React.memo(function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // ✅ Only render after component mounts (prevents SSR hydration mismatch)
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ Memoize theme change handlers
  const handleSetTheme = React.useCallback(
    (newTheme: string) => () => setTheme(newTheme),
    [setTheme]
  );

  // ✅ Show loading state during SSR to prevent flash
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="Loading theme toggle" disabled>
        <Loader2 className="h-[1.2rem] w-[1.2rem] animate-spin" />
      </Button>
    );
  }

  const currentTheme = theme || 'system';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-muted/50 focus-visible:ring-ring focus-visible:ring-2"
          aria-label={`Current theme: ${currentTheme}. Click to change theme (Ctrl+Shift+L)`}
          title="Toggle theme (Ctrl+Shift+L)"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[8rem]">
        <DropdownMenuItem
          onClick={handleSetTheme('light')}
          className="cursor-pointer"
          aria-current={currentTheme === 'light' ? 'true' : undefined}
        >
          <div className="flex w-full items-center justify-between">
            <span className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-amber-500" />
              Light
            </span>
            {currentTheme === 'light' && <Check className="ml-2 h-4 w-4" aria-label="Selected" />}
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleSetTheme('dark')}
          className="cursor-pointer"
          aria-current={currentTheme === 'dark' ? 'true' : undefined}
        >
          <div className="flex w-full items-center justify-between">
            <span className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-blue-400" />
              Dark
            </span>
            {currentTheme === 'dark' && <Check className="ml-2 h-4 w-4" aria-label="Selected" />}
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleSetTheme('system')}
          className="cursor-pointer"
          aria-current={currentTheme === 'system' ? 'true' : undefined}
        >
          <div className="flex w-full items-center justify-between">
            <span className="flex items-center gap-2">
              <Laptop className="h-4 w-4 text-emerald-500" />
              System
            </span>
            {currentTheme === 'system' && <Check className="ml-2 h-4 w-4" aria-label="Selected" />}
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

ThemeToggle.displayName = 'ThemeToggle';
