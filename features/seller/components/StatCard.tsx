import React from 'react';
import { LucideIcon } from 'lucide-react';
import { PremiumCard } from '@/shared/components/PremiumCard';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: LucideIcon;
  iconColorClass?: string;
  valueColorClass?: string;
}

/**
 * A specialized card for dashboard statistics, built on the PremiumCard primitive.
 */
export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColorClass = 'text-primary',
  valueColorClass = '',
}: StatCardProps) {
  return (
    <PremiumCard
      className="hover:scale-[1.02] transition-all duration-300 border-border/50 shadow-xl"
      contentClassName="pt-0 pb-6"
      gradientClassName="h-1 bg-linear-to-r from-primary to-primary/10"
      icon={
        <div className={cn("p-2 rounded-lg bg-primary/5", iconColorClass)}>
          <Icon className="h-5 w-5" />
        </div>
      }
      headerAction={
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
          {title}
        </span>
      }
    >
      <div className="space-y-1.5 mt-2">
        <div className={cn("text-4xl font-black tracking-tighter", valueColorClass)}>
          {value}
        </div>
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
          {subtitle}
        </p>
      </div>
    </PremiumCard>
  );
}
