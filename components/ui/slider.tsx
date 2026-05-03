import * as React from 'react';

export interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  onValueChange?: (value: number) => void;
}

export function Slider({ min = 0, max = 100, step = 1, value, onValueChange, className = '', ...props }: SliderProps) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onValueChange && onValueChange(Number(e.target.value))}
      className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 ${className}`}
      {...props}
    />
  );
}
