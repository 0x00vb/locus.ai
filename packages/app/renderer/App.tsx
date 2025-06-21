/// <reference path="./preload.d.ts" />

import { useRef, useMemo, useEffect } from 'react';
import { useAppStore } from '@domains/workspace';
import { 
  TreeView, 
  type TreeNode
} from '@features/treeView';
import {
  TitleBar
} from '@shared/components';
import {
  ThemeProvider
} from '@shared/theme';
import { 
  useTabbedEditor
} from '@features/tabs';
import {
  StatusBar
} from '@features/statusBar';
import { Plus, FolderPlus } from 'lucide-react';

import { useWorkspace } from '@domains/workspace/operations';
import { useContextMenu } from '@features/treeView/context-menu';
import { useCreation } from '@features/treeView/creation';
import { useRename } from '@features/treeView/rename';
import { useSidebarResize, useDragDrop } from '@features/tabBar';
import { NoteOperations } from '@domains/editor/operations';

import { getWorkspaceDisplayName } from '@shared/utils/workspace';

import { ContextMenu } from '@shared/components/ContextMenu';
import { CreateInput } from '@shared/components/CreateInput';
import { RenameInput } from '@shared/components/RenameInput';
import { ResizeHandle } from '@shared/components/ResizeHandle';
import { SlideUpPanel } from '@shared/components/SlideUpPanel';
import { TerminalView } from '@features/terminal/terminal-view';
import { useTerminal } from '@features/terminal/terminal-hooks';

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
  const { sidebarWidth, isResizing, isCollapsed } = sidebarState;

  const [dragDropState, dragDropActions] = useDragDrop({
    onMove: (src, target) => noteOperations.moveItem(src, target),
    onExpandFolder: () => {},
  });

  const [terminalState, terminalActions] = useTerminal();

  const sidebarRef = useRef<HTMLDivElement>(null);

  // Add keyboard shortcuts for terminal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+` (backtick) or Ctrl+Shift+` to toggle terminal
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        terminalActions.toggle();
      }
      // Ctrl+B to toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        sidebarActions.toggleSidebar();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [terminalActions, sidebarActions]);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <TitleBar title="-" />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="flex h-full">
          {/* Sidebar Container - only render if not collapsed */}
          {!isCollapsed && (
            <div
              ref={sidebarRef}
              className="bg-card border-r border-border flex flex-col h-full"
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
          )}

          {/* Sidebar Resize Handle - positioned at border when collapsed */}
          <ResizeHandle
            isResizing={isResizing}
            onMouseDown={sidebarActions.handleResizeStart}
            className={isCollapsed ? "absolute left-0 z-20" : ""}
            isCollapsed={isCollapsed}
          />
        </div>

        {/* Main Content Area (Editor + Terminal + Status Bar) */}
        <main className="flex-1 flex flex-col h-full">
          {/* Editor Area */}
          <div 
            className="flex-1 overflow-hidden"
            style={{ 
              height: terminalState.isOpen 
                ? `calc(100% - ${terminalState.height}px - 2rem)` // Account for terminal + status bar
                : 'calc(100% - 2rem)' // Just status bar
            }}
          >
            <TabbedNoteEditor className="h-full" />
          </div>

          {/* Terminal Panel */}
          {terminalState.isOpen && (
            <SlideUpPanel
              isOpen={terminalState.isOpen}
              onToggle={terminalActions.toggle}
              height={terminalState.height}
              title="Terminal"
              minHeight={0}
              maxHeight={600}
              defaultHeight={300}
            >
              <TerminalView workspaceDirectory={currentWorkspace} />
            </SlideUpPanel>
          )}

          {/* Status Bar */}
          <StatusBar 
            contentStats={statusBarData.contentStats}
            language={statusBarData.language}
            terminalState={terminalState}
            terminalActions={terminalActions}
          />
        </main>
      </div>

      <ContextMenu
        state={contextMenuState}
        contextMenuRef={contextMenuRef}
        onDelete={contextMenuActions.handleDelete}
        onRename={contextMenuActions.handleRename}
        onCreateInFolder={contextMenuActions.handleCreateInFolder}
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
