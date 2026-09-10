/**
 * Headline metrics shown on the seller acquisition landing page.
 *
 * [COMPLIANCE] These were previously four hardcoded JSX blocks asserting
 * "10,000+ Active Sellers", "Trusted across India", "24 Hours Typical
 * Verification Time" and "0% Commissions" as statements of fact. Nothing in the
 * codebase substantiated any of them, and they rendered identically on every
 * deployment — including local development.
 *
 * Quantified performance claims made to prospective merchants are advertising
 * representations. In India, where this deployment targets, they fall under the
 * Consumer Protection Act 2019's prohibition on misleading advertisement and
 * the ASCI code's requirement that objective claims be substantiable on demand.
 * A number invented in a JSX file cannot be substantiated.
 *
 * The fix is not to soften the wording but to change who owns the value:
 *
 * - Each metric is **opt-in via environment configuration**. A deployment that
 *   has not set a value does not display that metric at all.
 * - **Nothing is invented as a fallback.** The previous defaults are gone
 *   entirely; an unset metric renders nothing rather than a plausible-looking
 *   placeholder that reads as real to a visitor.
 * - Metrics that are genuinely policy rather than measurement (commission rate)
 *   are separated from those that are measurements (seller count), because only
 *   the latter need periodic re-substantiation.
 *
 * When a metrics endpoint exists, replace `readConfiguredMetrics()` with a
 * fetch. The component contract does not change.
 *
 * @module features/seller/config/landing-metrics.config
 */

/** A single headline figure. */
export interface LandingMetric {
  readonly id: string;
  /** The figure itself, e.g. "10,000+". Rendered prominently. */
  readonly value: string;
  /** What the figure counts, e.g. "Active Sellers". */
  readonly label: string;
  /** Qualifier that scopes the claim, e.g. "For complete applications". */
  readonly caption?: string;
}

/**
 * Environment-provided metric values.
 *
 * Read through `process.env` rather than the validated `env` object because
 * every one is optional and purely presentational — adding six optional keys to
 * the startup schema would add noise without adding safety. An absent or blank
 * value is simply not displayed.
 *
 * These are `NEXT_PUBLIC_` because the landing page is public and statically
 * renderable; none is a secret.
 */
function readConfiguredMetrics(): LandingMetric[] {
  const candidates: Array<LandingMetric | null> = [
    buildMetric(
      'active-sellers',
      process.env.NEXT_PUBLIC_SELLER_COUNT,
      'Active Sellers',
      process.env.NEXT_PUBLIC_SELLER_COUNT_SCOPE
    ),
    buildMetric(
      'verification-time',
      process.env.NEXT_PUBLIC_SELLER_VERIFICATION_SLA,
      'Typical Verification Time',
      'For complete applications'
    ),
    buildMetric(
      'registration-time',
      process.env.NEXT_PUBLIC_SELLER_SIGNUP_MINUTES,
      'Registration',
      'Quick onboarding wizard'
    ),
    buildMetric(
      'commission',
      process.env.NEXT_PUBLIC_SELLER_COMMISSION_RATE,
      'Commissions',
      'Keep 100% of sales revenue'
    ),
  ];

  return candidates.filter((metric): metric is LandingMetric => metric !== null);
}

/** Build a metric, or `null` when the deployment has not supplied a value. */
function buildMetric(
  id: string,
  value: string | undefined,
  label: string,
  caption?: string
): LandingMetric | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return { id, value: trimmed, label, caption: caption?.trim() || undefined };
}

/**
 * Metrics this deployment is configured to publish.
 *
 * Evaluated once at module scope: the values are build-time constants, so
 * recomputing per render would be wasted work.
 */
export const LANDING_METRICS: readonly LandingMetric[] = readConfiguredMetrics();

/** Whether the metrics strip should render at all. */
export const HAS_LANDING_METRICS = LANDING_METRICS.length > 0;
