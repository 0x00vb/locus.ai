import React, { useCallback, useMemo } from 'react';
import { TabBar } from './TabBar';
import { Editor } from './Editor';
import { useTabManager } from '../hooks/useTabManager';

export interface TabbedNoteEditorProps {
  className?: string;
}

export interface TabbedNoteEditorAPI {
  openFile: (path: string, content: string) => void;
  saveActiveFile: () => Promise<void>;
  getCurrentFile: () => { path: string; content: string } | null;
  hasUnsavedChanges: () => boolean;
}

export interface UseTabbedEditorReturn {
  component: React.FC<TabbedNoteEditorProps>;
  api: TabbedNoteEditorAPI;
}

// SIMPLIFIED: Much cleaner implementation
export const useTabbedEditor = (
  onSave?: (path: string, content: string) => Promise<boolean>
): UseTabbedEditorReturn => {
  const [tabState, tabActions] = useTabManager();
  const { openTabs, activeTabId } = tabState;

  const activeTab = useMemo(() => {
    return tabActions.getActiveTab();
  }, [tabActions.getActiveTab]);

  const handleContentChange = useCallback((newContent: string) => {
    if (!activeTabId) return;
    tabActions.updateTabContent(activeTabId, newContent);
  }, [activeTabId, tabActions.updateTabContent]);

  const handleSave = useCallback(async () => {
    if (!activeTab || !onSave) return;
    
    // Get live content for accurate save
    const liveContent = tabActions.getCurrentContent(activeTab.id);
    
    try {
      const success = await onSave(activeTab.path, liveContent);
      if (success) {
        tabActions.markTabClean(activeTab.id);
      }
    } catch (err) {
      console.error('Failed to save file:', err);
    }
  }, [activeTab, onSave, tabActions.markTabClean, tabActions.getCurrentContent]);

  const api: TabbedNoteEditorAPI = useMemo(() => ({
    openFile: (path, content) => {
      const name = path.split('/').pop() || path;
      tabActions.openTab(path, name, content);
    },
    saveActiveFile: handleSave,
    getCurrentFile: () => {
      if (!activeTab) return null;
      return { path: activeTab.path, content: activeTab.content };
    },
    hasUnsavedChanges: () => {
      return openTabs.some(tab => tab.isDirty);
    },
  }), [tabActions.openTab, handleSave, activeTab, openTabs]);

  const TabbedNoteEditor: React.FC<TabbedNoteEditorProps> = React.memo(({ className = '' }) => {
    if (openTabs.length === 0) {
      return (
        <div className={`flex-1 flex items-center justify-center ${className}`}>
          <div className="text-center space-y-4 max-w-md">
            <h3 className="text-lg font-medium">Welcome to Notty</h3>
            <p className="text-muted-foreground">
              Select a note from the sidebar to edit, or create a new file to get started.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className={`flex flex-col h-screen ${className}`}>
        <TabBar
          tabs={openTabs}
          activeTabId={activeTabId}
          onTabSelect={tabActions.setActiveTab}
          onTabClose={tabActions.closeTab}
        />
        {activeTab && (
          <div className="flex-1">
            <Editor
              key={activeTab.path} // Simple key based on path
              initialContent={activeTab.content}
              filePath={activeTab.path}
              onChange={handleContentChange}
              onSave={handleSave}
            />
          </div>
        )}
      </div>
    );
  });

  TabbedNoteEditor.displayName = 'TabbedNoteEditor';

  return { component: TabbedNoteEditor, api };
};