// Types - safe for all environments
export * from './types';

// Store - safe for browser/renderer
export * from './store';

// Utilities - safe for browser/renderer  
export * from './utils';

// Export specific filesystem types (safe for renderer process)
export type { NoteFile, FileSystemItem, NoteMetadata } from './filesystem';

// Filesystem Service - ONLY for Node.js environments (main process)
// Do not import this in renderer process - use IPC instead
// export * from './filesystem'; 