/**
 * Authentication Domain Validation Schemas
 *
 * This file previously also declared a much larger catalog of Zod schemas
 * for a traditional email/password login/registration/password-reset flow
 * (UserRoleSchema, LoginRequestSchema, RegisterRequestSchema,
 * AccessTokenPayloadSchema, SessionDataSchema, CallbackQuerySchema,
 * OAuthErrorSchema, TokenResponseSchema, UserProfileSchema,
 * UpdateProfileSchema, ResetPasswordRequestSchema, ResetPasswordSchema,
 * RoleCheckSchema, AuthErrorSchema) — this app authenticates exclusively
 * via Keycloak SSO (see services/auth.constants.ts), so none of that ever
 * had a real caller; confirmed zero consumers anywhere in the codebase and
 * removed. ChangePasswordSchema survives because it backs a real,
 * currently-used feature (changing a Keycloak-managed account's password
 * from the settings page), not a traditional login flow.
 */

import { z } from 'zod';

/**
 * Change password request
 */
export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password too long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

export type ChangePassword = z.infer<typeof ChangePasswordSchema>;
