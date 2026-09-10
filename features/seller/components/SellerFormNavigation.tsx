import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';

interface SellerFormNavigationProps {
  currentStep: number;
  stepsCount: number;
  onPrev: () => void;
  onNext: () => void;
  onSaveDraft?: () => void;
  isSubmitting: boolean;
}

export function SellerFormNavigation({
  currentStep,
  stepsCount,
  onPrev,
  onNext,
  onSaveDraft,
  isSubmitting,
}: SellerFormNavigationProps): React.JSX.Element {
  return (
    <div className="border-primary/10 flex items-center justify-between border-t pt-8">
      {/* Back Button - styled as a clean secondary button */}
      <Button
        type="button"
        variant="secondary"
        onClick={onPrev}
        disabled={currentStep === 0 || isSubmitting}
        className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 h-12 rounded-xl px-8 text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-40"
      >
        ← Back
      </Button>

      {/* Save Draft & Exit Button - subtle outline button that does not compete with main CTA */}
      {onSaveDraft && (
        <Button
          type="button"
          variant="outline"
          onClick={onSaveDraft}
          disabled={isSubmitting}
          className="h-12 px-5 rounded-xl border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold uppercase tracking-wider transition-all"
        >
          Save Draft & Exit
        </Button>
      )}

      {/* Next Step / Finish Button */}
      <Button
        type="button"
        onClick={onNext}
        disabled={isSubmitting}
        className="shadow-primary/20 hover:shadow-primary/40 h-12 rounded-xl px-10 text-[10px] font-bold tracking-widest uppercase shadow-lg transition-all"
      >
        {isSubmitting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : currentStep === stepsCount - 1 ? (
          'Finalize Registration'
        ) : (
          'Next Step →'
        )}
      </Button>
    </div>
  );
}
export default SellerFormNavigation;
