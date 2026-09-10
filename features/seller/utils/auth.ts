import { Session } from 'next-auth';

export interface AppSession extends Session {
  user: {
    id: string;
    roles: string[];
    firstName: string;
    lastName: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function getNormalizedRoles(session: AppSession | null): string[] {
  return (session?.user?.roles || []).map((r: string) => String(r).toUpperCase());
}
