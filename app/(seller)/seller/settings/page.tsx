'use client';

import { useState } from 'react';
import { 
  Shield, 
  KeyRound, 
  Bell, 
  Mail, 
  Smartphone, 
  ExternalLink,
  Store
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

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
    setNotifPrefs(prev => ({
      ...prev,
      [key]: { ...prev[key as keyof typeof prev], [channel]: !prev[key as keyof typeof prev][channel] }
    }));
  };

  const handleChangePassword = () => {
    // Redirect to Keycloak account page for password change
    signIn('keycloak', { callbackUrl: window.location.href }, { kc_action: 'UPDATE_PASSWORD' });
  };

  const handleSaveNotifs = () => {
    toast.success('Preferences Updated', {
      description: 'Your notification configuration has been synchronized.'
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black text-white italic tracking-tight">Configuration Hub</h1>
        <p className="text-muted-foreground mt-2">Manage your account security and operational parameters</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Info & Security */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-white/[0.02] border-white/[0.05] overflow-hidden">
            <CardHeader className="bg-blue-500/5">
              <div className="flex items-center gap-3 text-blue-500">
                <Shield className="h-5 w-5" />
                <CardTitle className="text-sm font-black uppercase tracking-widest">Account Security</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your authentication is managed via Staff-grade security protocols. Store information is managed in your Profile.
              </p>
              <Button 
                onClick={handleChangePassword} 
                className="w-full bg-blue-600 hover:bg-blue-700 h-10 rounded-xl font-bold tracking-widest text-[10px] gap-2"
              >
                <KeyRound className="h-3 w-3" />
                CHANGE PASSWORD
                <ExternalLink className="h-3 w-3 opacity-50" />
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.02] border-white/[0.05]">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Store className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Store Profile</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground italic">
                Logo, Address, and Handle are managed under the Store Profile section for better consolidation.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Operational Preferences */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white/[0.02] border-white/[0.05]">
            <CardHeader className="border-b border-white/[0.05]">
              <div className="flex items-center gap-3 text-primary">
                <Bell className="h-5 w-5" />
                <div>
                  <CardTitle className="text-lg font-black text-white italic">Operational Alerts</CardTitle>
                  <CardDescription className="text-xs">Configure how you receive system notifications</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              
              {/* Notification Matrix */}
              <div className="space-y-6">
                {[
                  { id: 'new_order', label: 'Inbound Orders', desc: 'Alerts for new customer purchases' },
                  { id: 'payout_alert', label: 'Financial Sync', desc: 'Status updates for scheduled payouts' },
                  { id: 'low_stock', label: 'Inventory Threshold', desc: 'Alerts when stock levels drop below limit' },
                  { id: 'customer_msg', label: 'Direct Messages', desc: 'Notifications for customer inquiries' },
                ].map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.01] border border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <div>
                      <p className="text-xs font-black text-white uppercase tracking-widest">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{item.desc}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <Switch 
                          checked={notifPrefs[item.id as keyof typeof notifPrefs].email}
                          onChange={() => toggleNotif(item.id, 'email')}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-3 w-3 text-muted-foreground" />
                        <Switch 
                          checked={notifPrefs[item.id as keyof typeof notifPrefs].push}
                          onChange={() => toggleNotif(item.id, 'push')}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-white/[0.05] flex justify-end">
                <Button 
                  onClick={handleSaveNotifs}
                  className="bg-primary hover:bg-primary/90 h-10 px-8 rounded-xl font-bold tracking-widest text-[10px]"
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
