'use client';

import { useI18n } from '@/core/i18n';
import { cn } from '@/shared/utils';
import { Globe, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  ] as const;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full",
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
          "transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "shadow-sm active:scale-95 cursor-pointer"
        )}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Select Language"
      >
        <Globe className="h-4 w-4 text-muted-foreground animate-spin-slow" />
        <span>{locale === 'en' ? 'EN' : 'HI'}</span>
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute right-0 mt-2 w-40 origin-top-right rounded-xl border bg-popover text-popover-foreground shadow-lg focus:outline-none z-50",
            "transition-all duration-300 ease-out animate-in fade-in slide-in-from-top-2"
          )}
          role="menu"
          aria-orientation="vertical"
        >
          <div className="p-1.5 space-y-1">
            {languages.map((lang) => {
              const isActive = locale === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLocale(lang.code);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2 text-sm rounded-lg cursor-pointer",
                    "transition-all duration-200 ease-in-out",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                  role="menuitem"
                >
                  <div className="flex flex-col items-start">
                    <span className="text-xs text-muted-foreground font-normal">{lang.name}</span>
                    <span className="font-medium">{lang.nativeName}</span>
                  </div>
                  {isActive && <Check className="h-4 w-4 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
