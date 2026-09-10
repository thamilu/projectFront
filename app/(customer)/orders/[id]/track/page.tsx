'use client';

/**
 * Order tracking.
 *
 * [CORRECTNESS] This page previously rendered the same invented journey for
 * every order. `currentStep` was the literal `3`, so a placed, cancelled or
 * delivered order all displayed as "Shipped", and the timeline was five
 * hardcoded events dated 24–25 February 2026 routed through Chennai and
 * Bangalore. The route parameter was used only to print an id in a subheading.
 *
 * The stage index and the timeline are now both derived from the order's real
 * status, polled while the shipment is still in motion (see `useOrderTracking`,
 * which stops polling once the order reaches a terminal state).
 *
 * The map is loaded only when the carrier actually reports coordinates —
 * `react-leaflet` and `leaflet` together are a substantial download, and
 * shipping them for an order with no live position is pure waste.
 */

import { use, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  AlertTriangle,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/atoms/card';
import { Button } from '@/shared/ui/atoms/button';
import { APP_ROUTES } from '@/shared/routes';
import { useOrderTracking } from '@/features/orders/hooks/use-orders';

const MapComponent = dynamic(() => import('@/shared/ui/atoms/map'), {
  ssr: false,
  loading: () => <div className="bg-muted h-64 animate-pulse rounded-lg" aria-hidden="true" />,
});

// ============================================================
// 1. STAGES
// ============================================================

/**
 * The happy-path fulfilment sequence.
 *
 * `statuses` maps each backend order status onto its stage, so the progress
 * indicator is a projection of real data rather than a hardcoded index.
 */
const STAGES = [
  { key: 'placed', label: 'Order Placed', icon: CheckCircle2, statuses: ['PLACED'] },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2, statuses: ['CONFIRMED'] },
  { key: 'packed', label: 'Packed', icon: Package, statuses: ['PACKED'] },
  { key: 'shipped', label: 'Shipped', icon: Truck, statuses: ['SHIPPED', 'OUT_FOR_DELIVERY'] },
  { key: 'delivered', label: 'Delivered', icon: MapPin, statuses: ['DELIVERED'] },
] as const;

/** Statuses that leave the happy path entirely and need their own presentation. */
const EXCEPTION_STATUSES: Record<string, { label: string; icon: typeof XCircle; tone: string }> = {
  CANCELLED: { label: 'Cancelled', icon: XCircle, tone: 'text-destructive' },
  RETURNED: { label: 'Returned', icon: RotateCcw, tone: 'text-warning' },
};

/**
 * Resolve a backend status to a stage index.
 *
 * Returns `-1` for an unrecognised status rather than defaulting to a stage:
 * showing a confident but wrong position is worse than showing none, and a new
 * backend status should surface as "unknown" rather than silently mapping onto
 * whichever stage happened to be the fallback.
 */
function resolveStageIndex(status: string | undefined): number {
  if (!status) return -1;
  const normalised = status.toUpperCase();
  return STAGES.findIndex((stage) => (stage.statuses as readonly string[]).includes(normalised));
}

// ============================================================
// 2. PAGE
// ============================================================

export default function OrderTrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const orderId = Number(id);
  const isValidId = Number.isInteger(orderId) && orderId > 0;

  const { data: tracking, isLoading, isError } = useOrderTracking(orderId, { enabled: isValidId });

  const status = tracking?.status?.toUpperCase();
  const currentStage = useMemo(() => resolveStageIndex(status), [status]);
  const exception = status ? EXCEPTION_STATUSES[status] : undefined;

  /**
   * Most recent scan carrying a geocode.
   *
   * Computed rather than assuming `events[0]` has one: facility scans usually
   * do not, so the newest positioned event may be several entries down.
   */
  const latestPosition = useMemo(() => {
    const positioned = tracking?.events.find(
      (event) => typeof event.latitude === 'number' && typeof event.longitude === 'number'
    );
    if (!positioned) return null;
    return {
      center: [positioned.latitude as number, positioned.longitude as number] as [number, number],
      label: positioned.location ?? positioned.status,
    };
  }, [tracking?.events]);

  // ---------- Invalid parameter ----------
  if (!isValidId) {
    return (
      <TrackingMessage
        title="We couldn't find that order"
        body="The order reference in this link isn't valid."
      />
    );
  }

  // ---------- Loading ----------
  if (isLoading) {
    return (
      <div
        className="container mx-auto max-w-2xl px-4 py-10"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <span className="sr-only">Loading tracking information…</span>
        <div className="bg-muted mb-2 h-8 w-1/3 animate-pulse rounded" aria-hidden="true" />
        <div className="bg-muted mb-6 h-4 w-1/4 animate-pulse rounded" aria-hidden="true" />
        <div className="bg-muted mb-6 h-28 animate-pulse rounded-lg" aria-hidden="true" />
        <div className="bg-muted h-56 animate-pulse rounded-lg" aria-hidden="true" />
      </div>
    );
  }

  // ---------- Failure ----------
  if (isError || !tracking) {
    return (
      <TrackingMessage
        title="Tracking isn't available right now"
        body="We couldn't load tracking for this order. It may not have shipped yet, or the carrier hasn't reported an update."
        orderId={orderId}
      />
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-bold">Track Order</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Order #{orderId}
        {tracking.carrier ? ` · ${tracking.carrier}` : ''}
        {tracking.trackingNumber ? ` · ${tracking.trackingNumber}` : ''}
      </p>

      {/* ---------- Exception state ---------- */}
      {exception ? (
        <Card className="mb-6">
          <CardContent className="flex items-center gap-3 pt-6">
            <exception.icon className={`h-6 w-6 ${exception.tone}`} aria-hidden="true" />
            <div>
              <p className="font-medium">{exception.label}</p>
              <p className="text-muted-foreground text-sm">
                This order is no longer in transit.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ProgressTrack currentStage={currentStage} status={status} />
      )}

      {/* ---------- Estimated delivery ---------- */}
      {tracking.estimatedDelivery && !exception && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">Estimated delivery</p>
            <p className="font-medium">
              {new Date(tracking.estimatedDelivery).toLocaleDateString(undefined, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ---------- Live map, only when the carrier reported a position ---------- */}
      {latestPosition && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Last reported location</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <MapComponent
                center={latestPosition.center}
                zoom={11}
                markers={[
                  { position: latestPosition.center, popupContent: latestPosition.label },
                ]}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ---------- Timeline ---------- */}
      <Card>
        <CardHeader>
          <CardTitle>Journey</CardTitle>
        </CardHeader>
        <CardContent>
          {tracking.events.length === 0 ? (
            <p className="text-muted-foreground py-4 text-sm">
              No scans have been recorded yet. Updates appear here as your parcel moves.
            </p>
          ) : (
            /* An ordered list, because the sequence is the information. The
               previous markup used unsemantic divs, so a screen reader gave no
               indication of order or item count. */
            <ol className="space-y-4">
              {tracking.events.map((event, index) => (
                <li key={`${event.timestamp}-${index}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                        index === 0 ? 'bg-primary' : 'bg-muted-foreground/40'
                      }`}
                      aria-hidden="true"
                    />
                    {index < tracking.events.length - 1 && (
                      <span className="bg-border mt-1 w-px flex-1" aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0 pb-1">
                    <p className="text-sm font-medium">{event.status}</p>
                    {event.description && (
                      <p className="text-muted-foreground text-sm">{event.description}</p>
                    )}
                    <p className="text-muted-foreground text-xs">
                      <time dateTime={event.timestamp}>
                        {new Date(event.timestamp).toLocaleString()}
                      </time>
                      {event.location ? ` · ${event.location}` : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <div className="mt-6">
        <Button variant="outline" asChild>
          <Link href={APP_ROUTES.ORDER_DETAIL(String(orderId))}>Back to order</Link>
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// 3. PARTS
// ============================================================

/**
 * The five-stage progress indicator.
 *
 * Exposed as a labelled progressbar so assistive technology conveys the same
 * information the visual track does — the previous version was decorative divs
 * with no accessible equivalent at all.
 */
function ProgressTrack({
  currentStage,
  status,
}: {
  currentStage: number;
  status: string | undefined;
}) {
  const reached = Math.max(currentStage, 0);
  const percent = currentStage < 0 ? 0 : (currentStage / (STAGES.length - 1)) * 100;
  const currentLabel = currentStage >= 0 ? STAGES[currentStage].label : 'Status unavailable';

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={STAGES.length}
          aria-valuenow={currentStage + 1}
          aria-valuetext={`${currentLabel}, step ${currentStage + 1} of ${STAGES.length}`}
          aria-label="Delivery progress"
          className="relative flex justify-between"
        >
          <div className="bg-muted absolute top-5 right-0 left-0 h-0.5" aria-hidden="true" />
          <div
            className="bg-primary absolute top-5 left-0 h-0.5 transition-all"
            style={{ width: `${percent}%` }}
            aria-hidden="true"
          />

          {STAGES.map((stage, index) => {
            const done = currentStage >= 0 && index <= reached;
            const Icon = stage.icon;
            return (
              <div key={stage.key} className="relative flex flex-col items-center gap-2">
                <div
                  className={`z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                    done
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted bg-background text-muted-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="text-muted-foreground max-w-16 text-center text-xs">
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* An unrecognised status is stated plainly rather than rendered as a
            confident but arbitrary position on the track. */}
        {currentStage < 0 && status && (
          <p className="text-muted-foreground mt-4 flex items-center gap-2 text-sm">
            <AlertTriangle className="text-warning h-4 w-4" aria-hidden="true" />
            Current status: {status}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/** Terminal message for an unusable id or a tracking failure. */
function TrackingMessage({
  title,
  body,
  orderId,
}: {
  title: string;
  body: string;
  orderId?: number;
}) {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-16">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <AlertTriangle className="text-warning h-10 w-10" aria-hidden="true" />
          <h1 className="text-xl font-semibold" role="status">
            {title}
          </h1>
          <p className="text-muted-foreground max-w-md text-sm">{body}</p>
          <Button asChild>
            <Link href={orderId ? APP_ROUTES.ORDER_DETAIL(String(orderId)) : APP_ROUTES.ORDERS}>
              {orderId ? 'Back to order' : 'View your orders'}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
