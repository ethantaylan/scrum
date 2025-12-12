import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', className = '', children, ...props }, ref) => {
    const variants = {
      default: 'bg-white dark:bg-gray-800 rounded-lg',
      bordered: 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg',
      elevated: 'bg-white dark:bg-gray-800 rounded-lg shadow-lg',
    };

    return (
      <div
        ref={ref}
        className={`${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
