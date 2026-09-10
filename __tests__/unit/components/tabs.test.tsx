import React from 'react';
import { render, screen } from '@testing-library/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/atoms/tabs';

describe('Tabs Component', () => {
  it('renders default tabs successfully', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList aria-label="Test tabs">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Content 1')).toBeInTheDocument();
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
  });

  it('applies variant styling from context', () => {
    const { container } = render(
      <Tabs variant="underline" defaultValue="tab1">
        <TabsList aria-label="Test tabs">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
      </Tabs>
    );

    const list = container.querySelector('[data-slot="tabs-list"]');
    const trigger = container.querySelector('[data-slot="tabs-trigger"]');
    const content = container.querySelector('[data-slot="tabs-content"]');

    expect(list).toHaveAttribute('data-variant', 'underline');
    expect(trigger).toHaveAttribute('data-variant', 'underline');
    expect(content).toHaveAttribute('data-variant', 'underline');
  });

  it('handles vertical layout orientation correctly', () => {
    const { container } = render(
      <Tabs variant="vertical" orientation="vertical" defaultValue="tab1">
        <TabsList aria-label="Test tabs">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
      </Tabs>
    );

    const root = container.querySelector('[data-slot="tabs"]');
    const list = container.querySelector('[data-slot="tabs-list"]');

    expect(root).toHaveClass('flex-row');
    expect(list).toHaveClass('flex-col');
  });

  it('applies focus and interactive transition classes to triggers', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList aria-label="Test tabs">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
      </Tabs>
    );

    const trigger = screen.getByRole('tab');
    expect(trigger).toHaveClass('transition-all');
    expect(trigger).toHaveClass('focus-visible:ring-2');
  });

  it('triggers a development warning when TabsList lacks an accessible name', () => {
    const consoleWarnMock = jest.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
      </Tabs>
    );

    expect(consoleWarnMock).toHaveBeenCalledWith(
      expect.stringContaining('[Tabs] TabsList is missing an accessible name')
    );

    consoleWarnMock.mockRestore();
  });

  it('triggers a development warning when an icon-only TabsTrigger lacks an accessible name', () => {
    const consoleWarnMock = jest.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <Tabs defaultValue="tab1">
        <TabsList aria-label="Test tabs">
          <TabsTrigger value="tab1">
            <span data-testid="icon">🔍</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    );

    expect(consoleWarnMock).toHaveBeenCalledWith(
      expect.stringContaining('[Tabs] Icon-only TabsTrigger requires an accessible name')
    );

    consoleWarnMock.mockRestore();
  });
});
