/**
 * User Profile Page
 * 
 * Optimized, robust profile management page using the unified ProfileForm component.
 * Supports dual-address architecture and conditional seller fields.
 */

import { Metadata } from 'next';
import { ProfileForm } from '@/features/users/components/ProfileForm';

export const metadata: Metadata = {
  title: 'My Profile | eShop',
  description: 'Manage your personal information, address book, and security settings.',
};

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        <ProfileForm />
      </div>
    </div>
  );
}
