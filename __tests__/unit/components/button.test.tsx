import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { Button, ButtonGroup } from '@/shared/ui/atoms/button';

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    screen.getByText('Click me').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies variant styles', () => {
    const { container } = render(<Button variant="destructive">Delete</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-destructive');
  });

  it('renders left and right icons correctly', () => {
    render(
      <Button
        leftIcon={<span data-testid="left-icon">Left</span>}
        rightIcon={<span data-testid="right-icon">Right</span>}
      >
        Save
      </Button>
    );

    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('handles loading state with start position by default', () => {
    render(<Button loading>Save</Button>);

    // Default spinner should be present
    expect(screen.getByRole('presentation', { hidden: true })).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('replaces content when loadingPosition is replace', () => {
    render(
      <Button loading loadingPosition="replace">
        Save
      </Button>
    );

    // Spinner should be visible but text "Save" should not be visible (it is replaced)
    expect(screen.getByRole('presentation', { hidden: true })).toBeInTheDocument();
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
    expect(screen.getByText('Loading')).toHaveClass('sr-only');
  });

  it('replaces visible text with loadingText during loading', () => {
    render(
      <Button loading loadingText="Saving...">
        Save
      </Button>
    );

    expect(screen.getAllByText('Saving...').length).toBe(2);
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
  });

  it('supports keepFocusableWhenDisabled prevention and click interception', () => {
    const handleClick = jest.fn();
    render(
      <Button disabled keepFocusableWhenDisabled onClick={handleClick}>
        Interactable Disabled
      </Button>
    );

    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');

    button.click();
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('supports loadingDelay prop before displaying spinner', () => {
    jest.useFakeTimers();
    render(
      <Button loading loadingDelay={150}>
        Save
      </Button>
    );

    // Spinner should NOT be visible immediately
    expect(screen.queryByRole('presentation', { hidden: true })).not.toBeInTheDocument();

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(150);
    });

    // Spinner should now be visible
    expect(screen.getByRole('presentation', { hidden: true })).toBeInTheDocument();
    jest.useRealTimers();
  });

  it('forwards data-variant and data-size attributes', () => {
    render(
      <Button variant="destructive" size="lg">
        Delete
      </Button>
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-variant', 'destructive');
    expect(button).toHaveAttribute('data-size', 'lg');
  });

  it('improves loading screen-reader announcements', () => {
    render(<Button loading>Save</Button>);
    const loadingText = screen.getByText('Save, loading');
    expect(loadingText).toHaveAttribute('aria-live', 'polite');
    expect(loadingText).toHaveAttribute('role', 'status');
  });
});

describe('ButtonGroup Component', () => {
  it('renders children with horizontal and vertical orientation', () => {
    const { rerender } = render(
      <ButtonGroup orientation="horizontal">
        <Button>First</Button>
        <Button>Second</Button>
      </ButtonGroup>
    );

    let group = screen.getByRole('group');
    expect(group).toHaveClass('flex-row');

    rerender(
      <ButtonGroup orientation="vertical">
        <Button>First</Button>
        <Button>Second</Button>
      </ButtonGroup>
    );

    group = screen.getByRole('group');
    expect(group).toHaveClass('flex-col');
  });

  it('propagates size and variant context to child buttons', () => {
    render(
      <ButtonGroup variant="outline" size="sm">
        <Button>Item</Button>
      </ButtonGroup>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('border-input');
    expect(button).toHaveClass('h-9');
  });
});
