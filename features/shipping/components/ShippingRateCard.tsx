'use client';

import { cn } from '@/shared/utils';
import { Truck, ShieldCheck, Zap } from 'lucide-react';
import { ShippingOption } from '../types';

interface ShippingRateCardProps {
  option: ShippingOption;
  isSelected?: boolean;
  onSelect?: () => void;
  className?: string;
}

export function ShippingRateCard({
  option,
  isSelected,
  onSelect,
  className,
}: ShippingRateCardProps) {
  const getIcon = (id: string) => {
    switch (id) {
      case 'sameday':
        return Zap;
      case 'express':
        return ShieldCheck;
      default:
        return Truck;
    }
  };

  const Icon = getIcon(option.id);
  const isFree = option.cost === 0;

  const formattedCost = isFree
    ? 'FREE'
    : new Intl.NumberFormat('en-IN', { style: 'currency', currency: option.currency }).format(option.cost);

  const deliveryEstimation = option.estimatedDaysMin === 0
    ? 'Today'
    : option.estimatedDaysMin === option.estimatedDaysMax
    ? `${option.estimatedDaysMin} day`
    : `${option.estimatedDaysMin}-${option.estimatedDaysMax} days`;

  return (
    <div
      onClick={onSelect}
      className={cn(
        "relative flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ease-out text-left",
        onSelect ? "cursor-pointer active:scale-[0.99]" : "",
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border bg-card hover:border-muted-foreground/20",
        className
      )}
      role={onSelect ? "radio" : undefined}
      aria-checked={isSelected}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-background",
          isSelected ? "text-primary border-primary/20" : "text-muted-foreground border-border"
        )}>
          <Icon className="h-5 w-5" />
        </div>

        <div className="flex flex-col">
          <h4 className="font-semibold text-sm text-foreground">{option.name}</h4>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-[240px]">{option.description}</p>
          <span className="text-[10px] font-semibold text-primary uppercase tracking-wider mt-1.5">
            Est. Arrival: {deliveryEstimation}
          </span>
        </div>
      </div>

      <div className="text-right pl-4">
        <span className={cn(
          "font-bold text-sm",
          isFree ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
        )}>
          {formattedCost}
        </span>
      </div>
    </div>
  );
}
