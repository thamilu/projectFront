/**
 * 403 Forbidden Page
 * 
 * Displayed when authenticated user lacks required permissions
 */

import { ShieldX } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
 

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldX className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">Access Denied</CardTitle>
          <CardDescription className="text-base">
            You don't have permission to access this resource
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-2 text-sm font-medium">Why am I seeing this?</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• You're logged in but lack the required role</li>
              <li>• This page is restricted to specific user types</li>
              <li>• Contact your administrator to request access</li>
            </ul>
          </div>
        </CardContent>
        
        {/* Interactive actions are implemented in a client component */}
        <Error403Client />
      </Card>
    </div>
  );
}

import Error403Client from './Error403Client';
