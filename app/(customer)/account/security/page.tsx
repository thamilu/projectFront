'use client';

import { Shield, KeyRound, ExternalLink, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/atoms/card';
import { Button } from '@/shared/ui/atoms/button';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { getKeycloakAccountUrl } from '@/features/auth/services/keycloak-account';

export default function AccountSecurityPage() {
  const handleChangePassword = () => {
    // Redirect to Keycloak account page for password change
    signIn('keycloak', { callbackUrl: window.location.href }, { kc_action: 'UPDATE_PASSWORD' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="container mx-auto max-w-2xl px-4 py-10"
    >
      <h1 className="mb-6 text-2xl font-bold">Security</h1>

      {/* Password */}
      <Card className="mb-5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
              <KeyRound className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-base">Password</CardTitle>
              <CardDescription>Managed securely via Keycloak</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4 text-sm">
            Your password is managed by our secure authentication provider. Click below to be
            redirected to the password change page.
          </p>
          <Button onClick={handleChangePassword} className="gap-2">
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Change Password
          </Button>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900">
              <Shield className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <CardTitle className="text-base">Active Sessions</CardTitle>
              <CardDescription>Devices currently signed in to your account</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/*
            This app doesn't track a user's other active sessions itself —
            NextAuth only ever sees the current browser's session, and no
            backend endpoint for listing/revoking other sessions exists (see
            keycloak-account.ts's docblock). This previously showed two
            hardcoded, specific-looking fake sessions ("Chrome on Windows,
            Bangalore, IN, Now" / "Safari on iPhone, Chennai, IN, 2 hours
            ago") with a "Sign out" button that had no onClick handler at
            all — exactly the kind of thing someone checking this page
            because they suspect their account was compromised would
            reasonably, and wrongly, trust. Keycloak's own Account Console
            already provides real, working device-session listing and
            per-device/all-device sign-out for this realm — linking to it is
            the honest, immediately-functional fix, not a fabricated preview.
          */}
          <p className="text-muted-foreground text-sm">
            Manage the devices signed in to your account — including signing out sessions you
            don&apos;t recognize — from your secure authentication provider.
          </p>
          <Button asChild variant="outline" className="gap-2">
            <a
              href={getKeycloakAccountUrl('sessions')}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Manage Active Sessions
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
