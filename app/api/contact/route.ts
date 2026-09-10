/**
 * POST /api/contact
 *
 * Accepts a support enquiry from the public contact form and forwards it to
 * the backend support service.
 *
 * [CORRECTNESS] The contact page previously had no endpoint at all. Its
 * `onSubmit` ignored the form data, awaited an 800ms `setTimeout`, and rendered
 * *"Message sent! We'll get back to you within 24 hours."* Every enquiry —
 * including complaints and pre-purchase questions — was discarded while the
 * sender believed it had been received.
 *
 * [SECURITY] This is one of the few genuinely public write endpoints in the
 * application, which makes it the most attractive abuse target: a public form
 * that reaches a human inbox is a spam relay if left unguarded. It is therefore
 * defended more heavily than an authenticated route would need to be —
 * IP-keyed throttling, a strict schema, a small body cap, and a honeypot.
 */

import { z } from 'zod';
import {
  withRoute,
  readValidatedBody,
  enforceRateLimit,
  getClientIp,
  apiSuccess,
  mapUpstreamError,
} from '@/shared/api';
import { serverBackendFetch } from '@/core/client/server-fetch';
import { API_ENDPOINTS } from '@/shared/constants/api/endpoints';

/** Small enough to make bulk submission costly; ample for a real enquiry. */
const MAX_BODY_BYTES = 8 * 1024;

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name.').max(120),
  email: z.string().trim().email('Please enter a valid email address.').max(254).toLowerCase(),
  subject: z.string().trim().min(3, 'Please enter a subject.').max(200),
  message: z
    .string()
    .trim()
    .min(10, 'Please describe your enquiry in at least 10 characters.')
    .max(5_000, 'Please keep your message under 5,000 characters.'),

  /**
   * Honeypot.
   *
   * Rendered hidden and left blank by any human. Naive bots fill every field
   * they find, so a non-empty value here is a near-certain automated
   * submission. Handled as a silent success below rather than an error, so a
   * bot receives no signal it can adapt to.
   */
  website: z.string().max(0).optional(),
});

export const POST = withRoute('contact', async (req, { log }) => {
  // Keyed on IP because the endpoint is unauthenticated and there is no
  // stabler identifier available. `getClientIp` is documented as a coarse
  // bucketing hint, not an identity — appropriate for throttling, and never
  // used for an authorisation decision.
  const clientIp = getClientIp(req);
  await enforceRateLimit(
    `contact:submit:${clientIp}`,
    'You have sent several messages recently. Please wait a few minutes before sending another.'
  );

  const enquiry = await readValidatedBody(req, contactSchema, MAX_BODY_BYTES);

  // ---------- Honeypot ----------
  if (enquiry.website) {
    // Reported as accepted, but discarded. Returning an error would tell an
    // author which field tripped the filter; a 200 gives them nothing.
    log.warn('[Contact] Honeypot triggered; submission discarded', { clientIp });
    return apiSuccess({ received: true }, { status: 202 });
  }

  log.info('[Contact] Forwarding enquiry', {
    // The subject is logged for triage volume; the message body is not, since
    // it may contain personal detail the sender expects to reach support only.
    subject: enquiry.subject,
    clientIp,
  });

  try {
    await serverBackendFetch(API_ENDPOINTS.SUPPORT.CONTACT, undefined, {
      method: 'POST',
      body: {
        name: enquiry.name,
        email: enquiry.email,
        subject: enquiry.subject,
        message: enquiry.message,
        // Recorded server-side for abuse investigation, never accepted from
        // the client where it could be forged.
        sourceIp: clientIp,
        submittedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    throw mapUpstreamError(
      error,
      "We couldn't send your message just now. Please try again, or email us directly."
    );
  }

  return apiSuccess({ received: true }, { status: 202 });
});
