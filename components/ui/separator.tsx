import * as React from 'react';

export function Separator({ className = '', ...props }: React.HTMLAttributes<HTMLHRElement>) {
  return <hr className={`border-t border-gray-200 dark:border-gray-700 my-4 ${className}`} {...props} />;
}
