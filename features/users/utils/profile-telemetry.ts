/**
 * @module profile-telemetry
 * @description Telemetry and observability observers for SRE and logging.
 */

export interface ProfileDataTelemetry {
  onCacheHit?: (userId: string) => void;
  onCacheMiss?: (userId: string) => void;
  onFetchStart?: (userId: string, isSellerRole: boolean) => void;
  onFetchSuccess?: (userId: string, durationMs: number) => void;
  onFetchError?: (userId: string, error: Error, attempt: number) => void;
  onRetry?: (userId: string, attempt: number, delayMs: number) => void;
}

export let globalTelemetry: Readonly<ProfileDataTelemetry> = Object.freeze({});
export let isTelemetryConfigured = false;

/**
 * Configure global telemetry observers for observability SRE compliance.
 */
export function configureProfileDataTelemetry(telemetry: ProfileDataTelemetry): void {
  if (isTelemetryConfigured && process.env.NODE_ENV === 'development') {
    console.warn(
      '[useProfileData] configureProfileDataTelemetry called multiple times. ' +
        'Previous telemetry will be replaced.'
    );
  }
  globalTelemetry = Object.freeze({ ...telemetry });
  isTelemetryConfigured = true;
}

/**
 * Resets global telemetry observers back to default state (useful in test environments).
 */
export function resetProfileDataTelemetry(): void {
  globalTelemetry = Object.freeze({});
  isTelemetryConfigured = false;
}
