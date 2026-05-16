import { redirect } from 'next/navigation';

/**
 * Customer Dashboard Page
 * 
 * REDUNDANT: This page has been unified with the root Home Page.
 * Authenticated customers now see their dashboard at the root URL ('/').
 */
export default function CustomerDashboardRedirect() {
  redirect('/');
}
