export interface Theme {
  name: string;
  label: string;
  type: 'light' | 'dark';
  colors: {
    // Base colors
    background: string;
    foreground: string;
    
    // Card colors
    card: string;
    cardForeground: string;
    
    // Popover colors
    popover: string;
    popoverForeground: string;
    
    // Primary colors
    primary: string;
    primaryForeground: string;
    
    // Secondary colors
    secondary: string;
    secondaryForeground: string;
    
    // Muted colors
    muted: string;
    mutedForeground: string;
    
    // Accent colors
    accent: string;
    accentForeground: string;
    
    // Destructive colors
    destructive: string;
    destructiveForeground: string;
    
    // Border and input
    border: string;
    input: string;
    ring: string;
    
    // Editor specific
    editorBackground: string;
    editorForeground: string;
    editorSelectionBackground: string;
    editorLineHighlight: string;
    editorGutter: string;
    
    // Syntax highlighting
    syntaxKeyword: string;
    syntaxString: string;
    syntaxComment: string;
    syntaxNumber: string;
    syntaxOperator: string;
    syntaxFunction: string;
    syntaxVariable: string;
  };
}

export const themes: Record<string, Theme> = {
  light: {
    name: 'light',
    label: 'Light',
    type: 'light',
    colors: {
      background: '0 0% 100%',
      foreground: '240 10% 3.9%',
      card: '0 0% 100%',
      cardForeground: '240 10% 3.9%',
      popover: '0 0% 100%',
      popoverForeground: '240 10% 3.9%',
      primary: '240 5.9% 10%',
      primaryForeground: '0 0% 98%',
      secondary: '240 4.8% 95.9%',
      secondaryForeground: '240 5.9% 10%',
      muted: '240 4.8% 95.9%',
      mutedForeground: '240 3.8% 46.1%',
      accent: '240 4.8% 95.9%',
      accentForeground: '240 5.9% 10%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '0 0% 98%',
      border: '240 5.9% 90%',
      input: '240 5.9% 90%',
      ring: '240 5.9% 10%',
      editorBackground: '0 0% 100%',
      editorForeground: '240 10% 3.9%',
      editorSelectionBackground: '210 40% 92%',
      editorLineHighlight: '240 4.8% 97%',
      editorGutter: '240 4.8% 95.9%',
      syntaxKeyword: '270 70% 40%',
      syntaxString: '140 40% 40%',
      syntaxComment: '240 3.8% 46.1%',
      syntaxNumber: '25 70% 50%',
      syntaxOperator: '240 10% 3.9%',
      syntaxFunction: '210 70% 50%',
      syntaxVariable: '350 70% 50%',
    },
  },
  
  dark: {
    name: 'dark',
    label: 'Dark',
    type: 'dark',
    colors: {
      background: '240 10% 3.9%',
      foreground: '0 0% 98%',
      card: '240 10% 3.9%',
      cardForeground: '0 0% 98%',
      popover: '240 10% 3.9%',
      popoverForeground: '0 0% 98%',
      primary: '0 0% 98%',
      primaryForeground: '240 5.9% 10%',
      secondary: '240 3.7% 15.9%',
      secondaryForeground: '0 0% 98%',
      muted: '240 3.7% 15.9%',
      mutedForeground: '240 5% 64.9%',
      accent: '240 3.7% 15.9%',
      accentForeground: '0 0% 98%',
      destructive: '0 62.8% 30.6%',
      destructiveForeground: '0 0% 98%',
      border: '240 3.7% 15.9%',
      input: '240 3.7% 15.9%',
      ring: '240 4.9% 83.9%',
      editorBackground: '240 10% 3.9%',
      editorForeground: '0 0% 98%',
      editorSelectionBackground: '240 15% 20%',
      editorLineHighlight: '240 5% 8%',
      editorGutter: '240 3.7% 15.9%',
      syntaxKeyword: '270 70% 70%',
      syntaxString: '140 50% 70%',
      syntaxComment: '240 5% 64.9%',
      syntaxNumber: '25 70% 70%',
      syntaxOperator: '0 0% 85%',
      syntaxFunction: '210 70% 70%',
      syntaxVariable: '350 70% 70%',
    },
  },
  
  dracula: {
    name: 'dracula',
    label: 'Dracula',
    type: 'dark',
    colors: {
      background: '231 15% 18%',
      foreground: '60 30% 96%',
      card: '231 15% 18%',
      cardForeground: '60 30% 96%',
      popover: '232 14% 31%',
      popoverForeground: '60 30% 96%',
      primary: '326 100% 74%',
      primaryForeground: '231 15% 18%',
      secondary: '232 14% 31%',
      secondaryForeground: '60 30% 96%',
      muted: '230 14% 26%',
      mutedForeground: '226 14% 71%',
      accent: '265 89% 78%',
      accentForeground: '231 15% 18%',
      destructive: '0 100% 67%',
      destructiveForeground: '60 30% 96%',
      border: '230 14% 26%',
      input: '230 14% 26%',
      ring: '326 100% 74%',
      editorBackground: '231 15% 18%',
      editorForeground: '60 30% 96%',
      editorSelectionBackground: '232 14% 31%',
      editorLineHighlight: '230 14% 21%',
      editorGutter: '230 14% 26%',
      syntaxKeyword: '326 100% 74%',
      syntaxString: '135 94% 65%',
      syntaxComment: '225 27% 51%',
      syntaxNumber: '265 89% 78%',
      syntaxOperator: '326 100% 74%',
      syntaxFunction: '135 94% 65%',
      syntaxVariable: '191 97% 77%',
    },
  },
  
  solarized: {
    name: 'solarized',
    label: 'Solarized Dark',
    type: 'dark',
    colors: {
      background: '192 100% 11%',
      foreground: '44 87% 94%',
      card: '193 100% 12%',
      cardForeground: '44 87% 94%',
      popover: '194 25% 20%',
      popoverForeground: '44 87% 94%',
      primary: '33 100% 50%',
      primaryForeground: '192 100% 11%',
      secondary: '194 25% 20%',
      secondaryForeground: '44 87% 94%',
      muted: '194 14% 23%',
      mutedForeground: '186 8% 55%',
      accent: '68 100% 30%',
      accentForeground: '44 87% 94%',
      destructive: '1 71% 52%',
      destructiveForeground: '44 87% 94%',
      border: '194 14% 23%',
      input: '194 14% 23%',
      ring: '33 100% 50%',
      editorBackground: '192 100% 11%',
      editorForeground: '44 87% 94%',
      editorSelectionBackground: '194 25% 20%',
      editorLineHighlight: '193 100% 12%',
      editorGutter: '194 14% 23%',
      syntaxKeyword: '68 100% 30%',
      syntaxString: '1 71% 52%',
      syntaxComment: '186 8% 55%',
      syntaxNumber: '237 45% 77%',
      syntaxOperator: '33 100% 50%',
      syntaxFunction: '205 69% 98%',
      syntaxVariable: '33 100% 50%',
    },
  },
  
  github: {
    name: 'github',
    label: 'GitHub',
    type: 'light',
    colors: {
      background: '0 0% 100%',
      foreground: '215 14% 34%',
      card: '0 0% 100%',
      cardForeground: '215 14% 34%',
      popover: '0 0% 100%',
      popoverForeground: '215 14% 34%',
      primary: '212 92% 45%',
      primaryForeground: '0 0% 100%',
      secondary: '210 16% 96%',
      secondaryForeground: '215 14% 34%',
      muted: '210 16% 96%',
      mutedForeground: '215 8% 47%',
      accent: '210 16% 96%',
      accentForeground: '215 14% 34%',
      destructive: '0 65% 51%',
      destructiveForeground: '0 0% 100%',
      border: '214 18% 87%',
      input: '214 18% 87%',
      ring: '212 92% 45%',
      editorBackground: '0 0% 100%',
      editorForeground: '215 14% 34%',
      editorSelectionBackground: '210 40% 95%',
      editorLineHighlight: '210 16% 98%',
      editorGutter: '210 16% 96%',
      syntaxKeyword: '262 52% 47%',
      syntaxString: '137 42% 27%',
      syntaxComment: '215 8% 47%',
      syntaxNumber: '212 92% 45%',
      syntaxOperator: '215 14% 34%',
      syntaxFunction: '262 52% 47%',
      syntaxVariable: '340 82% 42%',
    },
  },
  
  monokai: {
    name: 'monokai',
    label: 'Monokai',
    type: 'dark',
    colors: {
      background: '70 8% 15%',
      foreground: '60 30% 96%',
      card: '70 8% 15%',
      cardForeground: '60 30% 96%',
      popover: '70 8% 20%',
      popoverForeground: '60 30% 96%',
      primary: '326 100% 74%',
      primaryForeground: '70 8% 15%',
      secondary: '70 8% 20%',
      secondaryForeground: '60 30% 96%',
      muted: '70 8% 25%',
      mutedForeground: '60 10% 70%',
      accent: '186 100% 69%',
      accentForeground: '70 8% 15%',
      destructive: '0 100% 67%',
      destructiveForeground: '60 30% 96%',
      border: '70 8% 25%',
      input: '70 8% 25%',
      ring: '326 100% 74%',
      editorBackground: '70 8% 15%',
      editorForeground: '60 30% 96%',
      editorSelectionBackground: '70 8% 25%',
      editorLineHighlight: '70 8% 18%',
      editorGutter: '70 8% 20%',
      syntaxKeyword: '326 100% 74%',
      syntaxString: '80 76% 53%',
      syntaxComment: '60 10% 70%',
      syntaxNumber: '280 100% 69%',
      syntaxOperator: '326 100% 74%',
      syntaxFunction: '186 100% 69%',
      syntaxVariable: '48 100% 67%',
    },
  },
  
  nord: {
    name: 'nord',
    label: 'Nord',
    type: 'dark',
    colors: {
      background: '220 16% 22%',
      foreground: '218 27% 94%',
      card: '220 16% 22%',
      cardForeground: '218 27% 94%',
      popover: '220 17% 32%',
      popoverForeground: '218 27% 94%',
      primary: '213 32% 52%',
      primaryForeground: '220 16% 22%',
      secondary: '220 17% 32%',
      secondaryForeground: '218 27% 94%',
      muted: '220 13% 36%',
      mutedForeground: '220 9% 55%',
      accent: '179 25% 65%',
      accentForeground: '220 16% 22%',
      destructive: '354 42% 56%',
      destructiveForeground: '218 27% 94%',
      border: '220 13% 36%',
      input: '220 13% 36%',
      ring: '213 32% 52%',
      editorBackground: '220 16% 22%',
      editorForeground: '218 27% 94%',
      editorSelectionBackground: '220 17% 32%',
      editorLineHighlight: '220 16% 25%',
      editorGutter: '220 13% 36%',
      syntaxKeyword: '213 32% 52%',
      syntaxString: '92 28% 65%',
      syntaxComment: '220 9% 55%',
      syntaxNumber: '311 20% 63%',
      syntaxOperator: '180 25% 65%',
      syntaxFunction: '179 25% 65%',
      syntaxVariable: '14 51% 63%',
    },
  },
  
  ayu: {
    name: 'ayu',
    label: 'Ayu Dark',
    type: 'dark',
    colors: {
      background: '216 100% 4%',
      foreground: '42 39% 75%',
      card: '216 100% 4%',
      cardForeground: '42 39% 75%',
      popover: '215 28% 17%',
      popoverForeground: '42 39% 75%',
      primary: '39 100% 57%',
      primaryForeground: '216 100% 4%',
      secondary: '215 28% 17%',
      secondaryForeground: '42 39% 75%',
      muted: '215 28% 17%',
      mutedForeground: '218 11% 51%',
      accent: '187 47% 55%',
      accentForeground: '216 100% 4%',
      destructive: '14 100% 57%',
      destructiveForeground: '42 39% 75%',
      border: '215 28% 17%',
      input: '215 28% 17%',
      ring: '39 100% 57%',
      editorBackground: '216 100% 4%',
      editorForeground: '42 39% 75%',
      editorSelectionBackground: '215 28% 17%',
      editorLineHighlight: '215 33% 8%',
      editorGutter: '215 28% 17%',
      syntaxKeyword: '27 100% 57%',
      syntaxString: '95 38% 62%',
      syntaxComment: '218 11% 51%',
      syntaxNumber: '221 87% 60%',
      syntaxOperator: '39 100% 57%',
      syntaxFunction: '187 47% 55%',
      syntaxVariable: '359 100% 69%',
    },
  },
};

export const getThemeNames = (): string[] => Object.keys(themes);

export const getTheme = (name: string): Theme => {
  return themes[name] || themes.light;
};

export const applyTheme = (theme: Theme): void => {
  const root = document.documentElement;
  
  // Apply all CSS variables
  Object.entries(theme.colors).forEach(([key, value]) => {
    const cssVarName = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    root.style.setProperty(`--${cssVarName}`, value);
  });
  
  // Apply theme class for dark mode detection
  if (theme.type === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  
  // Apply theme name as a class for theme-specific styling
  root.className = root.className.replace(/theme-\w+/g, '');
  root.classList.add(`theme-${theme.name}`);
};

export const getStoredTheme = (): string => {
  return localStorage.getItem('notty-theme') || 'system';
};

export const setStoredTheme = (themeName: string): void => {
  localStorage.setItem('notty-theme', themeName);
};

export const getSystemTheme = (): 'light' | 'dark' => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const resolveTheme = (themeName: string): Theme => {
  if (themeName === 'system') {
    const systemTheme = getSystemTheme();
    return getTheme(systemTheme);
  }
  return getTheme(themeName);
}; 