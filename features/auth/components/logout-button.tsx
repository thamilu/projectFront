'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { logoutAndRedirect } from '@/lib/auth/client-logout'

interface LogoutButtonProps {
  className?: string
}

export function LogoutButton({ className }: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  return (
    <Button
      variant="ghost"
      disabled={isLoggingOut}
      onClick={async () => {
        if (isLoggingOut) return
        setIsLoggingOut(true)
        await logoutAndRedirect({ redirectTo: '/login' })
      }}
      className={className}
    >
      <LogOut className="mr-2 h-4 w-4" />
      Sign Out
    </Button>
  )
}
