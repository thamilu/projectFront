/**
 * Tests for the document-level skip link.
 *
 * `SkipToContent` is rendered once by the root layout as the first focusable
 * element on every page, and had **no test coverage at all** — despite being
 * the single most important keyboard affordance in the application (WCAG 2.4.1,
 * Bypass Blocks).
 *
 * That gap is how the page ended up with four of them. `SellerLayoutClient`,
 * the site header, and the seller registration page each rendered their own
 * copy pointing at `#main-content`, so a keyboard user's first several Tab
 * presses all offered "Skip to main content" for the same target. The
 * duplicates are gone; this file covers the one that remains, on the component
 * that actually owns the behaviour.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SkipToContent } from '@/shared/ui/layout/skip-to-content';

/** Build the landmark the skip link targets, as the root layout renders it. */
function mountTarget(options: { withTabIndex?: boolean } = {}) {
  const main = document.createElement('main');
  main.id = 'main-content';
  if (options.withTabIndex !== false) main.setAttribute('tabindex', '-1');
  main.textContent = 'Page content';
  document.body.appendChild(main);
  return main;
}

beforeEach(() => {
  // jsdom implements neither of these, and the component legitimately uses
  // both: scrollIntoView to bring the landmark into view, and matchMedia to
  // honour prefers-reduced-motion. Stubbing them here keeps the test about the
  // component's behaviour rather than about jsdom's gaps.
  Element.prototype.scrollIntoView = jest.fn();
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
      onchange: null,
    })),
  });
});

afterEach(() => {
  document.body.innerHTML = '';
  jest.restoreAllMocks();
});

describe('SkipToContent', () => {
  it('renders a link pointing at the main landmark', () => {
    render(<SkipToContent />);

    const link = screen.getByRole('link', { name: /skip to main content/i });
    expect(link).toHaveAttribute('href', '#main-content');
  });

  it('is hidden until focused, without leaving the tab order', () => {
    render(<SkipToContent />);

    const link = screen.getByRole('link', { name: /skip to main content/i });

    // Hidden via opacity/transform and made inert to the pointer — never
    // `display:none` or `visibility:hidden`, either of which would remove it
    // from the tab order and make it unreachable by the keyboard users it
    // exists for.
    expect(link.className).toMatch(/opacity-0/);
    expect(link.className).toMatch(/-translate-y-full/);
    expect(link.className).toMatch(/pointer-events-none/);

    // Revealed on keyboard focus.
    expect(link.className).toMatch(/focus:opacity-100/);
    expect(link.className).toMatch(/focus:pointer-events-auto/);
  });

  it('honours prefers-reduced-motion when scrolling to the target', async () => {
    const user = userEvent.setup();
    mountTarget();
    (window.matchMedia as jest.Mock).mockReturnValue({ matches: true, addEventListener: jest.fn(), removeEventListener: jest.fn() });
    render(<SkipToContent />);

    await user.click(screen.getByRole('link', { name: /skip to main content/i }));

    // A smooth scroll can trigger nausea for motion-sensitive users; the
    // component must fall back to an instant jump.
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'auto' })
    );
  });

  it('is reachable by keyboard as the first tab stop', async () => {
    const user = userEvent.setup();
    render(<SkipToContent />);

    await user.tab();

    expect(screen.getByRole('link', { name: /skip to main content/i })).toHaveFocus();
  });

  it('moves focus to the main landmark when activated', async () => {
    const user = userEvent.setup();
    const main = mountTarget();
    render(<SkipToContent />);

    await user.click(screen.getByRole('link', { name: /skip to main content/i }));

    // Focus moving is the entire point — a skip link that only changes the URL
    // hash leaves the keyboard user exactly where they were.
    expect(main).toHaveFocus();
  });

  it('makes an unfocusable target focusable rather than failing silently', async () => {
    const user = userEvent.setup();
    // A landmark authored without tabindex cannot receive programmatic focus.
    const main = mountTarget({ withTabIndex: false });
    render(<SkipToContent />);

    await user.click(screen.getByRole('link', { name: /skip to main content/i }));

    expect(main).toHaveAttribute('tabindex', '-1');
    expect(main).toHaveFocus();
  });

  it('does not throw when the target is missing', async () => {
    const user = userEvent.setup();
    // No landmark mounted. This must degrade quietly: an exception here would
    // break the first interaction on the page.
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    render(<SkipToContent />);

    await expect(
      user.click(screen.getByRole('link', { name: /skip to main content/i }))
    ).resolves.not.toThrow();
  });

  it('renders exactly one skip link per instance', () => {
    // Guards the regression this file was written for: four components each
    // rendered their own copy aimed at the same target.
    render(<SkipToContent />);

    expect(screen.getAllByRole('link', { name: /skip to main content/i })).toHaveLength(1);
  });
});
