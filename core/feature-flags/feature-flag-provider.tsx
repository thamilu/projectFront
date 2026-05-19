'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { featureFlags, FeatureFlagKey } from './flags';
import { logger } from '@/core/telemetry/logger';

interface FeatureFlagContextProps {
  flags: Record<FeatureFlagKey, boolean>;
  isEnabled: (flag: FeatureFlagKey) => boolean;
  setOverride: (flag: FeatureFlagKey, value: boolean | null) => void;
}

const FeatureFlagContext = createContext<FeatureFlagContextProps | undefined>(undefined);

export function FeatureFlagProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<Record<FeatureFlagKey, boolean>>(featureFlags);

  useEffect(() => {
    try {
      // Check for local development overrides in localStorage
      const overrides: Record<string, boolean> = {};
      Object.keys(featureFlags).forEach((flag) => {
        const value = localStorage.getItem(`ff_override_${flag}`);
        if (value !== null) {
          overrides[flag] = value === 'true';
        }
      });

      if (Object.keys(overrides).length > 0) {
        setFlags((prev) => ({
          ...prev,
          ...overrides,
        }));
        logger.debug('🔔 [FeatureFlags] Applied local developer overrides:', overrides);
      }
    } catch (e) {
      logger.error('Failed to load local feature flag overrides:', { error: e });
    }
  }, []);

  const isEnabled = (flag: FeatureFlagKey): boolean => {
    return flags[flag] ?? false;
  };

  const setOverride = (flag: FeatureFlagKey, value: boolean | null) => {
    setFlags((prev) => ({
      ...prev,
      [flag]: value !== null ? value : featureFlags[flag as FeatureFlagKey],
    }));

    if (value !== null) {
      localStorage.setItem(`ff_override_${flag}`, String(value));
    } else {
      localStorage.removeItem(`ff_override_${flag}`);
    }
  };

  return (
    <FeatureFlagContext.Provider value={{ flags, isEnabled, setOverride }}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  return context;
}
