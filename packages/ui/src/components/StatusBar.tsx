import React from 'react';
import { ThemeSelectorBottom } from '../theme/ThemeSelector';

interface StatusBarProps {
  contentStats: { lines: number; characters: number };
  language: string;
}

export const StatusBar: React.FC<StatusBarProps> = React.memo(({ contentStats, language }) => {
  return (
    <div className="h-8 px-2 border-t border-border bg-card text-sm text-muted-foreground flex items-center justify-between z-10">
      <div className="flex items-center gap-4">

      </div>
      <div className="flex items-center gap-2">
        <div className="bg-card">
          <ThemeSelectorBottom className="py-2" />
        </div>
      </div>
    </div>
  );
});
StatusBar.displayName = 'StatusBar';

export default StatusBar; 