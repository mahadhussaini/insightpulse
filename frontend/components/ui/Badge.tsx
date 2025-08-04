'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'sentiment' | 'urgency' | 'status' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  sentiment?: 'positive' | 'negative' | 'neutral';
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'connected' | 'disconnected' | 'error' | 'syncing';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      sentiment,
      urgency,
      status,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'inline-flex items-center font-medium rounded-full border transition-colors';
    
    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
      lg: 'px-3 py-1.5 text-base',
    };

    let variantClasses = '';
    
    if (variant === 'sentiment' && sentiment) {
      variantClasses = cn(
        sentiment === 'positive' && 'text-green-600 bg-green-50 border-green-200',
        sentiment === 'negative' && 'text-red-600 bg-red-50 border-red-200',
        sentiment === 'neutral' && 'text-gray-600 bg-gray-50 border-gray-200'
      );
    } else if (variant === 'urgency' && urgency) {
      variantClasses = cn(
        urgency === 'critical' && 'text-red-600 bg-red-50 border-red-200',
        urgency === 'high' && 'text-orange-600 bg-orange-50 border-orange-200',
        urgency === 'medium' && 'text-yellow-600 bg-yellow-50 border-yellow-200',
        urgency === 'low' && 'text-green-600 bg-green-50 border-green-200'
      );
    } else if (variant === 'status' && status) {
      variantClasses = cn(
        status === 'connected' && 'text-green-600 bg-green-50 border-green-200',
        status === 'disconnected' && 'text-gray-600 bg-gray-50 border-gray-200',
        status === 'error' && 'text-red-600 bg-red-50 border-red-200',
        status === 'syncing' && 'text-blue-600 bg-blue-50 border-blue-200'
      );
    } else {
      variantClasses = cn(
        variant === 'default' && 'text-gray-600 bg-gray-50 border-gray-200',
        variant === 'success' && 'text-green-600 bg-green-50 border-green-200',
        variant === 'warning' && 'text-yellow-600 bg-yellow-50 border-yellow-200',
        variant === 'error' && 'text-red-600 bg-red-50 border-red-200',
        variant === 'info' && 'text-blue-600 bg-blue-50 border-blue-200'
      );
    }

    const classes = cn(
      baseClasses,
      sizes[size],
      variantClasses,
      className
    );

    return (
      <span ref={ref} className={classes} {...props}>
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge; 