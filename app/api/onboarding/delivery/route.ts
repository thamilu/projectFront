/**
 * POST /api/onboarding/delivery
 *
 * Submits a delivery-agent registration application to the backend.
 *
 * Mirrors `app/api/onboarding/seller/route.ts` deliberately: the two flows are
 * structurally identical, and the shared `withRoute` / guard pipeline is what
 * keeps them from drifting apart the way they previously had — one built its
 * backend URL by hand with a hardcoded `localhost:8082` fallback while the
 * other used `API_ENDPOINTS`, and only one had been corrected for the missing
 * `/api/v1` version segment.
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
 * Edge-level shape check. The backend stays authoritative on licence
 * validation, background checks and vehicle eligibility; this bounds field
 * sizes and rejects structurally impossible payloads before they cost an
 * upstream round trip. See the seller route for why `passthrough()` is used.
 */
const deliveryApplicationSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(6).max(20),
    vehicleType: z.string().trim().min(1).max(50),
  })
  .passthrough();

const RATE_LIMIT_MESSAGE = 'Too many submissions. Please wait a moment before trying again.';

export const POST = withRoute('onboarding/delivery', async (req, { log }) => {
  const caller = await requireSession(req);

  await enforceRateLimit(`onboarding:delivery:${caller.userId}`, RATE_LIMIT_MESSAGE);

  const application = await readValidatedBody(req, deliveryApplicationSchema);

  log.info('Submitting delivery agent application', { userId: caller.userId });

  try {
    const { data } = await serverBackendFetch<unknown>(
      API_ENDPOINTS.DELIVERY.REGISTER,
      caller.accessToken,
      { method: 'POST', body: application }
    );

    log.info('Delivery agent application submitted', { userId: caller.userId });
    return apiSuccess(data, { status: 201 });
  } catch (error) {
    // A 4xx from the backend is a real answer the applicant must read
    // ("handle already taken", "application already in review"), so it is
    // preserved rather than flattened into a generic 502.
    throw mapUpstreamError(error, 'Could not submit your application. Please try again.');
  }
});
