import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { ThemeShortcutListener } from '@/core/providers/theme-shortcut-listener';
import { useTheme } from 'next-themes';

jest.mock('next-themes', () => ({
  useTheme: jest.fn(),
}));

describe('ThemeShortcutListener Component', () => {
  const mockSetTheme = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('cycles theme from system to light on Ctrl+Shift+L', () => {
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'system',
      setTheme: mockSetTheme,
    });

    render(<ThemeShortcutListener />);

    fireEvent.keyDown(document, {
      ctrlKey: true,
      shiftKey: true,
      key: 'L',
    });

    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('cycles theme from light to dark on Ctrl+Shift+L', () => {
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
    });

    render(<ThemeShortcutListener />);

    fireEvent.keyDown(document, {
      ctrlKey: true,
      shiftKey: true,
      key: 'l',
    });

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('cycles theme from dark to system on Ctrl+Shift+L', () => {
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
    });

    render(<ThemeShortcutListener />);

    fireEvent.keyDown(document, {
      ctrlKey: true,
      shiftKey: true,
      key: 'L',
    });

    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });

  it('ignores Ctrl+Shift+L when focus is inside an input element', () => {
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'system',
      setTheme: mockSetTheme,
    });

    render(
      <div>
        <ThemeShortcutListener />
        <input data-testid="test-input" type="text" />
      </div>
    );

    const input = document.querySelector('input')!;
    fireEvent.keyDown(input, {
      ctrlKey: true,
      shiftKey: true,
      key: 'L',
    });

    expect(mockSetTheme).not.toHaveBeenCalled();
  });

  it('ignores Ctrl+Shift+L when focus is inside a textarea element', () => {
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'system',
      setTheme: mockSetTheme,
    });

    render(
      <div>
        <ThemeShortcutListener />
        <textarea data-testid="test-textarea" />
      </div>
    );

    const textarea = document.querySelector('textarea')!;
    fireEvent.keyDown(textarea, {
      ctrlKey: true,
      shiftKey: true,
      key: 'L',
    });

    expect(mockSetTheme).not.toHaveBeenCalled();
  });

  it('ignores Ctrl+Shift+L when focus is inside a contenteditable element', () => {
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'system',
      setTheme: mockSetTheme,
    });

    render(
      <div>
        <ThemeShortcutListener />
        <div data-testid="test-editable" contentEditable={true} />
      </div>
    );

    const editable = document.querySelector('[contenteditable]')!;
    fireEvent.keyDown(editable, {
      ctrlKey: true,
      shiftKey: true,
      key: 'L',
    });

    expect(mockSetTheme).not.toHaveBeenCalled();
  });
});
