'use client';

import { cn } from '@/shared/utils';
import { MapPin, Phone, User, Check } from 'lucide-react';

interface AddressCardProps {
  name: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  className?: string;
}

export function AddressCard({
  name,
  street,
  city,
  state,
  postalCode,
  country,
  phone,
  isDefault,
  isSelected,
  onSelect,
  className,
}: AddressCardProps) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "relative flex flex-col p-5 rounded-2xl border transition-all duration-300 ease-out text-left",
        onSelect ? "cursor-pointer active:scale-[0.98]" : "",
        isSelected
          ? "border-primary bg-primary/5 shadow-md shadow-primary/5 ring-1 ring-primary"
          : "border-border bg-card hover:border-muted-foreground/30 hover:shadow-sm",
        className
      )}
      role={onSelect ? "radio" : undefined}
      aria-checked={isSelected}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-foreground text-sm">{name}</span>
            {isDefault && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                Default
              </span>
            )}
          </div>
          
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              {street}, {city}, {state} {postalCode}, {country}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4 shrink-0" />
            <span>{phone}</span>
          </div>
        </div>

        {isSelected && (
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground animate-in zoom-in-50 duration-200">
            <Check className="h-3 w-3 stroke-[3]" />
          </div>
        )}
      </div>
    </div>
  );
}
