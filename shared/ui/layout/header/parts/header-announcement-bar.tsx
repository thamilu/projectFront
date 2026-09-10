'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { X, Sparkles } from 'lucide-react';
import { DEFAULT_ANNOUNCEMENT_CAMPAIGNS } from '@/domains/navigation/config/header-navigation.config';
import type { AnnouncementCampaign } from '@/domains/navigation/contracts/navigation.types';

const DISMISSED_CAMPAIGNS_KEY = 'eshop_dismissed_announcements';

interface HeaderAnnouncementBarProps {
  campaigns?: AnnouncementCampaign[];
}

export const HeaderAnnouncementBar = React.memo(function HeaderAnnouncementBar({
  campaigns = DEFAULT_ANNOUNCEMENT_CAMPAIGNS,
}: HeaderAnnouncementBarProps) {
  const [activeCampaign, setActiveCampaign] = useState<AnnouncementCampaign | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!campaigns || campaigns.length === 0) return;

    // Pick top-priority campaign
    const sorted = [...campaigns].sort((a, b) => b.priority - a.priority);
    const top = sorted[0];

    try {
      const storage = top.persistDismissal ? localStorage : sessionStorage;
      const dismissedList = JSON.parse(storage.getItem(DISMISSED_CAMPAIGNS_KEY) || '[]');
      if (!dismissedList.includes(top.id)) {
        setActiveCampaign(top);
      }
    } catch {
      setActiveCampaign(top);
    }
  }, [campaigns]);

  const handleDismiss = useCallback(() => {
    if (!activeCampaign) return;
    setIsDismissed(true);

    try {
      const storage = activeCampaign.persistDismissal ? localStorage : sessionStorage;
      const dismissedList = JSON.parse(storage.getItem(DISMISSED_CAMPAIGNS_KEY) || '[]');
      if (!dismissedList.includes(activeCampaign.id)) {
        dismissedList.push(activeCampaign.id);
        storage.setItem(DISMISSED_CAMPAIGNS_KEY, JSON.stringify(dismissedList));
      }
    } catch {
      // Ignore
    }
  }, [activeCampaign]);

  if (!activeCampaign || isDismissed) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Promotions and Announcements"
      className="relative z-40 bg-primary text-primary-foreground text-xs py-1.5 px-4 shadow-xs"
    >
      <div className="container mx-auto flex items-center justify-between gap-4">
        {/* Centered Campaign Content */}
        <div className="flex flex-1 items-center justify-center gap-2 text-center">
          {activeCampaign.badge && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-xs">
              <Sparkles className="h-3 w-3" />
              {activeCampaign.badge}
            </span>
          )}
          {activeCampaign.href ? (
            <Link
              href={activeCampaign.href}
              className="font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded px-1.5 py-0.5"
            >
              {activeCampaign.text}
            </Link>
          ) : (
            <span className="font-medium">{activeCampaign.text}</span>
          )}
        </div>

        {/* Accessible Dismiss Button with clear touch target */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss promotional announcement"
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-primary-foreground/90 hover:bg-white/20 active:bg-white/30 hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
});
