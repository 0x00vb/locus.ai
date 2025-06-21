import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { 
  Theme, 
  getTheme, 
  getThemeNames, 
  applyTheme, 
  getStoredTheme, 
  setStoredTheme, 
  getSystemTheme, 
  resolveTheme 
} from './index';

interface ThemeContextType {
  currentTheme: Theme;
  themeName: string;
  availableThemes: string[];
  setTheme: (themeName: string) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: string;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultTheme = 'system' 
}) => {
  const [themeName, setThemeName] = useState<string>(() => {
    return getStoredTheme() || defaultTheme;
  });
  
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    return resolveTheme(themeName);
  });

  const availableThemes = getThemeNames();

  // FIXED: Memoize setTheme function to prevent context value changes
  const setTheme = useCallback((newThemeName: string) => {
    setThemeName(newThemeName);
    setStoredTheme(newThemeName);
    
    const theme = resolveTheme(newThemeName);
    setCurrentTheme(theme);
    applyTheme(theme);
  }, []); // No dependencies - function is stable

  // FIXED: Memoize toggleTheme function to prevent context value changes  
  const toggleTheme = useCallback(() => {
    if (themeName === 'system') {
      const systemTheme = getSystemTheme();
      setTheme(systemTheme === 'dark' ? 'light' : 'dark');
    } else {
      const theme = getTheme(themeName);
      setTheme(theme.type === 'dark' ? 'light' : 'dark');
    }
  }, [themeName, setTheme]); // Only depend on themeName and stable setTheme

  // Listen for system theme changes when using system theme
  useEffect(() => {
    if (themeName === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleSystemThemeChange = () => {
        const theme = resolveTheme('system');
        setCurrentTheme(theme);
        applyTheme(theme);
      };

      mediaQuery.addEventListener('change', handleSystemThemeChange);
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }
  }, [themeName]);

  // Apply theme on mount and when theme changes
  useEffect(() => {
    const theme = resolveTheme(themeName);
    setCurrentTheme(theme);
    applyTheme(theme);
  }, [themeName]);

  // Keyboard shortcut for theme switching
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd+Shift+T (Mac) or Ctrl+Shift+T (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'T') {
        event.preventDefault();
        toggleTheme();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleTheme]);

  // FIXED: Now stable - setTheme and toggleTheme are memoized
  const value: ThemeContextType = useMemo(() => ({
    currentTheme,
    themeName,
    availableThemes,
    setTheme,
    toggleTheme,
    isDark: currentTheme.type === 'dark',
  }), [currentTheme, themeName, availableThemes, setTheme, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 