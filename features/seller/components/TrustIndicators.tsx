import React from 'react';

export interface TrustIndicatorItem {
  id: string;
  iconPath: string;
  bgColor: string;
  textColor: string;
  title: string;
  description: string;
}

export interface TrustIndicatorsProps {
  items: TrustIndicatorItem[];
  registrationFormTitle: string;
}

export function TrustIndicators({ items, registrationFormTitle }: TrustIndicatorsProps): React.JSX.Element {
  return (
    <aside
      aria-labelledby="trust-indicators-title"
      className="rounded-2xl mx-auto flex max-w-4xl flex-col items-start justify-around gap-6 border border-slate-100/80 bg-white p-6 shadow-xs md:flex-row md:items-center dark:border-slate-800 dark:bg-slate-900"
    >
      <h2 id="trust-indicators-title" className="sr-only">
        {registrationFormTitle}
      </h2>

      {items.map((indicator) => (
        <div
          key={indicator.id}
          className="group flex items-center space-x-4"
          data-testid={`trust-indicator-${indicator.id}`}
        >
          <div
            className={`p-3 ${indicator.bgColor} ${indicator.textColor} rounded-xl transition-all`}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={indicator.iconPath}
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {indicator.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {indicator.description}
            </p>
          </div>
        </div>
      ))}
    </aside>
  );
}

export default TrustIndicators;
