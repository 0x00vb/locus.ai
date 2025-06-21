import React from 'react';
import { ChevronDown, Palette } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { themes } from './index';

interface ThemeSelectorProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ 
  className = '', 
  showLabel = true 
}) => {
  const { themeName, setTheme, currentTheme } = useTheme();

  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(event.target.value);
  };

  const getThemeDisplayName = (name: string) => {
    if (name === 'system') return 'System';
    return themes[name]?.label || name;
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {showLabel && (
        <div className="flex items-center space-x-2">
          <Palette className="h-4 w-4 text-muted-foreground" />
          <label className="text-sm font-medium text-foreground">
            Theme
          </label>
        </div>
      )}
      
      <div className="relative">
        <select
          value={themeName}
          onChange={handleThemeChange}
          className="appearance-none bg-background border border-border rounded-md px-3 py-2 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring min-w-[140px]"
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="dracula">Dracula</option>
          <option value="solarized">Solarized Dark</option>
          <option value="github">GitHub</option>
          <option value="monokai">Monokai</option>
          <option value="nord">Nord</option>
          <option value="ayu">Ayu Dark</option>
        </select>
        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>
      
      {/* Theme preview indicator */}
      <div className="flex items-center space-x-1">
        <div 
          className="w-4 h-4 rounded border border-border flex-shrink-0"
          style={{ 
            backgroundColor: `hsl(${currentTheme.colors.background})`,
            borderColor: `hsl(${currentTheme.colors.border})`
          }}
        />
        <div 
          className="w-4 h-4 rounded border border-border flex-shrink-0"
          style={{ 
            backgroundColor: `hsl(${currentTheme.colors.primary})`,
            borderColor: `hsl(${currentTheme.colors.border})`
          }}
        />
        <div 
          className="w-4 h-4 rounded border border-border flex-shrink-0"
          style={{ 
            backgroundColor: `hsl(${currentTheme.colors.accent})`,
            borderColor: `hsl(${currentTheme.colors.border})`
          }}
        />
      </div>
    </div>
  );
};

// Compact version for toolbar
export const ThemeSelectorCompact: React.FC<{ className?: string }> = ({ 
  className = '' 
}) => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-md hover:bg-muted transition-colors ${className}`}
      title="Toggle Theme (Cmd+Shift+T)"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
};

// Bottom theme selector with all themes
export const ThemeSelectorBottom: React.FC<{ className?: string }> = ({ 
  className = '' 
}) => {
  const { themeName, setTheme, currentTheme } = useTheme();

  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(event.target.value);
  };

  const getThemeDisplayName = (name: string) => {
    if (name === 'system') return 'System';
    return themes[name]?.label || name;
  };

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <div className="relative">
        <select
          value={themeName}
          onChange={handleThemeChange}
          className="appearance-none bg-background border-none text-xs text-muted-foreground focus:outline-none focus:text-foreground cursor-pointer pr-4"
          title="Theme"
          style={{
            backgroundImage: 'none',
            MozAppearance: 'none',
            WebkitAppearance: 'none',
          }}
          
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="dracula">Dracula</option>
          <option value="solarized">Solarized</option>
          <option value="github">GitHub</option>
          <option value="monokai">Monokai</option>
          <option value="nord">Nord</option>
          <option value="ayu">Ayu</option>
        </select>
      </div>
    </div>
  );
}; 