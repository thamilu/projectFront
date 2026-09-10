import { render, screen, fireEvent, act } from '@testing-library/react';
import { BannerCarousel, HERO_BANNERS } from '@/features/home/components/BannerCarousel';

// Regression: this carousel previously auto-advanced every 4s with no way
// to pause, stop, or hide it — a WCAG 2.2 SC 2.2.2 violation for any
// auto-advancing content lasting more than 5 seconds. It also ignored
// prefers-reduced-motion and kept scrolling while the tab was hidden.
describe('BannerCarousel', () => {
  let matchMediaMock: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    matchMediaMock = jest.fn().mockReturnValue({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });
    window.matchMedia = matchMediaMock as unknown as typeof window.matchMedia;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('exposes an accessible pause/resume control', () => {
    render(<BannerCarousel />);
    expect(screen.getByRole('button', { name: /pause banner rotation/i })).toBeInTheDocument();
  });

  it('toggles to a resume control when paused', () => {
    render(<BannerCarousel />);
    fireEvent.click(screen.getByRole('button', { name: /pause banner rotation/i }));
    expect(screen.getByRole('button', { name: /resume banner rotation/i })).toBeInTheDocument();
  });

  it('exposes accessible previous/next controls', () => {
    render(<BannerCarousel />);
    expect(screen.getByRole('button', { name: /previous banner/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next banner/i })).toBeInTheDocument();
  });

  it('marks the region with carousel semantics for assistive tech', () => {
    render(<BannerCarousel />);
    expect(screen.getByRole('region', { name: /promotional offers/i })).toHaveAttribute(
      'aria-roledescription',
      'carousel'
    );
  });

  it('hides the rotation controls entirely when the user prefers reduced motion', () => {
    matchMediaMock.mockReturnValue({
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });
    render(<BannerCarousel />);
    expect(screen.queryByRole('button', { name: /pause banner rotation/i })).not.toBeInTheDocument();
  });

  it('stops auto-advancing once paused', () => {
    render(<BannerCarousel />);
    const scrollBySpy = jest.fn();
    const region = screen.getByRole('region', { name: /promotional offers/i });
    const scrollContainer = region.querySelector('.hide-scrollbar') as HTMLDivElement;
    scrollContainer.scrollBy = scrollBySpy;
    Object.defineProperty(scrollContainer, 'scrollWidth', { value: 3000, configurable: true });
    Object.defineProperty(scrollContainer, 'clientWidth', { value: 500, configurable: true });

    fireEvent.click(screen.getByRole('button', { name: /pause banner rotation/i }));

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(scrollBySpy).not.toHaveBeenCalled();
  });

  it('renders every configured banner as a labeled slide', () => {
    render(<BannerCarousel />);
    HERO_BANNERS.forEach((banner, index) => {
      expect(
        screen.getByRole('link', { name: new RegExp(`${index + 1} of ${HERO_BANNERS.length}`) })
      ).toBeInTheDocument();
    });
  });
});
