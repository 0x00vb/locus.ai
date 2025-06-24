import { useState, useCallback, useMemo, useRef } from 'react';

export interface TabData {
  id: string;
  name: string;
  extension: string;
  path: string;
  content: string;
  isDirty: boolean;
}

export interface TabManagerState {
  openTabs: TabData[];
  activeTabId: string | null;
}

export interface TabManagerActions {
  openTab: (path: string, name: string, content: string) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTabContent: (id: string, content: string) => void;
  markTabClean: (id: string) => void;
  isTabOpen: (path: string) => boolean;
  getActiveTab: () => TabData | null;
  getCurrentContent: (id: string) => string;
}

export const useTabManager = (): [TabManagerState, TabManagerActions] => {
  const [openTabs, setOpenTabs] = useState<TabData[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  
  // Store current content without triggering rerenders
  const liveContentRef = useRef<Map<string, string>>(new Map());
  const isDirtyRef = useRef<Map<string, boolean>>(new Map());
  
  const openTab = useCallback((path: string, _name: string, content: string) => {
    const id = path.replace(/[^a-zA-Z0-9]/g, '_');
    const extension = path.split('.').pop() || '';
    const fileName = path.split('/').pop() || path;

    // Initialize live content
    liveContentRef.current.set(id, content);
    isDirtyRef.current.set(id, false);

    setOpenTabs(prevTabs => {
      const existingIndex = prevTabs.findIndex(tab => tab.id === id);

      if (existingIndex !== -1) {
        setActiveTabId(id);
        return prevTabs;
      }

      const newTab: TabData = {
        id,
        name: fileName,
        extension,
        path,
        content,
        isDirty: false,
      };

      setActiveTabId(id);
      return [...prevTabs, newTab];
    });
  }, []);

  const closeTab = useCallback((id: string) => {
    // Clean up refs
    liveContentRef.current.delete(id);
    isDirtyRef.current.delete(id);
    
    // Prevent memory growth by limiting cache size
    const MAX_CACHED_TABS = 50;
    if (liveContentRef.current.size > MAX_CACHED_TABS) {
      const oldestEntries = Array.from(liveContentRef.current.keys()).slice(0, 10);
      oldestEntries.forEach(key => {
        liveContentRef.current.delete(key);
        isDirtyRef.current.delete(key);
      });
    }
    
    setOpenTabs(prevTabs => {
      const nextTabs = prevTabs.filter(tab => tab.id !== id);

      setActiveTabId(currentActiveId => {
        if (currentActiveId === id) {
          const closedIndex = prevTabs.findIndex(tab => tab.id === id);
          const fallbackTab = nextTabs[Math.min(closedIndex, nextTabs.length - 1)];
          return fallbackTab?.id ?? null;
        }
        return currentActiveId;
      });

      return nextTabs;
    });
  }, []);

  const updateTabContent = useCallback((id: string, content: string) => {
    liveContentRef.current.set(id, content);
    isDirtyRef.current.set(id, true);
    // NO setOpenTabs call = NO rerenders = NO focus loss
  }, []);

  const markTabClean = useCallback((id: string) => {
    isDirtyRef.current.set(id, false);
    
    // FIXED: Update the actual tab content when marking clean
    setOpenTabs(prevTabs => {
      const index = prevTabs.findIndex(tab => tab.id === id);
      if (index === -1) return prevTabs;

      const current = prevTabs[index];
      const liveContent = liveContentRef.current.has(id) ? liveContentRef.current.get(id)! : current.content;

      // Update both isDirty and content to match the live content
      const updated = [...prevTabs];
      updated[index] = { 
        ...current, 
        isDirty: false,
        content: liveContent // CRITICAL: Sync content with live content
      };
      return updated;
    });
  }, []);

  const isTabOpen = useCallback((path: string): boolean => {
    const id = path.replace(/[^a-zA-Z0-9]/g, '_');
    return openTabs.some(tab => tab.id === id);
  }, [openTabs]);

  const getActiveTab = useCallback((): TabData | null => {
    if (!activeTabId) return null;
    const tab = openTabs.find(tab => tab.id === activeTabId);
    if (!tab) return null;
    
    // Always return tab with live content from refs
    return {
      ...tab,
      content: liveContentRef.current.has(activeTabId) ? liveContentRef.current.get(activeTabId)! : tab.content,
      isDirty: isDirtyRef.current.get(activeTabId) || false
    };
  }, [openTabs, activeTabId]);

  const getCurrentContent = useCallback((id: string): string => {
    return liveContentRef.current.has(id) ? liveContentRef.current.get(id)! : '';
  }, []);

  // FIXED: Use a more stable state calculation
  const state = useMemo<TabManagerState>(() => ({
    openTabs: openTabs.map(tab => ({
      ...tab,
      // Only show live content for the active tab to prevent unnecessary updates
      content: tab.id === activeTabId ? 
        (liveContentRef.current.has(tab.id) ? liveContentRef.current.get(tab.id)! : tab.content) : 
        tab.content,
      isDirty: isDirtyRef.current.get(tab.id) || false
    })),
    activeTabId,
  }), [openTabs, activeTabId]);

  const actions = useMemo<TabManagerActions>(() => ({
    openTab,
    closeTab,
    setActiveTab: setActiveTabId,
    updateTabContent,
    markTabClean,
    isTabOpen,
    getActiveTab,
    getCurrentContent,
  }), [
    openTab,
    closeTab,
    updateTabContent,
    markTabClean,
    isTabOpen,
    getActiveTab,
    getCurrentContent,
  ]);

  return [state, actions];
};