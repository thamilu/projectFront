"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface StepLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  containerClassName?: string;
}

export function StepLayout({ title, description, children, containerClassName = "" }: StepLayoutProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="text-left space-y-1">
        <h2 className="text-xl font-bold tracking-tight bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>

      <div className={`p-4 rounded-xl border bg-muted/30 backdrop-blur-sm ${containerClassName}`}>
        {children}
      </div>
    </motion.div>
  );
}
