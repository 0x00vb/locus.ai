import { create } from 'zustand';
import { AppState, Note, Folder, AppSettings } from './types';

const defaultSettings: AppSettings = {
  theme: 'system',
  fontSize: 14,
  fontFamily: 'Inter, system-ui, sans-serif',
  editorWidth: 800,
  autoSave: true,
  autoSaveInterval: 5000,
  spellCheck: true,
};

interface AppStore extends AppState {
  // Actions
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  setActiveNote: (id: string | undefined) => void;
  
  addFolder: (folder: Omit<Folder, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;
  setSelectedFolder: (id: string | undefined) => void;
  toggleFolderExpanded: (id: string) => void;
  
  setSearchQuery: (query: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  addToRecentNotes: (noteId: string) => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial state
  notes: [],
  folders: [],
  activeNoteId: undefined,
  selectedFolderId: undefined,
  searchQuery: '',
  settings: defaultSettings,
  recentNotes: [],

  // Actions
  addNote: (noteData) => {
    const note: Note = {
      ...noteData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => ({
      notes: [...state.notes, note],
    }));
  },

  updateNote: (id, updates) => {
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id
          ? { ...note, ...updates, updatedAt: new Date() }
          : note
      ),
    }));
  },

  deleteNote: (id) => {
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== id),
      activeNoteId: state.activeNoteId === id ? undefined : state.activeNoteId,
      recentNotes: state.recentNotes.filter((noteId) => noteId !== id),
    }));
  },

  setActiveNote: (id) => {
    set({ activeNoteId: id });
    if (id) {
      get().addToRecentNotes(id);
    }
  },

  addFolder: (folderData) => {
    const folder: Folder = {
      ...folderData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      expanded: false,
    };
    set((state) => ({
      folders: [...state.folders, folder],
    }));
  },

  updateFolder: (id, updates) => {
    set((state) => ({
      folders: state.folders.map((folder) =>
        folder.id === id
          ? { ...folder, ...updates, updatedAt: new Date() }
          : folder
      ),
    }));
  },

  deleteFolder: (id) => {
    set((state) => ({
      folders: state.folders.filter((folder) => folder.id !== id),
      notes: state.notes.filter((note) => note.folderId !== id),
      selectedFolderId: state.selectedFolderId === id ? undefined : state.selectedFolderId,
    }));
  },

  setSelectedFolder: (id) => {
    set({ selectedFolderId: id });
  },

  toggleFolderExpanded: (id) => {
    set((state) => ({
      folders: state.folders.map((folder) =>
        folder.id === id
          ? { ...folder, expanded: !folder.expanded }
          : folder
      ),
    }));
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  updateSettings: (newSettings) => {
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    }));
  },

  addToRecentNotes: (noteId) => {
    set((state) => {
      const filtered = state.recentNotes.filter((id) => id !== noteId);
      return {
        recentNotes: [noteId, ...filtered].slice(0, 10), // Keep only 10 recent notes
      };
    });
  },
})); 