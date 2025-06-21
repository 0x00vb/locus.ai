/// <reference path="./preload.d.ts" />

import { useRef, useMemo } from 'react';
import { useAppStore } from '@notty/core';
import { 
  TreeView, 
  type TreeNode, 
  TitleBar,
  ThemeProvider,
  useTabbedEditor,
  StatusBar,
} from '@notty/ui';
import { Plus, FolderPlus } from 'lucide-react';

import { useWorkspace } from './features/workspace/operations';
import { useContextMenu } from './features/tree/context-menu';
import { useCreation } from './features/tree/creation';
import { useRename } from './features/tree/rename';
import { useSidebarResize, useDragDrop } from './features/sidebar';
import { NoteOperations } from './features/notes/operations';

import { getWorkspaceDisplayName } from './utils/workspace';

import { ContextMenu } from './components/ContextMenu';
import { CreateInput } from './components/CreateInput';
import { RenameInput } from './components/RenameInput';
import { ResizeHandle } from './components/ResizeHandle';

const getLanguageFromExtension = (filePath: string): string => {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript', py: 'python',
    json: 'json', html: 'html', css: 'css', scss: 'css', sass: 'css', yml: 'yaml',
    yaml: 'yaml', xml: 'xml', sql: 'sql', sh: 'bash', bash: 'bash', php: 'php',
    rb: 'ruby', go: 'go', rs: 'rust', java: 'java', c: 'c', cpp: 'cpp', h: 'c',
    hpp: 'cpp', md: 'markdown', txt: 'text', doc: 'text', rtf: 'text'
  };
  return map[ext] || 'text';
};

function AppContent() {
  const [workspaceState, workspaceActions] = useWorkspace();
  const { currentWorkspace, treeNodes } = workspaceState;

  const noteOperations = new NoteOperations({
    onFileTreeUpdate: workspaceActions.loadFileTree,
    onNoteSelect: () => {},
  });

  const { component: TabbedNoteEditor, api: editorApi } = useTabbedEditor(
    async (path: string, content: string) => {
      try {
        return await noteOperations.saveNote(path, content);
      } catch (err) {
        console.error('Failed to save note:', err);
        return false;
      }
    }
  );

  const currentFile = editorApi.getCurrentFile();

  const statusBarData = useMemo(() => {
    const content = currentFile?.content ?? '';
    return {
      contentStats: {
        lines: content.split('\n').length,
        characters: content.length,
      },
      language: currentFile ? getLanguageFromExtension(currentFile.path) : 'text',
    };
  }, [currentFile]);

  const handleFileSelect = async (filePath: string, node: TreeNode) => {
    if (node.type !== 'file') return;
    const current = editorApi.getCurrentFile();
    if (current?.path === filePath) return;

    try {
      const content = await noteOperations.readNote(filePath);
      if (content !== null) {
        editorApi.openFile(filePath, content);
      } else {
        console.error('Failed to read file content');
      }
    } catch (err) {
      console.error('Failed to read note:', err);
    }
  };

  const [creationState, creationActions] = useCreation(
    async (name, type, target) => {
      await noteOperations.createNote(name, type, target);
    }
  );

  const [renameState, renameActions] = useRename(
    async (node, newName) => {
      const result = await noteOperations.renameItem(node, newName);
      return result;
    }
  );

  const [contextMenuState, contextMenuActions, contextMenuRef] = useContextMenu(
    async node => await noteOperations.deleteItem(node),
    renameActions.showRenameInput,
    (node, type) => creationActions.showCreateInput(type, node)
  );

  const [sidebarState, sidebarActions] = useSidebarResize();
  const { sidebarWidth, isResizing } = sidebarState;

  const [dragDropState, dragDropActions] = useDragDrop({
    onMove: (src, target) => noteOperations.moveItem(src, target),
    onExpandFolder: () => {},
  });

  const sidebarRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <TitleBar title="Notty" />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="flex">
          <div
            ref={sidebarRef}
            className="bg-card border-r border-border flex flex-col"
            style={{ width: `${sidebarWidth}px` }}
          >
            {/* Sidebar Header */}
            <div className="p-1 border-b border-border">
              <div className="text-sm text-muted-foreground flex justify-between items-center">
                {getWorkspaceDisplayName(currentWorkspace)}
                <div className="flex space-x-1">
                  <button
                    onClick={() => creationActions.showCreateInput('file', null)}
                    className="p-1.5 rounded hover:bg-muted transition-colors"
                    title="New Note"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => creationActions.showCreateInput('folder', null)}
                    className="p-1.5 rounded hover:bg-muted transition-colors"
                    title="New Folder"
                  >
                    <FolderPlus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tree + Inputs */}
            <div className="py-2 flex-1 flex flex-col overflow-hidden">
              <CreateInput
                state={creationState}
                onInputChange={creationActions.setCreateInputValue}
                onKeyPress={creationActions.handleCreateKeyPress}
              />
              <RenameInput
                state={renameState}
                onInputChange={renameActions.setRenameInputValue}
                onKeyPress={renameActions.handleRenameKeyPress}
              />
              <div className="overflow-auto flex-1">
                <TreeView
                  nodes={treeNodes}
                  onSelect={handleFileSelect}
                  onContextMenu={contextMenuActions.show}
                  selectedPath=""
                  className=""
                  dragDropHandlers={{
                    onDragStart: dragDropActions.handleDragStart,
                    onDragEnd: dragDropActions.handleDragEnd,
                    onDragOver: dragDropActions.handleDragOver,
                    onDragLeave: dragDropActions.handleDragLeave,
                    onDrop: dragDropActions.handleDrop,
                  }}
                  dragDropState={dragDropState}
                />
              </div>
            </div>
          </div>

          {/* Sidebar Resize */}
          <ResizeHandle
            isResizing={isResizing}
            onMouseDown={sidebarActions.handleResizeStart}
          />
        </div>

        {/* Editor */}
        <main className="flex-1 flex flex-col">
          <TabbedNoteEditor className="flex-1" />
        </main>
      </div>

      <ContextMenu
        state={contextMenuState}
        contextMenuRef={contextMenuRef}
        onDelete={contextMenuActions.handleDelete}
        onRename={contextMenuActions.handleRename}
        onCreateInFolder={contextMenuActions.handleCreateInFolder}
      />

      <StatusBar 
        contentStats={statusBarData.contentStats}
        language={statusBarData.language}
      />
    </div>
  );
}

function App() {
  const { settings } = useAppStore();
  return (
    <ThemeProvider defaultTheme={settings.theme}>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
