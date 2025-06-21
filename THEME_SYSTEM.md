# Notty Theme System

## Overview

The Notty application now features a comprehensive, multi-theme system that provides users with 8 predefined themes and supports both light and dark variants. The theme system integrates seamlessly with the UI components and code editor to provide a consistent, beautiful experience across all platforms.

## Available Themes

### Light Themes
- **Light** - Clean, minimal light theme (default)
- **GitHub** - GitHub-inspired light theme with blue accents

### Dark Themes  
- **Dark** - Standard dark theme
- **Dracula** - Popular purple-accent dark theme
- **Solarized Dark** - The classic solarized dark color scheme
- **Monokai** - Sublime Text-inspired dark theme
- **Nord** - Arctic, north-bluish clean dark theme  
- **Ayu Dark** - Modern dark theme with warm accents

### System Theme
- **System** - Automatically follows the operating system preference

## Features

### 🎨 Comprehensive Theming
- **UI Components**: All interface elements (sidebar, editor, menus, buttons) respect the selected theme
- **Code Editor**: Syntax highlighting adapts to match each theme's color scheme
- **Consistent Variables**: Uses CSS custom properties for instant theme switching

### ⚡ Instant Theme Switching
- **No Reload Required**: Themes apply immediately when changed
- **CSS Variables**: All colors are defined as CSS custom properties that update in real-time
- **Theme Classes**: Each theme applies a CSS class for theme-specific overrides

### 🔧 Multiple Access Methods
- **Compact Toggle**: Quick light/dark toggle in the toolbar (☀️/🌙)
- **Full Selector**: Dropdown with all themes and preview colors
- **Keyboard Shortcut**: `Cmd+Shift+T` (or `Ctrl+Shift+T`) to toggle themes
- **Settings Panel**: Comprehensive settings interface (coming soon)

### 💾 Persistent Settings
- **Local Storage**: Theme preference saved to browser localStorage
- **Startup Restoration**: Last selected theme automatically loads on app startup
- **System Detection**: Respects OS dark/light mode preference when "System" is selected

## Technical Implementation

### Architecture

```
packages/ui/src/theme/
├── index.ts              # Theme definitions and utilities
├── ThemeProvider.tsx     # React context provider
└── ThemeSelector.tsx     # Theme selection components
```

### Theme Structure

Each theme defines colors for:
- **Base**: background, foreground, cards, popovers
- **Interactive**: primary, secondary, muted, accent colors
- **States**: destructive, borders, inputs, focus rings
- **Editor**: background, text, selection, line highlight, gutter
- **Syntax**: keywords, strings, comments, numbers, operators, functions, variables

### CSS Integration

Themes use HSL color values in CSS custom properties:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  /* ... */
  --syntax-keyword: 270 70% 40%;
  --syntax-string: 140 40% 40%;
  /* ... */
}
```

### React Integration

```typescript
import { ThemeProvider, useTheme } from '@notty/ui';

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <YourApp />
    </ThemeProvider>
  );
}

function Component() {
  const { setTheme, toggleTheme, isDark } = useTheme();
  // ...
}
```

## Usage

### Basic Theme Toggle
```tsx
import { ThemeSelectorCompact } from '@notty/ui';

<ThemeSelectorCompact />  // Simple ☀️/🌙 toggle
```

### Full Theme Selector
```tsx
import { ThemeSelector } from '@notty/ui';

<ThemeSelector showLabel={true} />  // Dropdown with all themes
```

### Programmatic Theme Changes
```tsx
import { useTheme } from '@notty/ui';

function MyComponent() {
  const { setTheme, toggleTheme, currentTheme } = useTheme();
  
  return (
    <div>
      <button onClick={() => setTheme('dracula')}>Dracula Theme</button>
      <button onClick={toggleTheme}>Toggle Light/Dark</button>
      <p>Current theme: {currentTheme.label}</p>
    </div>
  );
}
```

## Keyboard Shortcuts

- **`Cmd+Shift+T`** (macOS) or **`Ctrl+Shift+T`** (Windows/Linux): Toggle between light and dark themes
- Works globally throughout the application
- Respects current theme selection (e.g., if on Dracula, toggles to Light)

## Editor Integration

The theme system seamlessly integrates with the code editor:

- **Background/Foreground**: Matches the overall theme
- **Syntax Highlighting**: Each theme defines custom colors for:
  - Keywords (if, function, class, etc.)
  - Strings and literals
  - Comments
  - Numbers
  - Operators
  - Function names
  - Variables
- **Selection**: Editor text selection uses theme-appropriate colors
- **Line Highlighting**: Current line highlighting adapts to theme

## Extension

### Adding New Themes

1. Define the theme in `packages/ui/src/theme/index.ts`:

```typescript
myTheme: {
  name: 'myTheme',
  label: 'My Custom Theme',
  type: 'dark',
  colors: {
    background: '220 13% 18%',
    foreground: '220 14% 93%',
    // ... define all required colors
  },
}
```

2. Add to the TypeScript types in `packages/core/src/types.ts`
3. Add to the selector options in `ThemeSelector.tsx`

### Theme-Specific Overrides

Use theme class selectors for specific customizations:

```css
.theme-dracula .special-component {
  font-family: 'JetBrains Mono', monospace;
}

.theme-github .code-block {
  border-radius: 6px;
}
```

## Platform Support

- **Cross-Platform**: Works consistently on Windows, macOS, and Linux
- **System Integration**: Respects OS dark/light mode preferences
- **Performance**: Instant theme switching with no performance impact
- **Accessibility**: Maintains proper contrast ratios across all themes

## Future Enhancements

- **Custom Themes**: User-defined color schemes
- **Theme Import/Export**: Share themes between installations  
- **Theme Editor**: Visual theme customization interface
- **More Presets**: Additional popular themes (VS Code Dark+, Atom One Dark, etc.)
- **Time-Based Auto-Switching**: Automatic theme changes based on time of day 