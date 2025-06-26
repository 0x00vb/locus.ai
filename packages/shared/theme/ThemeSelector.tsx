import React from 'react';
import { useTheme } from './ThemeProvider';
import { themes } from './index';

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
          <option value="lotus">Lotus</option>
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