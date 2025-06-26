import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { TabBar } from '@features/tabBar/TabBar';
import { CodeEditor } from '@domains/editor/Editor';
import { useSplitTabManager, SplitPane } from './useSplitTabManager';

export interface TabbedNoteEditorProps {
  className?: string;
}

export interface TabbedNoteEditorAPI {
  openFile: (path: string, content: string, pane?: SplitPane) => void;
  saveActiveFile: () => Promise<void>;
  getCurrentFile: () => { path: string; content: string } | null;
  hasUnsavedChanges: () => boolean;
}

export interface UseTabbedEditorReturn {
  component: React.FC<TabbedNoteEditorProps>;
  api: TabbedNoteEditorAPI;
}

export const useTabbedEditor = (
  onSave?: (path: string, content: string) => Promise<boolean>
): UseTabbedEditorReturn => {
  const { state: splitState, actions: splitActions } = useSplitTabManager();
  const { panes, isSplit } = splitState;

  // CRITICAL FIX: Use refs to prevent callbacks from changing when state updates
  const splitStateRef = useRef(splitState);
  
  // Update ref when state changes
  useEffect(() => {
    splitStateRef.current = splitState;
  }, [splitState]);

  // Shared document state for real-time sync (simple map by tab id)
  const docContentRef = useRef<Map<string, string>>(new Map());
  
  // Debounce dirty state to prevent excessive re-renders
  const dirtyTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Stable handlers that don't recreate on panes changes
  const handleSaveStable = useRef<(pane: SplitPane) => Promise<void>>();
  const handleContentChangeStable = useRef<(tabId: string, newContent: string) => void>();

  // Handle content change for a tab (syncs if open in both panes)
  handleContentChangeStable.current = useCallback((tabId: string, newContent: string) => {
    docContentRef.current.set(tabId, newContent);
    
    // Clear any existing timeout first
    const existingTimeout = dirtyTimeoutsRef.current.get(tabId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    // Instead of setting state immediately, we'll just track it internally
    // and only update the UI when user stops typing for a while
    const timeout = setTimeout(() => {
      splitActions.markTabDirty(tabId);
      dirtyTimeoutsRef.current.delete(tabId);
    }, 1000); // Increased debounce to 1 second to reduce re-renders
    
    dirtyTimeoutsRef.current.set(tabId, timeout);
  }, [splitActions]);

  // CRITICAL FIX: Handle save using refs to prevent dependency on state changes
  handleSaveStable.current = useCallback(async (pane: SplitPane) => {
    const currentPanes = splitStateRef.current.panes; // Use ref to get current state
    const activeTabId = currentPanes[pane].activeTabId;
    const tab = currentPanes[pane].tabs.find(t => t.id === activeTabId);
    if (!tab || !onSave) return;
    
    // Clear any pending dirty timeout for this tab
    const existingTimeout = dirtyTimeoutsRef.current.get(tab.id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      dirtyTimeoutsRef.current.delete(tab.id);
    }
    
    const liveContent = docContentRef.current.get(tab.id) ?? tab.content;
    try {
      const success = await onSave(tab.path, liveContent);
      if (success) {
        splitActions.markTabClean(tab.id);
      }
    } catch (err) {
      console.error('Failed to save file:', err);
    }
  }, [onSave, splitActions]); // CRITICAL: Removed splitState.panes dependency

  // Stable API object to prevent unnecessary re-renders
  const apiRef = useRef<TabbedNoteEditorAPI>();
  if (!apiRef.current) {
    apiRef.current = {
      openFile: (path, content, pane = 'left') => {
        const name = path.split('/').pop() || path;
        splitActions.openTab(pane, path, name, content);
        docContentRef.current.set(path.replace(/[^a-zA-Z0-9]/g, '_'), content);
      },
      saveActiveFile: async () => {
        if (handleSaveStable.current) {
          await handleSaveStable.current('left');
          if (splitStateRef.current.isSplit) await handleSaveStable.current('right');
        }
      },
      getCurrentFile: () => {
        const currentPanes = splitStateRef.current.panes; // Use ref instead of state
        const focusedPane = splitStateRef.current.focusedPane;
        
        // Return the active tab from the focused pane
        let activeTab = null;
        
        if (currentPanes[focusedPane].activeTabId) {
          activeTab = currentPanes[focusedPane].tabs.find(t => t.id === currentPanes[focusedPane].activeTabId);
        }
        
        // Fallback: if focused pane has no active tab, check the other pane
        if (!activeTab) {
          const otherPane = focusedPane === 'left' ? 'right' : 'left';
          if (currentPanes[otherPane].activeTabId) {
            activeTab = currentPanes[otherPane].tabs.find(t => t.id === currentPanes[otherPane].activeTabId);
          }
        }
        
        if (!activeTab) return null;
        
        const liveContent = docContentRef.current.get(activeTab.id) ?? activeTab.content;
        return { path: activeTab.path, content: liveContent };
      },
      hasUnsavedChanges: () => {
        // Check all tabs in both panes for isDirty
        const panes = splitStateRef.current.panes;
        const anyDirty = [
          ...panes.left.tabs,
          ...panes.right.tabs
        ].some(tab => tab.isDirty);
        return anyDirty;
      },
    };
  }

  // Drop zone highlight state
  const [dropZone, setDropZone] = React.useState<SplitPane | null>(null);

  // Stable drag handlers
  const handleTabDragOver = useCallback((pane: SplitPane) => (e: React.DragEvent) => {
    e.preventDefault();
    setDropZone(pane);
  }, []);
  
  const handleTabDragLeave = useCallback(() => setDropZone(null), []);
  
  const handleTabDrop = useCallback((pane: SplitPane) => (e: React.DragEvent) => {
    e.preventDefault();
    setDropZone(null);
    const currentPanes = splitStateRef.current.panes; // CRITICAL FIX: Use ref instead of state
    
    // 1. Tab drag (from tab bar)
    const tabId = e.dataTransfer.getData('tab/id');
    const fromPane = e.dataTransfer.getData('tab/fromPane') as SplitPane;
    if (tabId && fromPane && fromPane !== pane) {
      // Prevent duplicate tabs
      if (!currentPanes[pane].tabs.some(t => t.id === tabId)) {
        splitActions.moveTabToPane(tabId, fromPane, pane);
      } else {
        // If already open in target pane, just activate
        splitActions.setActiveTab(pane, tabId);
      }
      return;
    }
    // 2. Sidebar drag (from TreeView)
    const fileData = e.dataTransfer.getData('application/json');
    if (fileData) {
      try {
        const parsed = JSON.parse(fileData);
        // Must have path and name
        if (parsed && parsed.path && parsed.name) {
          // Prevent duplicate tabs in this pane
          const id = parsed.path.replace(/[^a-zA-Z0-9]/g, '_');
          if (!currentPanes[pane].tabs.some(t => t.id === id)) {
            splitActions.openTab(pane, parsed.path, parsed.name, parsed.content || '');
            docContentRef.current.set(id, parsed.content || '');
            splitActions.setActiveTab(pane, id);
          } else {
            splitActions.setActiveTab(pane, id);
          }
        }
      } catch {}
    }
  }, [splitActions]); // CRITICAL FIX: Removed splitState.panes dependency

  // Auto-collapse logic (robust: if both panes empty, reset to left)
  React.useEffect(() => {
    splitActions.autoCollapse();
    // If both panes are empty, reset to left pane
    if (panes.left.tabs.length === 0 && panes.right.tabs.length === 0 && isSplit) {
      splitActions.mergePanes();
    }
  }, [panes.left.tabs.length, panes.right.tabs.length, splitActions, isSplit]);

  // Cleanup timeouts on unmount
  React.useEffect(() => {
    return () => {
      dirtyTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      dirtyTimeoutsRef.current.clear();
    };
  }, []);

  // Extremely stable EditorPane component to prevent any re-renders
  const EditorPane: React.FC<{ pane: SplitPane }> = React.memo(({ pane }) => {
    const { tabs, activeTabId } = panes[pane];
    const activeTab = tabs.find(t => t.id === activeTabId);
    
    return (
      <div className="flex flex-col h-full w-full">
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onTabSelect={id => splitActions.setActiveTab(pane, id)}
          onTabClose={id => {
            const tab = tabs.find(t => t.id === id);
            if (tab?.isDirty) {
              if (!window.confirm('You have unsaved changes in this tab. Close anyway and lose changes?')) {
                return;
              }
            }
            splitActions.closeTab(pane, id);
          }}
          pane={pane}
        />
        {activeTab && (
          <div className="flex-1">
            <CodeEditor
              key={activeTab.id} // Use stable tab id only
              initialContent={docContentRef.current.get(activeTab.id) ?? activeTab.content}
              filePath={activeTab.path}
              onChange={(content: string) => {
                if (handleContentChangeStable.current) {
                  handleContentChangeStable.current(activeTab.id, content);
                }
              }}
              onSave={() => {
                if (handleSaveStable.current) {
                  handleSaveStable.current(pane);
                }
              }}
            />
          </div>
        )}
      </div>
    );
  });
  
  EditorPane.displayName = 'EditorPane';

  // Main split view layout
  const TabbedNoteEditor: React.FC<TabbedNoteEditorProps> = React.memo(({ className = '' }) => {
    if (!panes.left.tabs.length && !panes.right.tabs.length) {
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
    if (!isSplit) {
      // Single pane view
      return (
        <div className={`flex flex-col h-screen ${className} relative`}>
          {/* Drop zone for splitting to right */}
          <div
            className={`absolute top-0 right-0 h-full w-6 z-20 ${dropZone === 'right' ? 'bg-blue-200/40' : ''}`}
            onDragOver={handleTabDragOver('right')}
            onDragLeave={handleTabDragLeave}
            onDrop={handleTabDrop('right')}
            style={{ pointerEvents: 'auto' }}
          />
          <EditorPane pane="left" />
        </div>
      );
    }
    // Split view
    return (
      <div className={`flex flex-row h-screen ${className} relative`}>
        {/* Drop zone for splitting to left */}
        <div
          className={`absolute top-0 left-0 h-full w-6 z-20 ${dropZone === 'left' ? 'bg-blue-200/40' : ''}`}
          onDragOver={handleTabDragOver('left')}
          onDragLeave={handleTabDragLeave}
          onDrop={handleTabDrop('left')}
          style={{ pointerEvents: 'auto' }}
        />
        <div className="flex-1 min-w-0 border-r border-border">
          <EditorPane pane="left" />
        </div>
        <div className="flex-1 min-w-0">
          <EditorPane pane="right" />
        </div>
      </div>
    );
  });

  TabbedNoteEditor.displayName = 'TabbedNoteEditor';

  return { component: TabbedNoteEditor, api: apiRef.current };
};