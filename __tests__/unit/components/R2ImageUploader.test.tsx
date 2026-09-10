import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { R2ImageUploader } from '@/shared/ui/forms/R2ImageUploader';

jest.mock('@/infrastructure/image/compression', () => ({
  compressImage: jest.fn(async (file: File) => file),
}));

jest.mock('sonner', () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

jest.mock('next/image', () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: (props: any) => {
    // A plain <img> is the point of this mock: next/image cannot render in
    // jsdom. No disable comment is needed — this project's flat config
    // registers neither `@next/next` nor `jsx-a11y`, and naming a rule ESLint
    // does not know is itself an error ("Definition for rule ... was not
    // found"), which is what the previous comment here caused.
    return <img {...props} src={props.src} alt={props.alt} />;
  },
}));

beforeAll(() => {
  global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
  global.URL.revokeObjectURL = jest.fn();
});

describe('R2ImageUploader — keyboard accessibility', () => {
  // Regression: the dropzone was a bare `<div onClick=...>` with no role,
  // tabIndex, or key handler, and the file <input> was removed from the tab
  // order entirely (`className="hidden"`) — a keyboard-only seller could
  // never open the file picker to add product images.

  it('exposes the dropzone as a focusable, keyboard-activatable button', () => {
    const onFilesChange = jest.fn();
    render(<R2ImageUploader files={[]} onFilesChange={onFilesChange} maxFiles={5} />);

    const dropzone = screen.getByRole('button', { name: /upload product images/i });
    expect(dropzone).toHaveAttribute('tabIndex', '0');
  });

  it('opens the file picker on Enter and Space, not just click', () => {
    const onFilesChange = jest.fn();
    render(<R2ImageUploader files={[]} onFilesChange={onFilesChange} maxFiles={5} />);

    const dropzone = screen.getByRole('button', { name: /upload product images/i });
    const fileInput = dropzone.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = jest.spyOn(fileInput, 'click').mockImplementation(() => {});

    fireEvent.keyDown(dropzone, { key: 'Enter' });
    expect(clickSpy).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(dropzone, { key: ' ' });
    expect(clickSpy).toHaveBeenCalledTimes(2);

    clickSpy.mockRestore();
  });

  it('marks the dropzone non-interactive once the file limit is reached', () => {
    const files = [new File(['a'], 'a.png', { type: 'image/png' })];
    render(<R2ImageUploader files={files} onFilesChange={jest.fn()} maxFiles={1} />);

    const dropzone = screen.getByRole('button', { name: /maximum of 1 images reached/i });
    expect(dropzone).toHaveAttribute('aria-disabled', 'true');
    expect(dropzone).toHaveAttribute('tabIndex', '-1');
  });
});
