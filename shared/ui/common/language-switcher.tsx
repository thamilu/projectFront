'use client';

import { useI18n } from '@/core/i18n';
import { cn } from '@/shared/utils';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';

export interface LanguageSwitcherProps {
  variant?: 'default' | 'compact' | 'ghost';
  showCurrency?: boolean;
  currency?: string;
  className?: string;
}

export function LanguageSwitcher({
  variant = 'default',
  showCurrency = false,
  currency = 'INR',
  className,
}: LanguageSwitcherProps) {
  const { locale, setLocale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    },
    [isOpen]
  );

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  ] as const;

  const isCompact = variant === 'compact' || variant === 'ghost';

  return (
    <div
      className={cn('relative inline-block text-left', className)}
      ref={dropdownRef}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          isCompact
            ? 'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer select-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none'
            : 'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium border border-border bg-background hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary transition-all duration-200 cursor-pointer shadow-xs active:scale-95'
        )}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Select Language and Currency"
      >
        <Globe className={cn('text-muted-foreground shrink-0', isCompact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
        <span className="font-semibold">{locale === 'en' ? 'EN' : 'HI'}</span>
        {showCurrency && (
          <>
            <span className="text-muted-foreground/40 font-normal">|</span>
            <span className="font-medium text-muted-foreground">{currency}</span>
          </>
        )}
        <ChevronDown className={cn('text-muted-foreground/70 shrink-0 transition-transform duration-200', isCompact ? 'h-3 w-3' : 'h-3.5 w-3.5', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute right-0 z-50 mt-1.5 w-44 origin-top-right rounded-xl border border-border/80 bg-popover text-popover-foreground shadow-2xl focus:outline-none',
            'animate-in fade-in-50 zoom-in-95 duration-150'
          )}
          role="menu"
          aria-orientation="vertical"
        >
          <div className="space-y-1 p-1.5">
            <div className="px-2.5 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Language / भाषा
            </div>
            {languages.map((lang) => {
              const isActive = locale === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setLocale(lang.code);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-foreground hover:bg-muted focus:bg-muted'
                  )}
                  role="menuitem"
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{lang.nativeName}</span>
                    <span className="text-muted-foreground text-[10px] font-normal">{lang.name}</span>
                  </div>
                  {isActive && <Check className="text-primary h-3.5 w-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
