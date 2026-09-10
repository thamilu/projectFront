'use client';

import { useState } from 'react';
import { Bell, Mail, Smartphone, Tag, Package, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/atoms/card';
import { Switch } from '@/shared/ui/atoms/switch';
import { Label } from '@/shared/ui/atoms/label';
import { Button } from '@/shared/ui/atoms/button';
import { toast } from 'sonner';

interface PrefGroup {
  title: string;
  icon: React.ElementType;
  prefs: { key: string; label: string; desc: string }[];
}

const PREF_GROUPS: PrefGroup[] = [
  {
    title: 'Order Updates',
    icon: Package,
    prefs: [
      { key: 'order_placed', label: 'Order Placed', desc: 'When your order is confirmed' },
      { key: 'order_shipped', label: 'Order Shipped', desc: 'When your order is dispatched' },
      { key: 'order_delivered', label: 'Order Delivered', desc: 'When your order is delivered' },
    ],
  },
  {
    title: 'Deals & Offers',
    icon: Tag,
    prefs: [
      { key: 'flash_deals', label: 'Flash Deals', desc: 'Limited-time flash sale alerts' },
      { key: 'price_drops', label: 'Price Drops', desc: 'When wishlisted items drop in price' },
      { key: 'coupons', label: 'New Coupons', desc: 'Personalized discount codes' },
    ],
  },
  {
    title: 'Account',
    icon: Star,
    prefs: [
      {
        key: 'review_reminder',
        label: 'Review Reminders',
        desc: 'Remind to review delivered orders',
      },
      { key: 'security', label: 'Security Alerts', desc: 'Login from new device or location' },
    ],
  },
];

type Prefs = Record<string, { email: boolean; sms: boolean; push: boolean }>;

export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = useState<Prefs>(
    Object.fromEntries(
      PREF_GROUPS.flatMap((g) =>
        g.prefs.map((p) => [p.key, { email: true, sms: false, push: true }])
      )
    )
  );

  const toggle = (key: string, channel: 'email' | 'sms' | 'push') =>
    setPrefs((p) => ({ ...p, [key]: { ...p[key], [channel]: !p[key][channel] } }));

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <Bell className="text-primary h-6 w-6" />
        <h1 className="text-2xl font-bold">Notification Settings</h1>
      </div>

      {/* Channel Legend */}
      <div className="bg-muted/50 mb-6 flex flex-wrap gap-4 rounded-xl p-4 text-sm">
        <div className="flex items-center gap-1.5">
          <Mail className="h-4 w-4 text-blue-600" /> Email
        </div>
        <div className="flex items-center gap-1.5">
          <Smartphone className="h-4 w-4 text-green-600" /> SMS
        </div>
        <div className="flex items-center gap-1.5">
          <Bell className="h-4 w-4 text-purple-600" /> Push
        </div>
      </div>

      <div className="space-y-5">
        {PREF_GROUPS.map((group) => (
          <Card key={group.title}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <group.icon className="text-primary h-4 w-4" />
                <CardTitle className="text-base">{group.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {group.prefs.map((pref) => (
                <div key={pref.key} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{pref.label}</p>
                    <p className="text-muted-foreground text-xs">{pref.desc}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <Switch
                        id={`${pref.key}-email`}
                        checked={!!prefs[pref.key]?.email}
                        onChange={() => toggle(pref.key, 'email')}
                      />
                      <Label htmlFor={`${pref.key}-email`} className="sr-only">
                        Email
                      </Label>
                      <Mail className="h-3.5 w-3.5 text-blue-500" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Switch
                        id={`${pref.key}-sms`}
                        checked={!!prefs[pref.key]?.sms}
                        onChange={() => toggle(pref.key, 'sms')}
                      />
                      <Label htmlFor={`${pref.key}-sms`} className="sr-only">
                        SMS
                      </Label>
                      <Smartphone className="h-3.5 w-3.5 text-green-500" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Switch
                        id={`${pref.key}-push`}
                        checked={!!prefs[pref.key]?.push}
                        onChange={() => toggle(pref.key, 'push')}
                      />
                      <Label htmlFor={`${pref.key}-push`} className="sr-only">
                        Push
                      </Label>
                      <Bell className="h-3.5 w-3.5 text-purple-500" />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Button className="mt-6" onClick={() => toast.success('Notification preferences saved!')}>
        Save Preferences
      </Button>
    </div>
  );
}
