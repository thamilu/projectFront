'use client';

import React, { useState } from 'react';
import {
  Lock,
  ShieldCheck,
  Laptop,
  KeyRound,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';
import { Badge } from '@/shared/ui/atoms/badge';
import { SettingsSection, SettingsRow } from '@/shared/ui/settings';
import { ChangePasswordModal } from './modals/ChangePasswordModal';
import { MfaEnrollmentModal } from './modals/MfaEnrollmentModal';
import { getKeycloakAccountUrl } from '@/features/auth/services/keycloak-account';
import type { MfaCapability, LoginActivityEvent } from './types';

interface SecuritySectionProps {
  loginActivity?: LoginActivityEvent[];
  mfaCapabilities?: MfaCapability[];
}

export function SecuritySection({
  loginActivity = [],
  mfaCapabilities,
}: SecuritySectionProps) {
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [mfaModalOpen, setMfaModalOpen] = useState(false);

  return (
    <>
      <SettingsSection
        id="security"
        title="Security & Authentication"
        description="Manage password credentials, multi-factor authentication, active sessions, and login security history"
        icon={Lock}
      >
        <div className="space-y-4">
          {/* Password Row */}
          <SettingsRow
            icon={KeyRound}
            title="Password Management"
            description="Keep your account secure with regular credential updates."
            control={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPasswordModalOpen(true)}
                className="font-medium text-xs h-9"
              >
                Change Password
              </Button>
            }
          />

          {/* MFA Row */}
          <SettingsRow
            icon={ShieldCheck}
            title="Two-Factor Authentication (MFA)"
            description="Add a high-assurance secondary verification step to protect against unauthorized access."
            badge={
              <Badge variant="secondary" className="text-[10px] font-semibold px-2 py-0">
                Recommended
              </Badge>
            }
            control={
              <Button
                variant="default"
                size="sm"
                onClick={() => setMfaModalOpen(true)}
                className="font-medium text-xs h-9"
              >
                Enable MFA
              </Button>
            }
          />

          {/* Active Sessions Card */}
          {/*
            This app doesn't track a user's other active sessions itself —
            no backend endpoint for listing/revoking them exists (see
            features/auth/services/keycloak-account.ts's docblock). This
            previously rendered disabled "Sign Out Other Devices"/"Revoke"
            buttons behind a ComingSoonNotice, driven by an initialSessions
            prop no caller ever actually supplied. Keycloak's own Account
            Console already provides real, working device-session listing
            and sign-out for this realm — linking to it is the honest,
            immediately-functional fix.
          */}
          <div className="rounded-xl border border-border/60 bg-muted/15 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Laptop className="h-4 w-4 text-primary" />
                  Active Connected Sessions
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Devices currently signed into your eShop account with active authentication sessions
                </p>
              </div>

              <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                <a
                  href={getKeycloakAccountUrl('sessions')}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Manage Sessions
                  <ExternalLink className="h-3 w-3 ml-1" aria-hidden="true" />
                </a>
              </Button>
            </div>
          </div>

          {/* Login Activity Card */}
          <div className="rounded-xl border border-border/40 bg-muted/10 p-3.5 space-y-2">
            <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              Recent Authentication Events
            </h2>
            {loginActivity.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-1">
                Login activity history isn&apos;t available yet.
              </p>
            ) : (
            <div className="divide-y divide-border/30 text-xs">
              {loginActivity.map((ev) => (
                <div key={ev.id} className="py-2 flex items-center justify-between gap-2">
                  <div>
                    <span className="font-medium text-foreground">{ev.device}</span>
                    <span className="text-muted-foreground ml-2">({ev.location} - {ev.ipAddress})</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>{ev.timestamp}</span>
                    <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">
                      Success
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        </div>
      </SettingsSection>

      {/* Modals */}
      <ChangePasswordModal open={passwordModalOpen} onOpenChange={setPasswordModalOpen} />

      <MfaEnrollmentModal
        open={mfaModalOpen}
        onOpenChange={setMfaModalOpen}
        capabilities={mfaCapabilities}
      />
    </>
  );
}
