// Barrel exports for sidebar feature
export { useSidebarResize } from './resize'; 
export { useDragDrop, getDragDropStyles } from './drag-drop';
export type { 
  SidebarState, 
  SidebarResizeState, 
  SidebarConfiguration
} from './types';
export type { 
  SidebarResizeActions 
} from './resize';
export type {
  DragDropState,
  DragDropActions,
  DragDropCallbacks
} from './drag-drop'; 

export * from './TabBar';
export * from './TabItem';
export * from './drag-drop';
export * from './resize';
export * from './types'; 