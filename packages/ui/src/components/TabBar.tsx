import React, { useRef, useEffect } from 'react';
import { TabItem } from './TabItem';
import type { TabData } from '../hooks/useTabManager';

export interface TabBarProps {
  tabs: TabData[];
  activeTabId: string | null;
  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
  className?: string;
}

export const TabBar: React.FC<TabBarProps> = React.memo(({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  className = '',
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active tab when it changes
  useEffect(() => {
    if (activeTabId && scrollContainerRef.current) {
      const activeTabElement = scrollContainerRef.current.querySelector(
        `[data-tab-id="${activeTabId}"]`
      ) as HTMLElement;
      if (activeTabElement) {
        activeTabElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest',
        });
      }
    }
  }, [activeTabId]);

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className={`border-b border-border bg-card ${className}`}>
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
        style={{ scrollbarWidth: 'thin' }}
      >
        {tabs.map((tab) => (
          <div key={tab.id} data-tab-id={tab.id}>
            <TabItem
              tab={tab}
              isActive={tab.id === activeTabId}
              onSelect={onTabSelect}
              onClose={onTabClose}
            />
          </div>
        ))}
      </div>
    </div>
  );
},
// CRITICAL FIX: Ultra-efficient comparison that prevents content-based rerenders
(prevProps, nextProps) => {
  // Fast path: Check if handlers or className changed
  if (prevProps.onTabSelect !== nextProps.onTabSelect ||
      prevProps.onTabClose !== nextProps.onTabClose ||
      prevProps.className !== nextProps.className) {
    return false; // Re-render needed
  }

  // Check if tab count changed
  if (prevProps.tabs.length !== nextProps.tabs.length) {
    return false; // Re-render needed
  }

  // Check if active tab changed
  if (prevProps.activeTabId !== nextProps.activeTabId) {
    return false; // Re-render needed
  }

  // CRITICAL: Only check visual properties that affect TabBar display
  // Ignore content changes completely
  for (let i = 0; i < prevProps.tabs.length; i++) {
    const prevTab = prevProps.tabs[i];
    const nextTab = nextProps.tabs[i];
    
    if (prevTab.id !== nextTab.id ||
        prevTab.name !== nextTab.name ||
        prevTab.path !== nextTab.path ||
        prevTab.extension !== nextTab.extension ||
        prevTab.isDirty !== nextTab.isDirty) {
      return false; // Re-render needed
    }
    // CRITICAL: Explicitly ignore content changes
    // Content changes don't affect TabBar visual appearance
  }

  // All visual aspects are the same, prevent re-render
  return true;
});

TabBar.displayName = 'TabBar';