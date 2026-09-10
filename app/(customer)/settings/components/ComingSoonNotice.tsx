'use client';

import React from 'react';
import { Construction } from 'lucide-react';

interface ComingSoonNoticeProps {
  /** What the user was trying to do, e.g. "Password changes" */
  feature: string;
}

/**
 * Shown inside settings modals/sections whose backend integration doesn't
 * exist yet (password change, MFA enrollment, account deletion/deactivation,
 * data export). These used to simulate success with a `setTimeout` and no
 * real API call — e.g. "Delete Account" collected a typed confirmation and
 * a password, waited 1.2s, and told the user their account was permanently
 * deleted, when nothing happened server-side. Gating on this notice (and
 * disabling the actual submit action, see each component's onSubmit) stops
 * that misrepresentation without discarding the built form/validation UI,
 * which stays ready for whenever the real endpoint exists.
 */
export function ComingSoonNotice({ feature }: ComingSoonNoticeProps) {
  return (
    <div
      role="status"
      className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs font-medium text-amber-700 dark:text-amber-400"
    >
      <Construction className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>
        {feature} isn&apos;t connected to your account yet — this form is a preview of what&apos;s
        coming. No changes will be made if you submit it.
      </span>
    </div>
  );
}
