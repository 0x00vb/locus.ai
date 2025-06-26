import { create } from 'zustand';

// Note and Folder interfaces
interface Note {
  id: string;
  title: string;
  content: string;
  folderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Folder {
  id: string;
  name: string;
  parentId?: string;
  expanded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AppSettings {
  theme: 'system' | 'light' | 'dark';
  fontSize: number;
  fontFamily: string;
  editorWidth: number;
  autoSave: boolean;
  autoSaveInterval: number;
  spellCheck: boolean;
}

const defaultSettings: AppSettings = {
  theme: 'system',
  fontSize: 14,
  fontFamily: 'Inter, system-ui, sans-serif',
  editorWidth: 800,
  autoSave: true,
  autoSaveInterval: 5000,
  spellCheck: true,
};

interface AppState {
  notes: Note[];
  folders: Folder[];
  activeNoteId?: string;
  selectedFolderId?: string;
  searchQuery: string;
  settings: AppSettings;
  recentNotes: string[];
  // Chat panel state
  chatPanelOpen: boolean;
}

export interface AppStore extends AppState {
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
  
  // Chat panel actions
  toggleChatPanel: () => void;
  setChatPanelOpen: (open: boolean) => void;
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
  chatPanelOpen: false,

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

  // Chat panel actions
  toggleChatPanel: () => {
    set((state) => ({
      chatPanelOpen: !state.chatPanelOpen,
    }));
  },

  setChatPanelOpen: (open) => {
    set({ chatPanelOpen: open });
  },
})); 