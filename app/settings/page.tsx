'use client';

import { useAuthStore } from '@/store/auth-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import { User, Lock, Bell, Globe, Shield } from 'lucide-react';
import { APP_ROUTES } from '@/constants/routes/app-routes';

export default function SettingsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(APP_ROUTES.AUTH_LOGIN);
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      <Header />
      <div className="container mx-auto grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 px-4 md:px-6 py-6">
        <Sidebar />
        <main className="space-y-6">
          {/* Header */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <User className="h-6 w-6" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Manage your account preferences and settings
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Profile Settings */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Username</label>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    {user?.preferred_username || user?.sub}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    {user?.email || 'Not set'}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">First Name</label>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    {user?.firstName || 'Not set'}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Last Name</label>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    {user?.lastName || 'Not set'}
                  </div>
                </div>
              </div>
              <Button className="mt-4" variant="outline">
                Edit Profile
              </Button>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Security
              </CardTitle>
              <CardDescription>Manage your password and security preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <div className="font-medium">Password</div>
                  <div className="text-sm text-muted-foreground">Last changed 30 days ago</div>
                </div>
                <Button variant="outline" size="sm">
                  Change Password
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <div className="font-medium">Two-Factor Authentication</div>
                  <div className="text-sm text-muted-foreground">Add an extra layer of security</div>
                </div>
                <Button variant="outline" size="sm">
                  Enable
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Email Notifications', desc: 'Receive updates via email', enabled: true },
                { label: 'Order Updates', desc: 'Get notified about order status changes', enabled: true },
                { label: 'Marketing Emails', desc: 'Receive promotional content', enabled: false },
                { label: 'SMS Notifications', desc: 'Get text message alerts', enabled: false }
              ].map((setting, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <div className="font-medium">{setting.label}</div>
                    <div className="text-sm text-muted-foreground">{setting.desc}</div>
                  </div>
                  <Button 
                    variant={setting.enabled ? "default" : "outline"} 
                    size="sm"
                  >
                    {setting.enabled ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Language & Region */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Language & Region
              </CardTitle>
              <CardDescription>Set your language and regional preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Language</label>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    English (US)
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Currency</label>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    INR (₹)
                  </div>
                </div>
              </div>
              <Button variant="outline">
                Update Preferences
              </Button>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy
              </CardTitle>
              <CardDescription>Control your privacy settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <div className="font-medium">Profile Visibility</div>
                  <div className="text-sm text-muted-foreground">Control who can see your profile</div>
                </div>
                <Button variant="outline" size="sm">
                  Public
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <div className="font-medium">Activity Status</div>
                  <div className="text-sm text-muted-foreground">Show when you're online</div>
                </div>
                <Button variant="outline" size="sm">
                  Visible
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-2 border-red-200 dark:border-red-900">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <div>
                  <div className="font-medium text-red-600 dark:text-red-400">Delete Account</div>
                  <div className="text-sm text-muted-foreground">Permanently delete your account and all data</div>
                </div>
                <Button variant="destructive" size="sm">
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
