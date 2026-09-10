'use client';

/**
 * Prompt to resume an in-progress seller onboarding application.
 *
 * [DISPLAY BUG] This banner previously rendered the saved timestamp exactly as
 * it had been stored — a locale-formatted display string produced at write time
 * by `toLocaleDateString() + ' ' + toLocaleTimeString()` with no locale
 * argument. On an `en-IN` deployment it surfaced as `7/9/2026 11:37:16 pm`:
 * US `M/D/YYYY` ordering, ambiguous with `D/M/YYYY`, and to-the-second precision
 * that answers a question nobody asked. What a returning user needs to know is
 * *how long ago*, not the exact second.
 *
 * The timestamp is now an ISO instant (see `onboarding-draft-storage`), rendered
 * through the shared `formatRelativeTime` — locale-correct via
 * `Intl.RelativeTimeFormat`, and with the exact instant still available on hover
 * and to assistive technology via `<time dateTime>`.
 *
 * [STALENESS] A draft abandoned months ago was previously offered in identical
 * words to one saved minutes ago. An old draft is now labelled as such, and
 * offers an explicit discard, so resuming is an informed choice rather than a
 * guess about what state the form will be in.
 *
 * @module features/seller/components/registration/ResumeDraftBanner
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';
import { cn } from '@/shared/utils';
import { formatRelativeTime } from '@/shared/utils';
import { APP_ROUTES } from '@/shared/routes';
import {
  loadOnboardingDraft,
  clearOnboardingDraft,
  type LoadedDraft,
} from '../../utils/onboarding-draft-storage';

/** Wizard entry point. Sourced from APP_ROUTES rather than a repeated literal. */
const WIZARD_HREF = `${APP_ROUTES.SELLER.REGISTER}?flow=wizard`;

export function ResumeDraftBanner() {
  const router = useRouter();
  const [draft, setDraft] = useState<LoadedDraft | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Read after mount, never during render: storage does not exist on the
  // server, and a locale-formatted value rendered during SSR would also
  // desynchronise from the client's.
  useEffect(() => {
    setDraft(loadOnboardingDraft());
  }, []);

  const handleContinue = useCallback(() => {
    router.push(WIZARD_HREF);
  }, [router]);

  /**
   * Discard is destructive and irreversible, so it is only offered for a stale
   * draft — where the user has plainly moved on — and never as the primary
   * action. "Dismiss" merely hides the banner and leaves the draft intact.
   */
  const handleDiscard = useCallback(() => {
    clearOnboardingDraft();
    setDraft(null);
  }, []);

  if (!draft || dismissed) return null;

  const isStale = draft.freshness === 'stale';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 sm:p-6',
        'bg-card shadow-md hover:shadow-lg',
        isStale ? 'border-warning/40' : 'border-primary/20 hover:border-primary/30',
        'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-4'
      )}
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          'pointer-events-none absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full blur-xl',
          isStale ? 'bg-warning/5' : 'bg-primary/5'
        )}
        aria-hidden="true"
      />

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'shrink-0 rounded-xl p-2.5',
              isStale ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'
            )}
          >
            {isStale ? (
              <Clock className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            )}
          </div>

          <div className="space-y-1">
            <h2 className="text-foreground text-base font-bold">
              {isStale
                ? 'You have an unfinished application'
                : 'Resume your onboarding application'}
            </h2>

            <p className="text-muted-foreground text-xs font-medium">
              {isStale ? 'Last saved ' : 'We saved your progress — last updated '}
              {/*
                <time> carries the machine-readable instant, so the exact value
                is available to assistive technology and on hover even though
                the visible text is relative. The relative text is what a
                returning user actually needs.
              */}
              <time
                dateTime={draft.savedAt}
                title={new Date(draft.savedAt).toLocaleString()}
                className="text-foreground font-semibold"
              >
                {formatRelativeTime(draft.savedAt)}
              </time>
              {/* Step is 0-based in storage; humans count from one. */}
              <span className="text-muted-foreground"> · step {draft.step + 1}</span>
            </p>

            {isStale && (
              <p className="text-muted-foreground text-xs">
                Some details may be out of date. You can continue where you left off, or start
                over.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {isStale && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDiscard}
              className="text-muted-foreground h-10 rounded-xl px-3 text-xs font-bold"
            >
              Discard
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="text-muted-foreground h-10 rounded-xl px-3 text-xs font-bold"
            // Names what is dismissed, and makes clear the draft survives —
            // the previous "Dismiss draft banner" read as though it discarded.
            aria-label="Hide this reminder. Your saved progress is kept."
          >
            Dismiss
          </Button>

          <Button
            size="sm"
            onClick={handleContinue}
            className="flex h-10 items-center gap-1.5 rounded-xl px-4 text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Continue Registration
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ResumeDraftBanner;
