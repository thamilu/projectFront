import * as React from 'react';

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Switch({ label, className = '', ...props }: SwitchProps) {
  return (
    <label className={`inline-flex items-center cursor-pointer ${className}`}>
      <input type="checkbox" className="sr-only peer" {...props} />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 dark:bg-gray-700 rounded-full peer dark:peer-checked:bg-blue-600 peer-checked:bg-blue-600 transition-all relative">
        <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></span>
      </div>
      {label && <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{label}</span>}
    </label>
  );
}
