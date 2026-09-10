import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { HeaderAnnouncementBar } from '@/shared/ui/layout/header/parts/header-announcement-bar';
import type { AnnouncementCampaign } from '@/domains/navigation/contracts/navigation.types';

const mockCampaigns: AnnouncementCampaign[] = [
  {
    id: 'promo-1',
    text: 'Flash Sale: 50% Off Electronics',
    badge: 'Special',
    href: '/deals',
    priority: 10,
    persistDismissal: true,
  },
];

describe('HeaderAnnouncementBar Component', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('renders active campaign text and badge', () => {
    render(<HeaderAnnouncementBar campaigns={mockCampaigns} />);

    expect(screen.getByRole('region', { name: /promotions and announcements/i })).toBeInTheDocument();
    expect(screen.getByText('Flash Sale: 50% Off Electronics')).toBeInTheDocument();
    expect(screen.getByText('Special')).toBeInTheDocument();
  });

  it('dismisses campaign and saves id to localStorage on dismiss click', () => {
    render(<HeaderAnnouncementBar campaigns={mockCampaigns} />);

    const dismissBtn = screen.getByRole('button', { name: /dismiss/i });
    fireEvent.click(dismissBtn);

    expect(screen.queryByRole('region')).not.toBeInTheDocument();

    const stored = JSON.parse(localStorage.getItem('eshop_dismissed_announcements') || '[]');
    expect(stored).toContain('promo-1');
  });

  it('does not render campaign if previously dismissed in localStorage', () => {
    localStorage.setItem('eshop_dismissed_announcements', JSON.stringify(['promo-1']));

    render(<HeaderAnnouncementBar campaigns={mockCampaigns} />);

    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });
});
