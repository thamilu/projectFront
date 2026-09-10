/**
 * Re-exports the real user schema from `@/domains/customer/domain/user.schema`.
 * This is the actively-used import path across the app (14 real consumers as
 * of the last audit) — not a deprecated compatibility shim awaiting removal.
 */
export * from '@/domains/customer/domain/user.schema';
