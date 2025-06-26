import React, { useState, useEffect } from 'react';
import { X, Minus, Square, Copy, MessageSquare } from 'lucide-react';
import { useTheme } from '@shared/theme/ThemeProvider';

interface TitleBarProps {
  title?: string;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onChatToggle?: () => void;
  isChatOpen?: boolean;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  title = 'Notty',
  onClose,
  onMinimize,
  onMaximize,
  onChatToggle,
  isChatOpen = false,
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const { currentTheme } = useTheme();
  
  useEffect(() => {
    // Check initial maximize state
    if ((window as any).api?.isWindowMaximized) {
      (window as any).api.isWindowMaximized().then(setIsMaximized);
    }
  }, []);

  const handleMinimize = () => {
    if ((window as any).api?.minimizeWindow) {
      (window as any).api.minimizeWindow();
    }
    onMinimize?.();
  };

  const handleMaximize = () => {
    if ((window as any).api?.maximizeWindow) {
      (window as any).api.maximizeWindow().then((maximized: boolean) => {
        setIsMaximized(maximized);
      });
    }
    onMaximize?.();
  };

  const handleClose = () => {
    if ((window as any).api?.closeWindow) {
      (window as any).api.closeWindow();
    }
    onClose?.();
  };

  return (
    <div 
      className="bg-card border-b border-border flex items-center justify-between px-2 select-none"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      {/* Left side - App title */}
      <div className="flex items-center space-x-2 text-sm font-medium text-card-foreground">
        <span>{title}</span>
      </div>
      <div className='flex gap-2'>
        {/* Chat toggle button */}
        <div 
          className="flex items-center"
          style={{ WebkitAppRegion: 'no-drag' } as any}
        >
          <button
            onClick={onChatToggle}
            className={`p-2 flex items-center justify-center transition-colors group ${
              isChatOpen 
                ? 'bg-primary/20 text-primary' 
                : 'hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
            title="Toggle AI Chat (Cmd+Shift+A)"
          >
            <MessageSquare className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>

        {/* Right side - Window controls */}
        <div 
          className="flex items-center"
          style={{ WebkitAppRegion: 'no-drag' } as any}
        >
          <button
            onClick={handleMinimize}
            className="p-2 flex items-center justify-center transition-colors group hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Minimize"
          >
            <Minus className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
          </button>
          
          <button
            onClick={handleMaximize}
            className="p-2 flex items-center justify-center transition-colors duration-100 group hover:bg-muted text-muted-foreground hover:text-foreground"
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? (
              <Copy className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
            ) : (
              <Square className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
            )}
          </button>
          
          <button
            onClick={handleClose}
            className="p-2 hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center transition-colors group text-muted-foreground"
            title="Close"
          >
            <X className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </div>

    </div>
  );
}; 