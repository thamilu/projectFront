import React from 'react';
import { render, screen } from '@testing-library/react';
import { PageHeader } from '@/shared/ui/molecules/PageHeader';

describe('PageHeader Component', () => {
  it('renders title and description', () => {
    render(<PageHeader title="Welcome" description="This is a test description" />);

    expect(screen.getByRole('heading', { name: /Welcome/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText('This is a test description')).toBeInTheDocument();
  });

  it('renders only title when description is omitted', () => {
    render(<PageHeader title="Hello" />);

    expect(screen.getByRole('heading', { name: /Hello/i, level: 1 })).toBeInTheDocument();
  });

  it('applies alignment classes', () => {
    const { container: containerCenter } = render(<PageHeader title="Center" align="center" />);
    expect(containerCenter.firstChild).toHaveClass('text-center');

    const { container: containerLeft } = render(<PageHeader title="Left" align="left" />);
    expect(containerLeft.firstChild).toHaveClass('text-left');
  });
});
