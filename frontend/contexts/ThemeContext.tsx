'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only running on client
  useEffect(() => {
    setMounted(true);
    // Get theme from localStorage or default to 'light'
    const savedTheme = localStorage.getItem('theme') as Theme || 'light';
    setTheme(savedTheme);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Update localStorage when theme changes
    localStorage.setItem('theme', theme);
    
    // Apply theme to document
    const root = document.documentElement;
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.toggle('dark', systemTheme === 'dark');
      setIsDark(systemTheme === 'dark');
    } else {
      root.classList.toggle('dark', theme === 'dark');
      setIsDark(theme === 'dark');
    }
  }, [theme, mounted]);

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted || theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      const root = document.documentElement;
      root.classList.toggle('dark', e.matches);
      setIsDark(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, mounted]);

  const value: ThemeContextType = {
    theme,
    setTheme,
    isDark,
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 