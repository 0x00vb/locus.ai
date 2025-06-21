/**
 * Types for the sidebar feature
 */

export interface SidebarState {
  isVisible: boolean;
  width: number;
  isResizing: boolean;
  isCollapsed: boolean;
  position: 'left' | 'right';
}

export interface SidebarResizeState {
  sidebarWidth: number;
  isResizing: boolean;
  isCollapsed: boolean;
}

export interface SidebarConfiguration {
  minWidth: number;
  maxWidth: number;
  defaultWidth: number;
  resizable: boolean;
  collapsible: boolean;
} 