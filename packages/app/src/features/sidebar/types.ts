/**
 * Types for the sidebar feature
 */

export interface SidebarState {
  isVisible: boolean;
  width: number;
  isResizing: boolean;
  position: 'left' | 'right';
}

export interface SidebarResizeState {
  sidebarWidth: number;
  isResizing: boolean;
}

export interface SidebarConfiguration {
  minWidth: number;
  maxWidth: number;
  defaultWidth: number;
  resizable: boolean;
  collapsible: boolean;
} 