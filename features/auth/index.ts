/**
 * Public API for Auth Feature
 */

// Hooks
export { useAuth } from './hooks/use-auth';

// Guards
export { AuthGuard } from './components/guards/AuthGuard';
export { ProtectedRoute } from './components/guards/ProtectedRoute';

// UI Components
export { LogoutButton } from './components/ui/LogoutButton';
export { ModernAuthUI } from './components/ui/ModernAuthUI';
export { AuthStatus } from './components/ui/auth-status';

// Navigation
export { UserNav } from './components/navigation/user-nav';

// Redirects
export { RoleBasedRedirect } from './components/redirects/role-redirect';
export { RedirectingScreen } from './components/redirects/redirecting-screen';

// Store & Services
export { useAuthStore } from './store/auth-store';
export { authService } from './services/auth-service';

// Types & Schemas
export * from './types/auth.types';
export * from './schemas/auth.schema';

// Server-side auth utilities should be imported from '@/features/auth/server'
