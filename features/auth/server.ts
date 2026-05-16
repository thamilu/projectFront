/**
 * Server-only API for Auth Feature
 * 
 * This file should only be imported in Server Components or Server Actions.
 */

export { auth as getSession } from '@/auth';
export * from './server-utils';
