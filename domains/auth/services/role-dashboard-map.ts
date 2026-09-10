// ============================================================
// features/auth/services/role-dashboard-map.ts
// Pre-sorted role-to-route priority map.
// Sorting happens ONCE at module load — O(N log N) amortized.
// Runtime lookups are O(N) linear scans only.
// ============================================================

import { UserRole } from '@/domains/auth/contracts/auth.types';
import { APP_ROUTES } from '@/shared/routes';

// ─── Types ───────────────────────────────────────────────────

export interface RoleDashboardEntry {
  /** The role this entry applies to */
  readonly role: UserRole;
  /** The route to redirect users with this role */
  readonly route: string;
  /** Lower number = higher priority (evaluated first) */
  readonly priority: number;
}

// ─── Raw Map (unsorted — maintain in any order) ───────────────

const RAW_ROLE_DASHBOARD_MAP: readonly RoleDashboardEntry[] = [
  {
    role: UserRole.SELLER,
    route: APP_ROUTES.SELLER.DASHBOARD,
    priority: 1,
  },
  {
    role: UserRole.DELIVERY_AGENT,
    route: APP_ROUTES.DELIVERY.DASHBOARD,
    priority: 2,
  },
  // UserRole.CUSTOMER is intentionally absent — customers fall through to
  // DEFAULT_DASHBOARD_ROUTE below, not a separate priority entry.
];

/**
 * Fallback route when no role matches (including UserRole.CUSTOMER, which
 * has no dedicated entry above). Declared before the validation block below
 * so it can be validated too.
 *
 * ⚠️ This equals APP_ROUTES.DASHBOARD — the same route
 * app/(customer)/dashboard/page.tsx serves. That page is a REDIRECT HUB,
 * not a landing page: for a customer (no matching role) it immediately
 * navigates away to APP_ROUTES.HOME rather than rendering any dashboard UI
 * there. Do NOT call resolveDashboardRoute() (or read this constant)
 * FROM that page to decide the customer/no-match destination — doing so
 * would resolve to this same route and create an infinite self-redirect.
 * That page deliberately hand-checks isSeller/isDeliveryAgent via useAuth()
 * for exactly this reason instead of delegating to this map. Safe callers
 * of resolveDashboardRoute() are ones redirecting FROM somewhere else
 * (e.g. post-login) TO the user's dashboard — for those, landing a
 * customer on /dashboard is correct, since that's where the hub itself
 * sends them next.
 */
export const DEFAULT_DASHBOARD_ROUTE = APP_ROUTES.DASHBOARD;

// ─── Validation ─────────────────────────────────────────────

/**
 * Fails fast on the two ways this map can silently misbehave: two entries
 * claiming the same role (only the first survives Array.find(), the second
 * is dead data a future engineer would reasonably expect to be reachable),
 * or two entries sharing a priority (sort() is stable, so the outcome is
 * merely "whichever was listed first" rather than an intentional decision —
 * fine by accident, wrong by design). Both are the kind of mistake that's
 * easy to introduce when adding a new role and easy to miss in review,
 * since the map still type-checks and still "looks" sorted either way.
 *
 * Also validates that every route is a well-formed absolute path — catches
 * an APP_ROUTES misconfiguration (e.g. a typo'd key resolving to
 * `undefined`) at startup instead of producing a live redirect to
 * "/undefined" for real users. This is a well-formedness check only, NOT
 * an existence check — it cannot tell you a route has no page behind it
 * (see role-dashboard-map.test.ts's route-existence test for that; making
 * THIS throw on a merely-nonexistent-but-well-formed route would crash the
 * app at startup the moment one entry drifts from the page tree, which is
 * far more disruptive than a failing test run in CI).
 */
export function validateRoleDashboardMap(map: readonly RoleDashboardEntry[]): void {
  const seenRoles = new Set<UserRole>();
  const seenPriorities = new Set<number>();

  for (const entry of map) {
    if (seenRoles.has(entry.role)) {
      throw new Error(
        `[role-dashboard-map] Duplicate role entry: '${entry.role}' appears more than once. ` +
          'Each role must map to exactly one dashboard route.'
      );
    }
    seenRoles.add(entry.role);

    if (seenPriorities.has(entry.priority)) {
      throw new Error(
        `[role-dashboard-map] Duplicate priority: ${entry.priority} is used by more than one entry. ` +
          'Priorities must be unique so evaluation order is unambiguous.'
      );
    }
    seenPriorities.add(entry.priority);

    if (!entry.route || !entry.route.startsWith('/')) {
      throw new Error(
        `[role-dashboard-map] Invalid route for role '${entry.role}': ${JSON.stringify(entry.route)}. ` +
          'Check the corresponding APP_ROUTES entry for a typo or missing key.'
      );
    }
  }
}

validateRoleDashboardMap(RAW_ROLE_DASHBOARD_MAP);

if (!DEFAULT_DASHBOARD_ROUTE || !DEFAULT_DASHBOARD_ROUTE.startsWith('/')) {
  throw new Error(
    `[role-dashboard-map] DEFAULT_DASHBOARD_ROUTE is invalid: ${JSON.stringify(DEFAULT_DASHBOARD_ROUTE)}. ` +
      'Check APP_ROUTES.DASHBOARD.'
  );
}

/**
 * UserRole enum values deliberately excluded from RAW_ROLE_DASHBOARD_MAP —
 * every other value MUST have a map entry (enforced below). Keeping this
 * list explicit means a role added to the UserRole enum without a
 * deliberate decision about its routing throws at startup instead of
 * silently falling through to DEFAULT_DASHBOARD_ROUTE and only being
 * noticed when a user reports landing on the wrong page.
 */
const ROLES_INTENTIONALLY_EXCLUDED_FROM_MAP: ReadonlySet<UserRole> = new Set([
  // Falls through to DEFAULT_DASHBOARD_ROUTE, which IS the customer
  // dashboard page — see the comment on RAW_ROLE_DASHBOARD_MAP above.
  UserRole.CUSTOMER,
]);

function validateRoleCoverage(
  map: readonly RoleDashboardEntry[],
  excluded: ReadonlySet<UserRole>
): void {
  const covered = new Set(map.map((e) => e.role));
  const unaccounted = Object.values(UserRole).filter(
    (role) => !covered.has(role) && !excluded.has(role)
  );

  if (unaccounted.length > 0) {
    throw new Error(
      `[role-dashboard-map] UserRole value(s) with no routing decision made: ${unaccounted.join(', ')}. ` +
        'Add a RAW_ROLE_DASHBOARD_MAP entry, or add to ROLES_INTENTIONALLY_EXCLUDED_FROM_MAP ' +
        'with a comment explaining why it should fall through to DEFAULT_DASHBOARD_ROUTE.'
    );
  }
}

validateRoleCoverage(RAW_ROLE_DASHBOARD_MAP, ROLES_INTENTIONALLY_EXCLUDED_FROM_MAP);

// ─── Pre-Sorted Map (module load time — O(N log N) once) ──────

/**
 * Role-to-dashboard map sorted by priority at module initialization.
 * All runtime lookups are O(N) — no sorting during request handling.
 */
export const ROLE_DASHBOARD_MAP: readonly RoleDashboardEntry[] = [...RAW_ROLE_DASHBOARD_MAP].sort(
  (a, b) => a.priority - b.priority
);
