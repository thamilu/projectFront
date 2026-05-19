'use client';

import { Timeline, TimelineStep } from '@/shared/ui/organisms/timeline';
import { DeliveryDetails } from '../types';
import { Truck, Phone, MessageSquare } from 'lucide-react';
import { cn } from '@/shared/utils';

interface DeliveryTimelineProps {
  details: DeliveryDetails;
  className?: string;
}

export function DeliveryTimeline({ details, className }: DeliveryTimelineProps) {
  // Convert domain DeliveryDetails timeline to generic TimelineStep step array
  const steps: TimelineStep[] = details.timeline.map((step) => ({
    id: step.status,
    title: step.title,
    description: step.description,
    date: step.time,
    status: step.isCompleted ? 'completed' : step.isCurrent ? 'current' : 'upcoming',
  }));

  return (
    <div className={cn("space-y-6 p-6 rounded-2xl border bg-card text-card-foreground shadow-sm", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
            Tracking Details
          </span>
          <h3 className="text-lg font-bold text-foreground mt-0.5 flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary shrink-0" />
            <span>{details.carrier} : {details.trackingNumber}</span>
          </h3>
        </div>

        {details.agentName && (
          <div className="flex items-center gap-3 bg-muted/50 px-4 py-2 rounded-xl border">
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Delivery Associate
              </span>
              <span className="text-sm font-semibold text-foreground">{details.agentName}</span>
            </div>
            <div className="flex items-center gap-1.5 ml-2">
              {details.agentPhone && (
                <a
                  href={`tel:${details.agentPhone}`}
                  className="p-1.5 rounded-lg border bg-background hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-all cursor-pointer"
                  aria-label="Call Delivery Agent"
                >
                  <Phone className="h-4 w-4" />
                </a>
              )}
              <button
                className="p-1.5 rounded-lg border bg-background hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-all cursor-pointer"
                aria-label="Message Delivery Agent"
              >
                <MessageSquare className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="pt-2">
        <Timeline steps={steps} orientation="vertical" />
      </div>
    </div>
  );
}
