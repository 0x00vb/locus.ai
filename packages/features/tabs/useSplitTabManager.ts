import { useState, useCallback } from 'react';
import type { TabData } from '@shared/hooks/useTabManager';

export type SplitPane = 'left' | 'right';

export interface SplitTabManagerState {
  panes: {
    left: {
      tabs: TabData[];
      activeTabId: string | null;
    };
    right: {
      tabs: TabData[];
      activeTabId: string | null;
    };
  };
  isSplit: boolean;
  focusedPane: SplitPane;
}

export interface SplitTabManagerActions {
  openTab: (pane: SplitPane, path: string, name: string, content: string) => void;
  closeTab: (pane: SplitPane, id: string) => void;
  setActiveTab: (pane: SplitPane, id: string) => void;
  moveTabToPane: (tabId: string, from: SplitPane, to: SplitPane) => void;
  splitTab: (tabId: string, direction: SplitPane) => void;
  mergePanes: () => void;
  autoCollapse: () => void;
  markTabDirty: (id: string) => void;
  markTabClean: (id: string) => void;
}

export function useSplitTabManager() {
  const [state, setState] = useState<SplitTabManagerState>({
    panes: {
      left: { tabs: [], activeTabId: null },
      right: { tabs: [], activeTabId: null },
    },
    isSplit: false,
    focusedPane: 'left',
  });

  // Open a tab in a specific pane
  const openTab = useCallback((pane: SplitPane, path: string, name: string, content: string) => {
    const id = path.replace(/[^a-zA-Z0-9]/g, '_');
    setState(prev => {
      // Prevent duplicate tabs across panes
      const otherPane: SplitPane = pane === 'left' ? 'right' : 'left';
      if (prev.panes[otherPane].tabs.some(tab => tab.id === id)) {
        // If already open in other pane, just activate in target pane
        return {
          ...prev,
          focusedPane: pane,
          panes: {
            ...prev.panes,
            [pane]: {
              ...prev.panes[pane],
              activeTabId: id,
            },
          },
        };
      }
      const tabs = prev.panes[pane].tabs;
      if (tabs.some(tab => tab.id === id)) {
        // Already open, just activate
        return {
          ...prev,
          focusedPane: pane,
          panes: {
            ...prev.panes,
            [pane]: {
              ...prev.panes[pane],
              activeTabId: id,
            },
          },
        };
      }
      const newTab: TabData = { id, name, extension: path.split('.').pop() || '', path, content, isDirty: false };
      return {
        ...prev,
        focusedPane: pane,
        panes: {
          ...prev.panes,
          [pane]: {
            tabs: [...tabs, newTab],
            activeTabId: id,
          },
        },
      };
    });
  }, []);

  // Close a tab in a specific pane
  const closeTab = useCallback((pane: SplitPane, id: string) => {
    setState(prev => {
      const tabs = prev.panes[pane].tabs.filter(tab => tab.id !== id);
      let activeTabId = prev.panes[pane].activeTabId;
      if (activeTabId === id) {
        activeTabId = tabs.length > 0 ? tabs[0].id : null;
      }
      return {
        ...prev,
        panes: {
          ...prev.panes,
          [pane]: {
            tabs,
            activeTabId,
          },
        },
      };
    });
  }, []);

  // Set active tab in a pane
  const setActiveTab = useCallback((pane: SplitPane, id: string) => {
    setState(prev => ({
      ...prev,
      focusedPane: pane,
      panes: {
        ...prev.panes,
        [pane]: {
          ...prev.panes[pane],
          activeTabId: id,
        },
      },
    }));
  }, []);

  // Move a tab from one pane to another
  const moveTabToPane = useCallback((tabId: string, from: SplitPane, to: SplitPane) => {
    setState(prev => {
      // Prevent duplicate tabs across panes
      if (prev.panes[to].tabs.some(tab => tab.id === tabId)) {
        // If already open in target pane, just activate
        return {
          ...prev,
          focusedPane: to,
          panes: {
            ...prev.panes,
            [to]: {
              ...prev.panes[to],
              activeTabId: tabId,
            },
          },
        };
      }
      const fromTabs = prev.panes[from].tabs;
      const toTabs = prev.panes[to].tabs;
      const tab = fromTabs.find(t => t.id === tabId);
      if (!tab) return prev;
      return {
        ...prev,
        focusedPane: to,
        panes: {
          ...prev.panes,
          [from]: {
            tabs: fromTabs.filter(t => t.id !== tabId),
            activeTabId: fromTabs.length > 1 ? fromTabs.find(t => t.id !== tabId)?.id || null : null,
          },
          [to]: {
            tabs: [...toTabs, tab],
            activeTabId: tab.id,
          },
        },
        isSplit: true,
      };
    });
  }, []);

  // Split a tab into a new pane (direction: 'left' or 'right')
  const splitTab = useCallback((tabId: string, direction: SplitPane) => {
    setState(prev => {
      const from: SplitPane = direction === 'left' ? 'right' : 'left';
      const fromTabs = prev.panes[from].tabs;
      const tab = fromTabs.find(t => t.id === tabId);
      if (!tab) return prev;
      // Remove from current pane, add to the other
      return {
        ...prev,
        focusedPane: direction,
        panes: {
          ...prev.panes,
          [from]: {
            tabs: fromTabs.filter(t => t.id !== tabId),
            activeTabId: fromTabs.length > 1 ? fromTabs.find(t => t.id !== tabId)?.id || null : null,
          },
          [direction]: {
            tabs: [tab],
            activeTabId: tab.id,
          },
        },
        isSplit: true,
      };
    });
  }, []);

  // Merge panes into a single pane (left takes priority)
  const mergePanes = useCallback(() => {
    setState(prev => {
      const leftTabs = prev.panes.left.tabs;
      const rightTabs = prev.panes.right.tabs;
      return {
        panes: {
          left: {
            tabs: [...leftTabs, ...rightTabs],
            activeTabId: leftTabs.length > 0 ? prev.panes.left.activeTabId : prev.panes.right.activeTabId,
          },
          right: { tabs: [], activeTabId: null },
        },
        isSplit: false,
        focusedPane: 'left' as SplitPane,
      };
    });
  }, []);

  // Auto-collapse if a pane is empty
  const autoCollapse = useCallback(() => {
    setState(prev => {
      if (!prev.isSplit) return prev;
      const leftEmpty = prev.panes.left.tabs.length === 0;
      const rightEmpty = prev.panes.right.tabs.length === 0;
      if (leftEmpty && !rightEmpty) {
        // Collapse to right
        return {
          panes: {
            left: { tabs: prev.panes.right.tabs, activeTabId: prev.panes.right.activeTabId },
            right: { tabs: [], activeTabId: null },
          },
          isSplit: false,
          focusedPane: 'left' as SplitPane,
        };
      } else if (rightEmpty && !leftEmpty) {
        // Collapse to left
        return {
          panes: {
            left: prev.panes.left,
            right: { tabs: [], activeTabId: null },
          },
          isSplit: false,
          focusedPane: 'left' as SplitPane,
        };
      }
      return prev;
    });
  }, []);

  // Mark a tab as dirty in both panes if present
  const markTabDirty = useCallback((id: string) => {
    setState(prev => {
      let hasChanges = false;
      const updateTabs = (tabs: TabData[]) => {
        return tabs.map(tab => {
          if (tab.id === id && !tab.isDirty) {
            hasChanges = true;
            return { ...tab, isDirty: true };
          }
          return tab;
        });
      };
      
      // Only update state if there are actual changes
      if (!hasChanges) {
        // Check if any tab with this id exists and is not already dirty
        const leftTab = prev.panes.left.tabs.find(t => t.id === id);
        const rightTab = prev.panes.right.tabs.find(t => t.id === id);
        if (!leftTab && !rightTab) return prev; // Tab doesn't exist
        if (leftTab?.isDirty !== false && rightTab?.isDirty !== false) return prev; // Already dirty
      }
      
      return {
        ...prev,
        panes: {
          left: {
            ...prev.panes.left,
            tabs: updateTabs(prev.panes.left.tabs),
          },
          right: {
            ...prev.panes.right,
            tabs: updateTabs(prev.panes.right.tabs),
          },
        },
      };
    });
  }, []);

  // Mark a tab as clean in both panes if present
  const markTabClean = useCallback((id: string) => {
    setState(prev => {
      let hasChanges = false;
      const updateTabs = (tabs: TabData[]) => {
        return tabs.map(tab => {
          if (tab.id === id && tab.isDirty) {
            hasChanges = true;
            return { ...tab, isDirty: false };
          }
          return tab;
        });
      };
      
      // CRITICAL FIX: Only update state if there are actual changes
      const leftTabs = updateTabs(prev.panes.left.tabs);
      const rightTabs = updateTabs(prev.panes.right.tabs);
      
      // If no changes were made, return the same state object to prevent re-renders
      if (!hasChanges) {
        return prev;
      }
      
      return {
        ...prev,
        panes: {
          left: {
            ...prev.panes.left,
            tabs: leftTabs,
          },
          right: {
            ...prev.panes.right,
            tabs: rightTabs,
          },
        },
      };
    });
  }, []);

  return {
    state,
    actions: {
      openTab,
      closeTab,
      setActiveTab,
      moveTabToPane,
      splitTab,
      mergePanes,
      autoCollapse,
      markTabDirty,
      markTabClean,
    },
  };
} 