// ============================================================
// __tests__/unit/services/role-dashboard-map.test.ts
// Tests for the pre-sorted role-to-dashboard priority map, its fail-fast
// validation, and (most importantly) that every route it points to
// actually resolves to a real page in app/ — a route can be a
// well-formed, uniquely-mapped string and still be a 404.
// ============================================================

import fs from 'fs';
import path from 'path';
import { UserRole } from '@/domains/auth/contracts/auth.types';
import {
  ROLE_DASHBOARD_MAP,
  DEFAULT_DASHBOARD_ROUTE,
  validateRoleDashboardMap,
  type RoleDashboardEntry,
} from '@/domains/auth/services/role-dashboard-map';

/**
 * Recursively collects every real URL path served by a page.tsx/page.ts
 * under `dir`, stripping Next.js route-group segments (e.g. `(customer)`)
 * since those never appear in the actual URL.
 */
function collectRealAppRoutes(dir: string, baseDir: string = dir): Set<string> {
  const routes = new Set<string>();
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // API routes aren't dashboard pages — skip them entirely.
      if (path.relative(baseDir, fullPath) === 'api') continue;
      for (const route of collectRealAppRoutes(fullPath, baseDir)) {
        routes.add(route);
      }
    } else if (entry.name === 'page.tsx' || entry.name === 'page.ts') {
      const relativeDir = path.relative(baseDir, dir);
      const segments = relativeDir.split(path.sep).filter(Boolean);
      const urlSegments = segments.filter((s) => !(s.startsWith('(') && s.endsWith(')')));
      routes.add('/' + urlSegments.join('/'));
    }
  }

  return routes;
}

describe('ROLE_DASHBOARD_MAP', () => {
  it('is sorted ascending by priority', () => {
    const priorities = ROLE_DASHBOARD_MAP.map((e) => e.priority);
    const sorted = [...priorities].sort((a, b) => a - b);
    expect(priorities).toEqual(sorted);
  });

  it('contains exactly one entry per non-customer role', () => {
    const roles = ROLE_DASHBOARD_MAP.map((e) => e.role);
    expect(new Set(roles).size).toBe(roles.length);
  });

  it('does not include UserRole.CUSTOMER — falls through to DEFAULT_DASHBOARD_ROUTE instead', () => {
    expect(ROLE_DASHBOARD_MAP.some((e) => e.role === UserRole.CUSTOMER)).toBe(false);
  });

  it('every route is a non-empty string', () => {
    for (const entry of ROLE_DASHBOARD_MAP) {
      expect(typeof entry.route).toBe('string');
      expect(entry.route.length).toBeGreaterThan(0);
    }
  });
});

describe('DEFAULT_DASHBOARD_ROUTE', () => {
  it('is a non-empty string', () => {
    expect(typeof DEFAULT_DASHBOARD_ROUTE).toBe('string');
    expect(DEFAULT_DASHBOARD_ROUTE.length).toBeGreaterThan(0);
  });
});

describe('validateRoleDashboardMap()', () => {
  function entry(overrides: Partial<RoleDashboardEntry> = {}): RoleDashboardEntry {
    return { role: UserRole.SELLER, route: '/seller', priority: 1, ...overrides };
  }

  it('does not throw for the real, current map', () => {
    expect(() => validateRoleDashboardMap(ROLE_DASHBOARD_MAP)).not.toThrow();
  });

  it('does not throw for a valid map with unique roles and priorities', () => {
    const map = [
      entry({ role: UserRole.SELLER, priority: 1 }),
      entry({ role: UserRole.DELIVERY_AGENT, priority: 2 }),
    ];
    expect(() => validateRoleDashboardMap(map)).not.toThrow();
  });

  it('throws on a duplicate role', () => {
    const map = [
      entry({ role: UserRole.SELLER, priority: 1 }),
      entry({ role: UserRole.SELLER, priority: 2 }),
    ];
    expect(() => validateRoleDashboardMap(map)).toThrow(/Duplicate role entry/);
  });

  it('throws on a duplicate priority', () => {
    const map = [
      entry({ role: UserRole.SELLER, priority: 1 }),
      entry({ role: UserRole.DELIVERY_AGENT, priority: 1 }),
    ];
    expect(() => validateRoleDashboardMap(map)).toThrow(/Duplicate priority/);
  });

  it('does not throw for an empty map', () => {
    expect(() => validateRoleDashboardMap([])).not.toThrow();
  });

  it('throws on a malformed (non-absolute) route', () => {
    const map = [entry({ route: 'seller/dashboard' })]; // missing leading '/'
    expect(() => validateRoleDashboardMap(map)).toThrow(/Invalid route/);
  });

  it('throws on an empty-string route', () => {
    const map = [entry({ route: '' })];
    expect(() => validateRoleDashboardMap(map)).toThrow(/Invalid route/);
  });
});

describe('route existence — every mapped route must resolve to a real page', () => {
  // A route can be non-empty, unique, and absolute (passing every check
  // above) and still be a 404 if no page.tsx exists for it. This is the
  // actual bug class that broke /customer/dashboard previously — this
  // suite scans the real app/ directory rather than trusting the string.
  const appDir = path.join(__dirname, '..', '..', '..', 'app');
  const realRoutes = collectRealAppRoutes(appDir);

  // Roles whose route is known and intentionally not live yet — tracked
  // here instead of silently passing or permanently failing CI. Each
  // needs a reason and a way to know when it's resolved.
  const PENDING_ROUTES: Partial<Record<UserRole, string>> = {
    // app/(delivery) exists (confirmed empty — 0 files) but has no pages
    // yet; delivery-agent UI is in-progress in this same repo, at this
    // same path. Once app/(delivery)/delivery/page.tsx (or wherever the
    // real dashboard lands) ships, delete this entry — the generic
    // it.each below will then cover DELIVERY_AGENT and catch any drift.
    [UserRole.DELIVERY_AGENT]: 'delivery-agent UI not yet built (app/(delivery) is empty)',
  };

  const readyEntries = ROLE_DASHBOARD_MAP.filter((e) => !(e.role in PENDING_ROUTES));
  const pendingEntries = ROLE_DASHBOARD_MAP.filter((e) => e.role in PENDING_ROUTES);

  it.each(readyEntries.map((e) => [e.role, e.route] as const))(
    "%s's route (%s) resolves to a real page",
    (_role, route) => {
      expect(realRoutes.has(route)).toBe(true);
    }
  );

  // .skip (not a no-op pass) so Jest's summary reports these as distinctly
  // "skipped," never blending them into the passing count as if verified.
  it.skip.each(pendingEntries.map((e) => [e.role, e.route, PENDING_ROUTES[e.role]] as const))(
    "%s's route (%s) is pending: %s",
    (_role, route) => {
      expect(realRoutes.has(route)).toBe(true);
    }
  );

  it('DEFAULT_DASHBOARD_ROUTE resolves to a real page', () => {
    expect(realRoutes.has(DEFAULT_DASHBOARD_ROUTE)).toBe(true);
  });
});
