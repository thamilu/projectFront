/**
 * POST /api/onboarding/seller
 *
 * Submits a seller registration application to the backend.
 *
 * Previously this route: read the session with `process.env.NEXTAUTH_SECRET`
 * (a name absent from the env schema — see H-01), forwarded an entirely
 * unvalidated `await req.json()` body straight through, hand-assembled the
 * backend URL with a `localhost:8082` fallback while its sibling delivery
 * route used `API_ENDPOINTS`, had no rate limit, and logged with
 * `console.error`. All four are addressed here; the request contract itself
 * is unchanged, so existing clients keep working.
 */

import { z } from 'zod';
import {
  withRoute,
  requireSession,
  readValidatedBody,
  enforceRateLimit,
  apiSuccess,
  mapUpstreamError,
} from '@/shared/api';
import { serverBackendFetch } from '@/core/client/server-fetch';
import { API_ENDPOINTS } from '@/shared/constants/api/endpoints';

/**
 * Edge-level shape check only.
 *
 * The backend remains the authority on seller-registration business rules
 * (GST format by state, bank-account verification, duplicate handles). This
 * schema exists to reject structurally impossible payloads before they cost a
 * backend round trip, and to bound field sizes so an oversized value cannot be
 * used to probe or overload the upstream service.
 *
 * `passthrough()` is deliberate: the registration form evolves faster than
 * this route, and silently stripping a newly added field would surface as a
 * confusing backend validation error rather than an obvious one here.
 */
const sellerApplicationSchema = z
  .object({
    storeName: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().min(6).max(20),
  })
  .passthrough();

/** Applications are expensive to process downstream; throttle per user. */
const RATE_LIMIT_MESSAGE = 'Too many submissions. Please wait a moment before trying again.';

export const POST = withRoute('onboarding/seller', async (req, { log }) => {
  const caller = await requireSession(req);

  await enforceRateLimit(`onboarding:seller:${caller.userId}`, RATE_LIMIT_MESSAGE);

  const application = await readValidatedBody(req, sellerApplicationSchema);

  log.info('Submitting seller application', { userId: caller.userId });

  try {
    const { data } = await serverBackendFetch<unknown>(
      API_ENDPOINTS.SELLER.REGISTER,
      caller.accessToken,
      { method: 'POST', body: application }
    );

    log.info('Seller application submitted', { userId: caller.userId });
    return apiSuccess(data, { status: 201 });
  } catch (error) {
    // A 4xx from the backend is a real answer the applicant must read
    // ("handle already taken", "application already in review"), so it is
    // preserved rather than flattened into a generic 502.
    throw mapUpstreamError(error, 'Could not submit your application. Please try again.');
  }
});
