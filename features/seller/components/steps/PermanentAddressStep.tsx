"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddressFields } from '@/shared/components/AddressFields';
import { StepLayout } from '@/shared/components/StepLayout';

export function PermanentAddressStep() {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <StepLayout
      title="Permanent Address"
      description="Provide your official residential address for identity verification."
    >
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className={`h-8 px-3 text-[10px] font-bold uppercase tracking-widest transition-all ${
              isEditing ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'text-muted-foreground hover:text-primary'
            }`}
          >
            {isEditing ? (
              <><Lock className="mr-2 h-3 w-3" /> Lock & Save</>
            ) : (
              <><Edit2 className="mr-2 h-3 w-3" /> Edit Address</>
            )}
          </Button>
        </div>

        <AddressFields 
          showTitle={false}
          description=""
          disabled={!isEditing}
        />
      </div>
    </StepLayout>
  );
}
