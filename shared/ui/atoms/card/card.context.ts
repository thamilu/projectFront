'use client';

import * as React from 'react';
import type { CardContextValue } from './card.types';

export const CardContext = React.createContext<CardContextValue | null>(null);

export function useCardContext(componentName: string): CardContextValue {
  const context = React.useContext(CardContext);
  if (!context) {
    throw new Error(`[Design System] <${componentName}> must be a descendant of <Card>`);
  }
  return context;
}
