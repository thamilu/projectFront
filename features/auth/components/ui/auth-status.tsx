'use client'

import { useSession } from 'next-auth/react'
import { Badge } from '@/components/ui/badge'
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react'

export function AuthStatus() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <Badge variant="secondary" className="gap-1">
        <Shield className="h-3 w-3 animate-pulse" />
        Checking...
      </Badge>
    )
  }

  if (session?.error) {
    return (
      <Badge variant="destructive" className="gap-1">
        <ShieldAlert className="h-3 w-3" />
        Session Error
      </Badge>
    )
  }

  if (session) {
    return (
      <Badge variant="default" className="gap-1">
        <ShieldCheck className="h-3 w-3" />
        Authenticated
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="gap-1">
      <Shield className="h-3 w-3" />
      Not Signed In
    </Badge>
  )
}
