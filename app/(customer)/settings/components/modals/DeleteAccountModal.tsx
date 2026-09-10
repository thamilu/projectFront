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
import { Input } from '@/shared/ui/atoms/input';
import { Label } from '@/shared/ui/atoms/label';
import { AlertTriangle, Download, Trash2 } from 'lucide-react';
import { ComingSoonNotice } from '../ComingSoonNotice';

interface DeleteAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username?: string;
  onRequestDataExport?: () => void;
}

export function DeleteAccountModal({
  open,
  onOpenChange,
  username,
  onRequestDataExport,
}: DeleteAccountModalProps) {
  const [confirmationPhrase, setConfirmationPhrase] = useState('');
  const [password, setPassword] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);

  // [NOT WIRED UP] No backend call is made here (see ComingSoonNotice) — this
  // used to wait 1.2s and call onSuccess() unconditionally once the typed
  // phrase/password fields were merely non-empty, permanently "deleting"
  // nothing while telling the user their account and data were erased. The
  // password field was also never actually verified against anything.
  const handleDelete = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleClose = () => {
    setConfirmationPhrase('');
    setPassword('');
    setAcknowledged(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1 text-destructive">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10">
              <Trash2 className="h-5 w-5" />
            </span>
            <DialogTitle className="text-xl">Delete Account</DialogTitle>
          </div>
          <DialogDescription>
            Permanently delete your eShop account and associated personal data.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleDelete} className="space-y-4 pt-1">
          {/* Critical Warning Callout */}
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3.5 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-semibold text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              This action is permanent and cannot be reversed
            </div>
            <ul className="space-y-1 text-muted-foreground list-disc pl-4 leading-relaxed">
              <li>All personal profile details, saved addresses, and payment methods will be erased.</li>
              <li>Order history and invoice downloads will no longer be accessible online.</li>
              <li>Unused wallet balances and promotional store credits will be forfeited immediately.</li>
              <li>
                <span className="font-medium text-foreground">Statutory notice:</span> Tax invoices and past transaction audit records will be retained in accordance with applicable legal retention requirements.
              </li>
            </ul>
          </div>

          {/* Prompt to download backup */}
          {onRequestDataExport && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/40 text-xs">
              <span className="text-muted-foreground">Want to keep a copy of your purchase data?</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  handleClose();
                  onRequestDataExport();
                }}
                className="h-7 text-xs gap-1"
              >
                <Download className="h-3 w-3" />
                Export Data
              </Button>
            </div>
          )}

          <ComingSoonNotice feature="Account deletion" />

          {/* Acknowledgement Checkbox */}
          <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-0.5 rounded border-border/80 text-destructive focus:ring-destructive h-4 w-4"
            />
            <span className="text-foreground leading-normal">
              I understand that deleting my account {username ? `(${username})` : ''} is permanent and irreversible.
            </span>
          </label>

          {/* Typed Confirmation Phrase */}
          <div className="space-y-1.5">
            <Label htmlFor="confirm-delete-phrase" className="text-xs">
              Type <span className="font-mono font-bold text-destructive">DELETE</span> to confirm:
            </Label>
            <Input
              id="confirm-delete-phrase"
              type="text"
              value={confirmationPhrase}
              onChange={(e) => setConfirmationPhrase(e.target.value)}
              placeholder="Type DELETE"
              className="font-mono text-sm"
              required
            />
          </div>

          {/* Password Re-authentication */}
          <div className="space-y-1.5">
            <Label htmlFor="delete-password-challenge" className="text-xs">
              Confirm your current password:
            </Label>
            <Input
              id="delete-password-challenge"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter current password"
              required
            />
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled title="Not available yet">
              Permanently Delete Account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
