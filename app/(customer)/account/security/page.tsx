'use client';

import { Shield, KeyRound, Laptop2, Smartphone, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/atoms/card';
import { Button } from '@/shared/ui/atoms/button';
import { Badge } from '@/shared/ui/atoms/badge';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';

const MOCK_SESSIONS = [
  { id: '1', device: 'Chrome on Windows', location: 'Bangalore, IN', lastActive: 'Now', current: true },
  { id: '2', device: 'Safari on iPhone', location: 'Chennai, IN', lastActive: '2 hours ago', current: false },
];

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
          <p className="mb-4 text-sm text-muted-foreground">
            Your password is managed by our secure authentication provider. Click below to be redirected to the password change page.
          </p>
          <Button onClick={handleChangePassword} className="gap-2">
            <ExternalLink className="h-4 w-4" />
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
        <CardContent>
          <div className="space-y-3">
            {MOCK_SESSIONS.map(s => (
              <div key={s.id} className="flex items-center gap-3 rounded-lg border p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                  {s.device.includes('iPhone') ? <Smartphone className="h-4 w-4" /> : <Laptop2 className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{s.device}</p>
                    {s.current && <Badge className="text-xs bg-green-100 text-green-700">This device</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{s.location} · {s.lastActive}</p>
                </div>
                {!s.current && (
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive text-xs">
                    Sign out
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
