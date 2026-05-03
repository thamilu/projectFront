/**
 * Authentication Domain Validation Schemas
 * 
 * Provides runtime validation for authentication-related data
 * Uses Zod for type-safe validation with TypeScript inference
 */

import { z } from 'zod';

// ============================================================================
// User Role Schema
// ============================================================================

export const UserRoleSchema = z.enum([
  'customer',
  'farmer',
  'seller',
  'delivery',
  'retail',
  'wholesale',
  'manager',
  'admin',
]);

// ============================================================================
// Login & Registration Schemas
// ============================================================================

/**
 * Login request validation
 * 
 * Used for traditional email/password login
 * (Note: Keycloak SSO doesn't use this - kept for reference)
 */
export const LoginRequestSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .min(1, 'Email is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long'),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

/**
 * Registration request validation
 * 
 * Enforces strong password requirements:
 * - At least 8 characters
 * - Contains uppercase letter
 * - Contains lowercase letter
 * - Contains number
 * - Contains special character
 */
export const RegisterRequestSchema = z
  .object({
    email: z
      .string()
      .email('Invalid email address')
      .min(1, 'Email is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password too long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(
        /[^A-Za-z0-9]/,
        'Password must contain at least one special character'
      ),
    confirmPassword: z.string(),
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(100, 'First name too long'),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(100, 'Last name too long'),
    acceptTerms: z.boolean().refine((v) => v === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

// ============================================================================
// Token Schemas
// ============================================================================

/**
 * Access token payload validation
 */
export const AccessTokenPayloadSchema = z.object({
  sub: z.string(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  realm_access: z
    .object({
      roles: z.array(z.string()),
    })
    .optional(),
  resource_access: z
    .record(
      z.string(),
      z.object({ roles: z.array(z.string()) })
    )
    .optional(),
  exp: z.number(),
  iat: z.number(),
  iss: z.string(),
  aud: z.union([z.string(), z.array(z.string())]),
});
/**
 * Session data validation
 */
export const SessionDataSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email().optional(),
  name: z.string().optional(),
  roles: z.array(UserRoleSchema),
  accessToken: z.string().min(1),
  refreshToken: z.string().optional(),
  idToken: z.string().min(1),
  expiresAt: z.number().positive(),
});

export type SessionData = z.infer<typeof SessionDataSchema>;

// ============================================================================
// OAuth2 Callback Schemas
// ============================================================================

/**
 * OAuth2 callback query parameters
 */
export const CallbackQuerySchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});

export type CallbackQuery = z.infer<typeof CallbackQuerySchema>;

/**
 * OAuth2 error response
 */
export const OAuthErrorSchema = z.object({
  error: z.string(),
  error_description: z.string().optional(),
  error_uri: z.string().url().optional(),
});

export type OAuthError = z.infer<typeof OAuthErrorSchema>;

// ============================================================================
// Token Response Schemas
// ============================================================================

/**
 * Token endpoint response validation
 */
export const TokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  id_token: z.string(),
  expires_in: z.number().positive(),
  token_type: z.string(),
  scope: z.string().optional(),
});

export type TokenResponse = z.infer<typeof TokenResponseSchema>;

// ============================================================================
// User Profile Schemas
// ============================================================================

/**
 * User profile validation
 */
export const UserProfileSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  picture: z.string().url().optional(),
  emailVerified: z.boolean().default(false),
  phoneNumber: z.string().optional(),
  phoneNumberVerified: z.boolean().default(false),
  roles: z.array(UserRoleSchema),
  createdAt: z.coerce.date(),
  lastLoginAt: z.coerce.date().nullable(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

/**
 * User profile update request
 */
export const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional(),
});

export type UpdateProfile = z.infer<typeof UpdateProfileSchema>;

// ============================================================================
// Password Management Schemas
// ============================================================================

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
      .regex(
        /[^A-Za-z0-9]/,
        'Password must contain at least one special character'
      ),
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

/**
 * Reset password request (email-based)
 */
export const ResetPasswordRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;

/**
 * Reset password completion
 */
export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password too long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(
        /[^A-Za-z0-9]/,
        'Password must contain at least one special character'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPassword = z.infer<typeof ResetPasswordSchema>;

// ============================================================================
// Permission Schemas
// ============================================================================

/**
 * Role check request
 */
export const RoleCheckSchema = z.object({
  requiredRoles: z.array(UserRoleSchema).min(1),
  requireAll: z.boolean().default(false),
});

export type RoleCheck = z.infer<typeof RoleCheckSchema>;

// ============================================================================
// Auth Error Schema
// ============================================================================

/**
 * Authentication error response
 */
export const AuthErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  description: z.string().optional(),
  timestamp: z.coerce.date(),
});

export type AuthError = z.infer<typeof AuthErrorSchema>;
