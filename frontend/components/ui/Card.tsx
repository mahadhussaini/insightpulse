'use client';

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost';
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hover = false, padding = 'md', children, ...props }, ref) => {
    const baseClasses = 'rounded-lg transition-all duration-200';
    
    const variants = {
      default: 'bg-white border border-gray-200 shadow-sm',
      elevated: 'bg-white border border-gray-200 shadow-md hover:shadow-lg',
      outlined: 'bg-white border-2 border-gray-200',
      ghost: 'bg-transparent',
    };

    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-6',
      lg: 'p-8',
    };

    const classes = cn(
      baseClasses,
      variants[variant],
      paddings[padding],
      hover && 'hover:shadow-md hover:border-gray-300',
      className
    );

    const MotionComponent = hover ? motion.div : 'div';

    return (
      <MotionComponent
        ref={ref}
        className={classes}
        whileHover={hover ? { y: -2 } : undefined}
        {...(props as any)}
      >
        {children}
      </MotionComponent>
    );
  }
);

Card.displayName = 'Card';

export default Card; 