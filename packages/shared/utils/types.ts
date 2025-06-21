// Base types for the notes application
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  folderId?: string;
  tags?: string[];
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
  expanded?: boolean;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system' | 'dracula' | 'solarized' | 'github' | 'monokai' | 'nord' | 'ayu';
  fontSize: number;
  fontFamily: string;
  editorWidth: number;
  autoSave: boolean;
  autoSaveInterval: number;
  spellCheck: boolean;
}

export interface AppState {
  notes: Note[];
  folders: Folder[];
  activeNoteId?: string;
  selectedFolderId?: string;
  searchQuery: string;
  settings: AppSettings;
  recentNotes: string[];
} 