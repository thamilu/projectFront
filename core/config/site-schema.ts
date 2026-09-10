/**
 * Site Configuration Schema
 *
 * Zod schemas for runtime validation.
 *
 * @module lib/config/schema
 */

import { z } from 'zod';

export const AuthorSchema = z.object({
  name: z.string().min(1, 'Author name is required'),
  url: z.string().url('Author URL must be valid'),
  email: z.string().email('Must be a valid email'),
});

export const SocialLinksSchema = z.object({
  twitter: z.string().url().optional(),
  github: z.string().url().optional(),
  linkedin: z.string().url().optional(),
  facebook: z.string().url().optional(),
  instagram: z.string().url().optional(),
});

export const PaginationConfigSchema = z.object({
  defaultPageSize: z.number().int().min(1).max(100).default(12),
  maxPageSize: z.number().int().min(1).max(100).default(100),
  searchDebounceMs: z.number().int().min(100).max(2000).default(300),
});

export type PaginationConfig = z.infer<typeof PaginationConfigSchema>;

export const SiteConfigSchema = z.object({
  name: z.string().min(1, 'Site name is required'),
  description: z.string().min(10, 'Description should be at least 10 characters'),
  url: z.string().url('Must be a valid URL'),
  ogImage: z.string().min(1, 'OG image path is required'),
  author: AuthorSchema,
  keywords: z.array(z.string()).min(1, 'At least one keyword required'),
  locale: z.string().regex(/^[a-z]{2}-[A-Z]{2}$/, 'Locale must be in format: en-US'),
  twitterHandle: z
    .string()
    .regex(/^@[a-zA-Z0-9_]{1,15}$/)
    .optional(),
  links: SocialLinksSchema,
  pagination: PaginationConfigSchema.optional(),
  verification: z
    .object({
      google: z.string().optional(),
      yandex: z.string().optional(),
    })
    .optional(),
});

export type SiteConfig = z.infer<typeof SiteConfigSchema>;
