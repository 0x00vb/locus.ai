import React from 'react';
import { X, Settings } from 'lucide-react';
import { ThemeSelector } from '../theme/ThemeSelector';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border border-border rounded-lg shadow-lg w-[600px] max-h-[80vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-muted transition-colors"
            title="Close Settings"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Appearance Section */}
          <section>
            <h3 className="text-base font-medium mb-4">Appearance</h3>
            <div className="space-y-4">
              <ThemeSelector />
              
              {/* Font Size */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Font Size</label>
                <select className="appearance-none bg-background border border-border rounded-md px-3 py-1 text-sm">
                  <option value="12">12px</option>
                  <option value="14" selected>14px</option>
                  <option value="16">16px</option>
                  <option value="18">18px</option>
                  <option value="20">20px</option>
                </select>
              </div>

              {/* Font Family */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Font Family</label>
                <select className="appearance-none bg-background border border-border rounded-md px-3 py-1 text-sm">
                  <option value="Inter" selected>Inter</option>
                  <option value="System">System Default</option>
                  <option value="JetBrains Mono">JetBrains Mono</option>
                  <option value="Fira Code">Fira Code</option>
                </select>
              </div>
            </div>
          </section>

          {/* Editor Section */}
          <section>
            <h3 className="text-base font-medium mb-4">Editor</h3>
            <div className="space-y-4">
              {/* Auto Save */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Auto Save</label>
                <input type="checkbox" className="rounded" defaultChecked />
              </div>

              {/* Auto Save Interval */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Auto Save Interval</label>
                <select className="appearance-none bg-background border border-border rounded-md px-3 py-1 text-sm">
                  <option value="1000">1 second</option>
                  <option value="3000">3 seconds</option>
                  <option value="5000" selected>5 seconds</option>
                  <option value="10000">10 seconds</option>
                </select>
              </div>

              {/* Spell Check */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Spell Check</label>
                <input type="checkbox" className="rounded" defaultChecked />
              </div>
            </div>
          </section>

          {/* Keyboard Shortcuts Section */}
          <section>
            <h3 className="text-base font-medium mb-4">Keyboard Shortcuts</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Toggle Theme</span>
                <kbd className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs">
                  Cmd + Shift + T
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Save File</span>
                <kbd className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs">
                  Cmd + S
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>New File</span>
                <kbd className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs">
                  Cmd + N
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>New Folder</span>
                <kbd className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs">
                  Cmd + Shift + N
                </kbd>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-muted hover:bg-muted/80 rounded-md transition-colors"
          >
            Close
          </button>
          <button className="px-4 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}; 