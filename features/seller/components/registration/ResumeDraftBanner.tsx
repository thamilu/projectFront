'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';
import { cn } from '@/shared/utils';

export function ResumeDraftBanner() {
  const router = useRouter();
  const [draftExists, setDraftExists] = useState(false);
  const [savedAt, setSavedAt] = useState('');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const savedData = localStorage.getItem('seller-onboarding-data');
      const timestamp = localStorage.getItem('seller-onboarding-saved-at');
      if (savedData) {
        setDraftExists(true);
        setSavedAt(timestamp || 'Recently');
      }
    } catch {
      // Ignore local storage security errors
    }
  }, []);

  if (!draftExists || dismissed) return null;

  const handleContinue = () => {
    router.push('/seller/register?flow=wizard');
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 transition-all duration-300',
        'border-primary/20 hover:border-primary/30 shadow-md hover:shadow-lg',
        'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-4'
      )}
      role="status"
      aria-live="polite"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-primary/5 blur-xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary shrink-0 dark:bg-primary/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 dark:text-white text-base">
              Resume your onboarding application
            </h4>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
              We saved your progress. Last updated: <span className="text-slate-700 dark:text-slate-300 font-semibold">{savedAt}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl h-10 px-3 text-xs font-bold"
            aria-label="Dismiss draft banner"
          >
            Dismiss
          </Button>
          <Button
            size="sm"
            onClick={handleContinue}
            className="bg-primary hover:bg-primary/95 text-white font-bold rounded-xl h-10 px-4 text-xs flex items-center gap-1.5 shadow-sm shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Continue Registration
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ResumeDraftBanner;
