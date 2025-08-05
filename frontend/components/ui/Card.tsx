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

    // Check if any motion props are being passed from parent
    const hasMotionProps = (props as any).whileHover || (props as any).whileTap || (props as any).whileFocus || (props as any).initial || (props as any).animate || (props as any).exit || (props as any).transition;
    
    // Only use motion.div if hover is true AND no motion props are passed from parent
    const MotionComponent = (hover && !hasMotionProps) ? motion.div : 'div';

    // Filter out Framer Motion props when not using motion
    const motionProps = (hover && !hasMotionProps) ? {
      whileHover: { y: -2 }
    } : {};

    // Filter out motion props from regular props when not using motion
    const { whileHover, whileTap, whileFocus, initial, animate, exit, transition, ...domProps } = props as any;

    return (
      <MotionComponent
        ref={ref}
        className={classes}
        {...(hover && !hasMotionProps ? { ...motionProps, ...domProps } : domProps)}
      >
        {children}
      </MotionComponent>
    );
  }
);

Card.displayName = 'Card';

export default Card; 