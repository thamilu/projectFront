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
import {
  ShieldCheck,
  Smartphone,
  Key,
  Copy,
  Check,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import type { MfaCapability } from '../types';
import { ComingSoonNotice } from '../ComingSoonNotice';

interface MfaEnrollmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  capabilities?: MfaCapability[];
}

const DEFAULT_CAPABILITIES: MfaCapability[] = [
  {
    id: 'totp',
    label: 'Authenticator App (TOTP)',
    description: 'Use Google Authenticator, Authy, 1Password, or Microsoft Authenticator.',
    enabled: false,
    supportedByBackend: true,
  },
  {
    id: 'sms',
    label: 'SMS Authentication',
    description: 'Receive secure one-time verification codes sent via SMS text message.',
    enabled: false,
    supportedByBackend: true,
  },
  {
    id: 'security_key',
    label: 'Hardware Security Key (FIDO2 / WebAuthn)',
    description: 'Use a physical YubiKey or device biometric hardware key.',
    enabled: false,
    supportedByBackend: true,
  },
];

export function MfaEnrollmentModal({
  open,
  onOpenChange,
  capabilities = DEFAULT_CAPABILITIES,
}: MfaEnrollmentModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedMethod, setSelectedMethod] = useState<string>('totp');
  const [secretKey] = useState('HX5D-9K2Q-M8LP-4R7T');
  const [verificationCode, setVerificationCode] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  const supportedCapabilities = capabilities.filter((c) => c.supportedByBackend);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(secretKey.replace(/-/g, ''));
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // [NOT WIRED UP] There is no real TOTP-verification backend to call yet
  // (see ComingSoonNotice) — this used to simulate success for any code
  // except the literal string '000000', and on "success" showed a step 4
  // with a hardcoded set of "recovery codes" IDENTICAL for every single
  // user who reached it (MOCK_RECOVERY_CODES, now removed) — a real
  // credential-sharing hazard had anyone ever relied on it as if it were
  // live. Verification is now a no-op and step 4 no longer exists.
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleClose = () => {
    setStep(1);
    setVerificationCode('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1 text-primary">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <DialogTitle className="text-xl">Two-Factor Authentication (MFA)</DialogTitle>
          </div>
          <DialogDescription>
            Step {step} of 3: {step === 1 && 'Select Authentication Method'}
            {step === 2 && 'Scan QR Code or Enter Secret Key'}
            {step === 3 && 'Verify Authenticator Code'}
          </DialogDescription>
        </DialogHeader>

        <ComingSoonNotice feature="Two-factor authentication" />

        {/* STEP 1: SELECT METHOD */}
        {step === 1 && (
          <div className="space-y-4 pt-2">
            <p className="text-xs text-muted-foreground">
              Select an MFA method supported by your account security policy:
            </p>

            <div className="space-y-2.5">
              {supportedCapabilities.map((cap) => (
                <button
                  key={cap.id}
                  type="button"
                  onClick={() => setSelectedMethod(cap.id)}
                  className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                    selectedMethod === cap.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border/60 hover:bg-muted/30'
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-primary mt-0.5">
                    {cap.id === 'totp' && <Smartphone className="h-5 w-5" />}
                    {cap.id === 'sms' && <Smartphone className="h-5 w-5" />}
                    {cap.id === 'security_key' && <Key className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-foreground">{cap.label}</span>
                      {selectedMethod === cap.id && (
                        <span className="h-4 w-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          <Check className="h-2.5 w-2.5" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{cap.description}</p>
                  </div>
                </button>
              ))}
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="button" onClick={() => setStep(2)}>
                Continue
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* STEP 2: QR CODE & SECRET */}
        {step === 2 && (
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/40">
              {/* Simulated SVG QR Code */}
              <div className="flex h-36 w-36 shrink-0 items-center justify-center rounded-lg bg-white p-2 border border-slate-200 shadow-xs">
                <svg viewBox="0 0 100 100" className="h-full w-full fill-slate-900">
                  <path d="M0 0h30v30H0zm4 4h22v22H4zM10 10h10v10H10zM70 0h30v30H70zm4 4h22v22H74zM80 10h10v10H80zM0 70h30v30H0zm4 4h22v22H4zM10 80h10v10H10zM40 10h10v10H40zM55 10h10v10H55zM40 25h10v10H40zM40 40h20v20H40zM65 40h10v10H65zM80 40h20v10H80zM40 70h10v30H40zM60 70h15v10H60zM80 70h10v20H80zM60 85h30v15H60z" />
                </svg>
              </div>

              <div className="space-y-2 text-center sm:text-left">
                <p className="text-xs text-muted-foreground">
                  Scan this QR code in your authenticator app (Google Authenticator, Authy, 1Password), or enter the setup key manually:
                </p>
                <div className="flex items-center gap-2">
                  <code className="bg-background border border-border/80 px-2 py-1 rounded text-xs font-mono font-bold tracking-wider text-primary">
                    {secretKey}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyKey}
                    className="h-7 px-2 text-xs"
                  >
                    {copiedKey ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button type="button" onClick={() => setStep(3)}>
                Next: Verify Code
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* STEP 3: VERIFY 6-DIGIT CODE */}
        {step === 3 && (
          <form onSubmit={handleVerifyCode} className="space-y-4 pt-2">
            <p className="text-xs text-muted-foreground">
              Enter the 6-digit verification code displayed in your authenticator application to verify synchronization:
            </p>

            <div className="space-y-2">
              <Label htmlFor="mfa-code" className="text-sm font-semibold">
                6-Digit Security Code
              </Label>
              <Input
                id="mfa-code"
                type="text"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="text-center font-mono text-xl tracking-[0.4em] font-bold h-12"
                required
                autoFocus
              />
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button type="submit" disabled title="Not available yet">
                Verify & Activate
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
