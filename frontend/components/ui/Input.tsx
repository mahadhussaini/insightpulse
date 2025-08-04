'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'outlined' | 'filled';
  inputSize?: 'sm' | 'md' | 'lg';
  error?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant = 'default',
      inputSize = 'md',
      error = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'block border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      default: 'border-gray-300 bg-white placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500',
      outlined: 'border-2 border-gray-300 bg-white placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500',
      filled: 'border-gray-300 bg-gray-50 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500 focus:bg-white',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-3 py-2 text-sm',
      lg: 'px-4 py-3 text-base',
    };

    const errorClasses = error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : '';

    const classes = cn(
      baseClasses,
      variants[variant],
      sizes[inputSize],
      errorClasses,
      fullWidth && 'w-full',
      (leftIcon || rightIcon) && 'pl-10 pr-10',
      leftIcon && 'pl-10',
      rightIcon && 'pr-10',
      className
    );

    return (
      <div className={cn('relative', fullWidth && 'w-full')}>
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="text-gray-400">{leftIcon}</div>
          </div>
        )}
        <input
          ref={ref}
          className={classes}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="text-gray-400">{rightIcon}</div>
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input; 