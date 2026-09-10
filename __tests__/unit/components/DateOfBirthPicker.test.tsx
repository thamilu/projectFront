import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateOfBirthPicker } from '@/shared/ui/molecules/date-picker/dob/DateOfBirthPicker';
import {
  calculateExactAge,
  deriveDobBoundaries,
  validateDob,
} from '@/shared/ui/molecules/date-picker/utils/date-validation';
import { normalizeDateInput } from '@/shared/ui/molecules/date-picker/utils/date-mask';
import {
  isLeapYear,
  getDaysInMonth,
} from '@/shared/ui/molecules/date-picker/utils/date-format';

// Mock ResizeObserver, scrollTo, and scrollIntoView for JSDOM environment
beforeAll(() => {
  class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  global.ResizeObserver = MockResizeObserver;
  window.HTMLElement.prototype.scrollTo = jest.fn();
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

describe('DateOfBirthPicker Component — Enterprise Test Suite', () => {
  describe('Rendering & Direct Input', () => {
    it('renders input with default placeholder DD / MM / YYYY', () => {
      render(<DateOfBirthPicker value={null} onChange={jest.fn()} />);
      const input = screen.getByPlaceholderText('DD / MM / YYYY');
      expect(input).toBeInTheDocument();
    });

    it('formats initial ISO value to DD/MM/YYYY display in the input', () => {
      render(<DateOfBirthPicker value="1996-03-20" onChange={jest.fn()} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('20/03/1996');
    });

    it('renders calculated age badge when valid date is provided', () => {
      render(<DateOfBirthPicker value="1996-03-20" onChange={jest.fn()} showAgeBadge={true} />);
      expect(screen.getByText(/Age: \d+ years/i)).toBeInTheDocument();
    });

    it('handles direct typing with auto-slash insertion and commits valid ISO on completion', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      render(<DateOfBirthPicker value={null} onChange={handleChange} />);

      const input = screen.getByPlaceholderText('DD / MM / YYYY');
      await user.type(input, '20031996');

      expect(input).toHaveValue('20/03/1996');
      expect(handleChange).toHaveBeenCalledWith('1996-03-20');
    });

    it('handles pasting delimited dates (hyphen, dot, slash)', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      render(<DateOfBirthPicker value={null} onChange={handleChange} />);

      const input = screen.getByPlaceholderText('DD / MM / YYYY');
      await user.click(input);
      await user.paste('20-03-1996');

      expect(input).toHaveValue('20/03/1996');
      expect(handleChange).toHaveBeenCalledWith('1996-03-20');
    });

    it('clears input and calls onChange(null) when clear button is clicked', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      render(<DateOfBirthPicker value="1996-03-20" onChange={handleChange} clearable={true} />);

      const clearBtn = screen.getByRole('button', { name: /clear date of birth/i });
      await user.click(clearBtn);

      expect(handleChange).toHaveBeenCalledWith(null);
      const input = screen.getByPlaceholderText('DD / MM / YYYY');
      expect(input).toHaveValue('');
    });
  });

  describe('Popover & Direct Month/Year Navigation', () => {
    it('opens popover with direct Month and Year dropdown selectors', async () => {
      const user = userEvent.setup();
      render(<DateOfBirthPicker value="1996-03-20" onChange={jest.fn()} />);

      const triggerBtn = screen.getByRole('button', { name: /open date of birth calendar/i });
      await user.click(triggerBtn);

      expect(screen.getByText('Select date of birth')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /select month/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /select year/i })).toBeInTheDocument();
    });

    it('jumps month and year via direct dropdown selection', () => {
      render(<DateOfBirthPicker value="1996-03-20" onChange={jest.fn()} />);

      fireEvent.click(screen.getByRole('button', { name: /open date of birth calendar/i }));

      // Open Month dropdown and choose June
      const monthBtn = screen.getByRole('button', { name: /select month/i });
      fireEvent.click(monthBtn);
      const juneOption = screen.getByRole('option', { name: 'June' });
      fireEvent.click(juneOption);

      // Open Year dropdown and choose 1990
      const yearBtn = screen.getByRole('button', { name: /select year/i });
      fireEvent.click(yearBtn);
      const year1990Option = screen.getByRole('option', { name: '1990' });
      fireEvent.click(year1990Option);

      expect(screen.getByRole('button', { name: /select month/i })).toHaveTextContent('June');
      expect(screen.getByRole('button', { name: /select year/i })).toHaveTextContent('1990');
    });

    it('supports draft selection with Cancel and Apply actions', () => {
      const handleChange = jest.fn();
      render(<DateOfBirthPicker value="1996-03-20" onChange={handleChange} />);

      // Open popover
      fireEvent.click(screen.getByRole('button', { name: /open date of birth calendar/i }));

      // Pick 15th day in current view
      const dayCell = screen.getByRole('gridcell', { name: /Friday, March 15, 1996/i });
      fireEvent.click(dayCell);

      // Verify Apply button is enabled and draft age is updated
      const applyBtn = screen.getByRole('button', { name: /apply/i });
      expect(applyBtn).not.toBeDisabled();

      // Click Cancel -> should not commit
      const cancelBtn = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelBtn);
      expect(handleChange).not.toHaveBeenCalled();

      // Open again, pick 15th, and click Apply
      fireEvent.click(screen.getByRole('button', { name: /open date of birth calendar/i }));
      const dayCell2 = screen.getByRole('gridcell', { name: /Friday, March 15, 1996/i });
      fireEvent.click(dayCell2);

      const applyBtn2 = screen.getByRole('button', { name: /apply/i });
      fireEvent.click(applyBtn2);
      expect(handleChange).toHaveBeenCalledWith('1996-03-15');
    });
  });

  describe('Age Validation & Boundary Constraints', () => {
    it('enforces minAge constraint and derives effectiveMaxDate', () => {
      const today = new Date(2026, 7, 20); // Aug 20, 2026
      const { effectiveMaxDate } = deriveDobBoundaries({
        minAge: 18,
        referenceDate: today,
      });

      // Ceiling should be Aug 20, 2008 (today - 18 years)
      expect(effectiveMaxDate.getFullYear()).toBe(2008);
      expect(effectiveMaxDate.getMonth()).toBe(7);
      expect(effectiveMaxDate.getDate()).toBe(20);
    });

    it('validates minimum age requirement and returns error if under 18', () => {
      const resultUnder18 = validateDob('2015-05-10', 18);
      expect(resultUnder18.valid).toBe(false);
      expect(resultUnder18.error).toMatch(/Must be at least 18 years old/i);

      const resultAdult = validateDob('2000-01-15', 18);
      expect(resultAdult.valid).toBe(true);
      expect(resultAdult.age).toBeGreaterThanOrEqual(18);
    });

    it('prohibits future dates of birth', () => {
      const futureResult = validateDob('2099-01-01');
      expect(futureResult.valid).toBe(false);
      expect(futureResult.error).toMatch(/cannot be in the future/i);
    });
  });

  describe('Birthday-Aware Age Mathematics & Leap-Day Correctness', () => {
    it('accurately calculates age before and after birthday in the reference year', () => {
      const refDate = new Date(2026, 7, 20); // August 20, 2026

      // Born Dec 20, 1996 -> Birthday has NOT occurred yet in 2026 -> Age is 29
      const ageBefore = calculateExactAge('1996-12-20', refDate);
      expect(ageBefore).toBe(29);

      // Born Jan 20, 1996 -> Birthday has occurred in 2026 -> Age is 30
      const ageAfter = calculateExactAge('1996-01-20', refDate);
      expect(ageAfter).toBe(30);

      // Born Aug 20, 1996 (Today is exact birthday) -> Age is 30
      const ageExact = calculateExactAge('1996-08-20', refDate);
      expect(ageExact).toBe(30);
    });

    it('handles Feb 29 leap-year birthdays correctly on non-leap years', () => {
      // Born Feb 29, 2000 (Leap Year)
      const nonLeapRefAfter = new Date(2025, 2, 1); // March 1, 2025
      const age2025After = calculateExactAge('2000-02-29', nonLeapRefAfter);
      expect(age2025After).toBe(25);

      const nonLeapRefBefore = new Date(2025, 1, 27); // Feb 27, 2025
      const age2025Before = calculateExactAge('2000-02-29', nonLeapRefBefore);
      expect(age2025Before).toBe(24);
    });

    it('correctly identifies leap years and days in months', () => {
      expect(isLeapYear(2000)).toBe(true);
      expect(isLeapYear(2024)).toBe(true);
      expect(isLeapYear(2026)).toBe(false);
      expect(isLeapYear(1900)).toBe(false);

      expect(getDaysInMonth(2024, 2)).toBe(29);
      expect(getDaysInMonth(2026, 2)).toBe(28);
      expect(getDaysInMonth(2026, 4)).toBe(30);
      expect(getDaysInMonth(2026, 8)).toBe(31);
    });

    it('normalizes various date input formats into canonical ISODate', () => {
      expect(normalizeDateInput('20-03-1996').iso).toBe('1996-03-20');
      expect(normalizeDateInput('20.03.1996').iso).toBe('1996-03-20');
      expect(normalizeDateInput('20/03/1996').iso).toBe('1996-03-20');
      expect(normalizeDateInput('20031996').iso).toBe('1996-03-20');
      expect(normalizeDateInput('1996-03-20').iso).toBe('1996-03-20');
      expect(normalizeDateInput('invalid').iso).toBeNull();
    });
  });
});
