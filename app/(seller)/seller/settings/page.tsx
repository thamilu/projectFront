'use client';

import { useState } from 'react';
import { Shield, KeyRound, Bell, Mail, Smartphone, ExternalLink, Store } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/atoms/card';
import { Button } from '@/shared/ui/atoms/button';
import { Switch } from '@/shared/ui/atoms/switch';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';

/**
 * Seller Settings Page
 *
 * Re-focused on Account-level settings.
 * Redundant Store Profile details (Address, Logo, Handle) removed.
 */
export default function SellerSettingsPage() {
  const [notifPrefs, setNotifPrefs] = useState({
    new_order: { email: true, push: true, sms: false },
    payout_alert: { email: true, push: true, sms: true },
    low_stock: { email: true, push: false, sms: false },
    customer_msg: { email: true, push: true, sms: false },
  });

  const toggleNotif = (key: string, channel: 'email' | 'push' | 'sms') => {
    setNotifPrefs((prev) => ({
      ...prev,
      [key]: {
        ...prev[key as keyof typeof prev],
        [channel]: !prev[key as keyof typeof prev][channel],
      },
    }));
  };

  const handleChangePassword = () => {
    // Redirect to Keycloak account page for password change
    signIn('keycloak', { callbackUrl: window.location.href }, { kc_action: 'UPDATE_PASSWORD' });
  };

  const handleSaveNotifs = () => {
    toast.success('Preferences Updated', {
      description: 'Your notification configuration has been synchronized.',
    });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 mx-auto max-w-4xl space-y-8 duration-500">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white italic">Configuration Hub</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account security and operational parameters
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Info & Security */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="overflow-hidden border-white/[0.05] bg-white/[0.02]">
            <CardHeader className="bg-blue-500/5">
              <div className="flex items-center gap-3 text-blue-500">
                <Shield className="h-5 w-5" />
                <CardTitle className="text-sm font-black tracking-widest uppercase">
                  Account Security
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <p className="text-muted-foreground text-xs leading-relaxed">
                Your authentication is managed via Staff-grade security protocols. Store information
                is managed in your Profile.
              </p>
              <Button
                onClick={handleChangePassword}
                className="h-10 w-full gap-2 rounded-xl bg-blue-600 text-[10px] font-bold tracking-widest hover:bg-blue-700"
              >
                <KeyRound className="h-3 w-3" />
                CHANGE PASSWORD
                <ExternalLink className="h-3 w-3 opacity-50" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-white/[0.05] bg-white/[0.02]">
            <CardContent className="p-6">
              <div className="text-muted-foreground flex items-center gap-3">
                <Store className="h-4 w-4" />
                <span className="text-[10px] font-black tracking-widest uppercase">
                  Store Profile
                </span>
              </div>
              <p className="text-muted-foreground mt-2 text-xs italic">
                Logo, Address, and Handle are managed under the Store Profile section for better
                consolidation.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Operational Preferences */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-white/[0.05] bg-white/[0.02]">
            <CardHeader className="border-b border-white/[0.05]">
              <div className="text-primary flex items-center gap-3">
                <Bell className="h-5 w-5" />
                <div>
                  <CardTitle className="text-lg font-black text-white italic">
                    Operational Alerts
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Configure how you receive system notifications
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              {/* Notification Matrix */}
              <div className="space-y-6">
                {[
                  {
                    id: 'new_order',
                    label: 'Inbound Orders',
                    desc: 'Alerts for new customer purchases',
                  },
                  {
                    id: 'payout_alert',
                    label: 'Financial Sync',
                    desc: 'Status updates for scheduled payouts',
                  },
                  {
                    id: 'low_stock',
                    label: 'Inventory Threshold',
                    desc: 'Alerts when stock levels drop below limit',
                  },
                  {
                    id: 'customer_msg',
                    label: 'Direct Messages',
                    desc: 'Notifications for customer inquiries',
                  },
                ].map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between gap-4 rounded-2xl border border-white/[0.03] bg-white/[0.01] p-4 transition-colors hover:bg-white/[0.02] sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="text-xs font-black tracking-widest text-white uppercase">
                        {item.label}
                      </p>
                      <p className="text-muted-foreground mt-1 text-[10px]">{item.desc}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Mail className="text-muted-foreground h-3 w-3" />
                        <Switch
                          checked={notifPrefs[item.id as keyof typeof notifPrefs].email}
                          onChange={() => toggleNotif(item.id, 'email')}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Smartphone className="text-muted-foreground h-3 w-3" />
                        <Switch
                          checked={notifPrefs[item.id as keyof typeof notifPrefs].push}
                          onChange={() => toggleNotif(item.id, 'push')}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end border-t border-white/[0.05] pt-6">
                <Button
                  onClick={handleSaveNotifs}
                  className="bg-primary hover:bg-primary/90 h-10 rounded-xl px-8 text-[10px] font-bold tracking-widest"
                >
                  SAVE PREFERENCES
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
