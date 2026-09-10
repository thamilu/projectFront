'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/atoms/dialog';
import { Button } from '@/shared/ui/atoms/button';
import { Label } from '@/shared/ui/atoms/label';
import { FileDown, FileText, Database } from 'lucide-react';
import type { DataExportScope } from '../types';
import { ComingSoonNotice } from '../ComingSoonNotice';

interface DataAccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DataAccessModal({ open, onOpenChange }: DataAccessModalProps) {
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [scope, setScope] = useState<DataExportScope>({
    profile: true,
    orders: true,
    addresses: true,
    reviews: true,
    activityLogs: true,
  });
  const handleToggleScope = (key: keyof DataExportScope) => {
    setScope((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // [NOT WIRED UP] No backend archive-generation endpoint exists yet (see
  // ComingSoonNotice) — this used to wait 1.5s and then let the user
  // "download" a file containing none of their real data (just a
  // timestamp and the selected scope flags), for a GDPR/CCPA-style
  // "download my data" request. Submission is now a no-op.
  const handleRequestExport = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1 text-primary">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <FileDown className="h-5 w-5" />
            </span>
            <DialogTitle className="text-xl">Data Access & Export</DialogTitle>
          </div>
          <DialogDescription>
            Download a portable copy of your account profile, transaction history, and activity records.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleRequestExport} className="space-y-4 pt-1">
            <ComingSoonNotice feature="Data export" />

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground">Include in Export:</Label>
              <div className="grid grid-cols-1 gap-2 rounded-xl bg-muted/30 p-3 border border-border/40 text-xs">
                {[
                  { key: 'profile' as const, label: 'Profile identity, contact info & preferences' },
                  { key: 'orders' as const, label: 'Order history, invoices & shipment tracking' },
                  { key: 'addresses' as const, label: 'Saved delivery and billing address book' },
                  { key: 'reviews' as const, label: 'Product reviews, ratings & feedback' },
                  { key: 'activityLogs' as const, label: 'Security & login audit timestamps' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={scope[item.key]}
                      onChange={() => handleToggleScope(item.key)}
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className="text-foreground">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground">Export Format:</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormat('json')}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                    format === 'json'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border/60 hover:bg-muted/30'
                  }`}
                >
                  <Database className="h-4 w-4 text-primary" />
                  <div>
                    <span className="font-semibold text-xs text-foreground block">JSON</span>
                    <span className="text-[11px] text-muted-foreground">Machine readable</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('csv')}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                    format === 'csv'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border/60 hover:bg-muted/30'
                  }`}
                >
                  <FileText className="h-4 w-4 text-primary" />
                  <div>
                    <span className="font-semibold text-xs text-foreground block">CSV</span>
                    <span className="text-[11px] text-muted-foreground">Spreadsheet ready</span>
                  </div>
                </button>
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled title="Not available yet">
                Generate Data Package
              </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
