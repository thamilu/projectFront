'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface StepLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  containerClassName?: string;
  'data-testid'?: string;
  variant?: 'default' | 'plain';
}

export function StepLayout({
  title,
  description,
  children,
  containerClassName = '',
  'data-testid': testId,
  variant = 'default',
}: StepLayoutProps) {
  const containerClass = variant === 'plain'
    ? containerClassName
    : `bg-muted/30 rounded-xl border p-4 backdrop-blur-sm ${containerClassName}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
      data-testid={testId}
    >
      <div className="space-y-1 text-left">
        <h2 className="from-primary to-primary/60 bg-linear-to-r bg-clip-text text-xl font-bold tracking-tight text-transparent">
          {title}
        </h2>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      <div className={containerClass}>
        {children}
      </div>
    </motion.div>
  );
}
