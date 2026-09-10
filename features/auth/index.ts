/**
 * Public API for Auth Feature
 */

// Hooks
// useAuth/AuthStateProvider live in domains/auth (moved out of this feature
// so shared/ and core/ code — which needs them but must not depend on
// features/ — have a legitimate import target). Re-exported here so every
// existing '@/features/auth' consumer keeps working unchanged.
export { useAuth, AuthStateProvider } from '@/domains/auth/hooks/use-auth';
export type { AuthState, AuthStateProviderProps } from '@/domains/auth/hooks/use-auth';
export { useKeycloakLogin } from './hooks/use-keycloak-login';
export { useAuthRedirect } from './hooks/use-auth-redirect';
export { useSessionExpiredAlert } from './hooks/use-session-expired-alert';
export { useErrorMessage } from './hooks/use-error-message';

// Guards
export { AuthGuard } from './components/guards/AuthGuard';
export { CustomerGuard } from './components/guards/CustomerGuard';
export { createRoleGuard } from './components/guards/createRoleGuard';
export type { RoleGuardProps } from './components/guards/createRoleGuard';

// UI Components
export { LogoutButton } from './components/ui/LogoutButton';
export { ModernAuthUI } from './components/ui/ModernAuthUI';
export { AuthAlert } from './components/ui/AuthAlert';
export { LoginLayout } from './components/ui/LoginLayout';
export { LoginCard } from './components/ui/LoginCard';
export { LoginLogo } from './components/ui/LoginLogo';
export { RetryButton } from './components/ui/RetryButton';
export { LoginLoadingState } from './components/ui/LoginLoadingState';

// Redirects
export { RedirectingScreen } from './components/redirects/redirecting-screen';

// Services
export { authService } from '@/domains/auth/services/auth-service';
export { getKeycloakAccountUrl } from './services/keycloak-account';
export type { AccountConsoleSection } from './services/keycloak-account';

// Types & Schemas
// This barrel previously re-exported everything from
// features/auth/types/auth.types.ts (UserRole, NormalizedSession) — that
// file merged into domains/auth/contracts/auth.types.ts, which now also
// carries UserDTO/User/LoginRequest/RegisterRequest/AuthResponse. Named
// exports (not `export *`) keep this barrel's public surface exactly what
// it was before the move, not implicitly widened by the merge.
export { UserRole } from '@/domains/auth/contracts/auth.types';
export type { NormalizedSession } from '@/domains/auth/contracts/auth.types';
export { ChangePasswordSchema } from './schemas/auth.schema';
export type { ChangePassword } from './schemas/auth.schema';

// Server-side auth utilities should be imported from '@/features/auth/server'
