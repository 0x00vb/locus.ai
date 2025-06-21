import React, { useState, useEffect } from 'react';
import { X, Minus, Square, Copy } from 'lucide-react';

interface TitleBarProps {
  title?: string;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  title = 'Notty',
  onClose,
  onMinimize,
  onMaximize,
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  
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
      className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-2 select-none"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      {/* Left side - App title */}
      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        <span>{title}</span>
      </div>

      {/* Right side - Window controls */}
      <div 
        className="flex items-center"
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        <button
          onClick={handleMinimize}
          className="p-2 rounded-full bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center transition-colors group"
          title="Minimize"
        >
          <Minus className="w-4 h-4 text-yellow-900 opacity-60 group-hover:opacity-100 transition-opacity" />
        </button>
        
        <button
          onClick={handleMaximize}
          className="p-2 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors duration-100 group"
          title={isMaximized ? "Restore" : "Maximize"}
        >
          {isMaximized ? (
            <Copy className="w-4 h-4 text-green-900 opacity-60 group-hover:opacity-100 transition-opacity" />
          ) : (
            <Square className="w-4 h-4 text-green-900 opacity-60 group-hover:opacity-100 transition-opacity" />
          )}
        </button>
        
        <button
          onClick={handleClose}
          className="p-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors group"
          title="Close"
        >
          <X className="w-4 h-4 text-red-900 opacity-60 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>
    </div>
  );
}; 