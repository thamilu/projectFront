import * as React from 'react';
import type { CardVariantProps } from './card.variants';

export interface CardContextValue {
  variant?: string;
  intent?: string;
  padding?: string;
  interactive?: boolean;
  isLoading?: boolean;
  titleId?: string;
}

export interface CardProps extends React.HTMLAttributes<HTMLElement>, CardVariantProps {
  asChild?: boolean;
  isLoading?: boolean;
  'data-testid'?: string;
}

export type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: HeadingLevel;
  truncate?: boolean;
}

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export interface CardSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number;
  showAvatar?: boolean;
  showFooter?: boolean;
  showMedia?: boolean;
}

export interface CardMediaProps extends React.HTMLAttributes<HTMLDivElement> {
  aspectRatio?: '16/9' | '4/3' | '1/1' | '3/2';
}
