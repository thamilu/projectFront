'use client';

import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/atoms/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/atoms/dropdown-menu';
import { LogoutButton } from '../ui/LogoutButton';
import { LoginButton } from '../ui/login-button';
import { User, Settings, Store, Truck } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { APP_ROUTES } from '@/shared/constants/routes/app-routes';

export function UserNav() {
  const { data: session, status } = useSession();

  // Check roles
  const { isSeller, isDeliveryAgent } = useMemo(() => {
    const roles = (session?.roles || []) as string[];
    return {
      isSeller: roles.includes('SELLER'),
      isDeliveryAgent: roles.includes('DELIVERY_AGENT'),
    };
  }, [session]);

  if (status === 'loading') {
    return <div className="bg-muted h-8 w-8 animate-pulse rounded-full" />;
  }

  if (!session) {
    return <LoginButton />;
  }

  const initials =
    session.user?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="focus:ring-primary relative h-8 w-8 rounded-full focus:ring-2 focus:ring-offset-2 focus:outline-none">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session.user?.image || ''} alt={session.user?.name || ''} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{session.user?.name}</p>
            <p className="text-muted-foreground text-xs">{session.user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href={isSeller ? '/seller/profile' : '/settings'}
            className="cursor-pointer"
          >
            <User className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        
        {!isSeller && (
          <DropdownMenuItem asChild>
            <Link href={APP_ROUTES.SELLER.REGISTER} className="text-blue-600 dark:text-blue-400 font-medium cursor-pointer">
              <Store className="mr-2 h-4 w-4" />
              Become a Seller
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        
        {isSeller && (
          <DropdownMenuItem asChild>
            <Link href={APP_ROUTES.SELLER.DASHBOARD} className="cursor-pointer text-blue-600 dark:text-blue-400 font-medium font-medium">
              <Store className="mr-2 h-4 w-4" />
              Seller Dashboard
            </Link>
          </DropdownMenuItem>
        )}

        {isDeliveryAgent && (
          <DropdownMenuItem asChild>
            <Link href={APP_ROUTES.DELIVERY.DASHBOARD} className="cursor-pointer text-green-600 dark:text-green-400 font-medium">
              <Truck className="mr-2 h-4 w-4" />
              Delivery Dashboard
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="p-0">
          <LogoutButton className="w-full justify-start" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
