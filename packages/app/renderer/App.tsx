/// <reference path="./preload.d.ts" />

import { useRef, useMemo, useEffect, useState } from 'react';
import { useAppStore } from '@domains/workspace';
import { 
  TreeView, 
  type TreeNode,
  useMultiSelect
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
import { Plus, FolderPlus, FolderOpen, MessageSquare } from 'lucide-react';

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
import AgentChatPanel from './ui/AgentChatPanel';
import { ChatProvider } from './ui/context/ChatContext';

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
  
  // Chat panel state from global store
  const { chatPanelOpen, toggleChatPanel } = useAppStore();
  
  // Add multi-select state
  const [multiSelectState, multiSelectActions] = useMultiSelect((selectedPaths) => {
    console.log('Selected files:', selectedPaths);
    // You can add additional logic here when selection changes
  });

  // CRITICAL FIX: Independent selectedPath state for immediate sidebar highlighting
  const [selectedPath, setSelectedPath] = useState<string>("");

  const noteOperations = new NoteOperations({
    onFileTreeUpdate: workspaceActions.loadFileTree,
    onNoteSelect: (path: string, node: TreeNode) => {
      // Auto-open newly created files using handleFileSelect
      handleFileSelect(path, node);
    },
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

  // CRITICAL FIX: Sync selectedPath with editor's currentFile for consistency
  // This handles cases where files are opened via drag & drop, tab switching, etc.
  useEffect(() => {
    if (currentFile?.path) {
      setSelectedPath(currentFile.path);
    } else {
      setSelectedPath("");
    }
  }, [currentFile?.path]);

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

  // Expose tabbed editor API globally for workspace change checks
  useEffect(() => {
    window.tabbedEditorAPI = {
      hasUnsavedChanges: editorApi.hasUnsavedChanges
    };
    
    return () => {
      delete window.tabbedEditorAPI;
    };
  }, [editorApi.hasUnsavedChanges]);

  // Handle workspace change with unsaved files check
  const handleWorkspaceChange = async () => {
    // Check if there are unsaved files
    const hasUnsavedChanges = editorApi.hasUnsavedChanges();
    
    if (hasUnsavedChanges) {
      const confirmed = confirm(
        'You have unsaved changes that will be lost. Do you want to continue changing the workspace?'
      );
      if (!confirmed) {
        return;
      }
    }

    try {
      // Use the existing IPC call to select workspace
      // The app will close and reopen with the new workspace
      await window.api.selectWorkspace();
    } catch (error) {
      console.error('Failed to change workspace:', error);
    }
  };

  // Updated handleFileSelect to support multi-select
  const handleFileSelect = async (filePath: string, node: TreeNode, isMultiSelect?: boolean) => {
    if (isMultiSelect) {
      // Handle multi-select
      multiSelectActions.handleSelection(filePath, node, true);
      return;
    }
    
    // Clear multi-select when doing single select
    if (multiSelectState.selectedPaths.length > 0) {
      multiSelectActions.clearSelection();
    }
    
    // Handle single file selection and opening
    if (node.type !== 'file') return;
    const current = editorApi.getCurrentFile();
    if (current?.path === filePath) return;

    // CRITICAL FIX: Update selectedPath immediately for sidebar highlighting
    setSelectedPath(filePath);

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
    (node, type) => creationActions.showCreateInput(type, node),
    async nodes => {
      // Handle bulk delete for multiple selected files
      for (const node of nodes) {
        await noteOperations.deleteItem(node);
      }
      multiSelectActions.clearSelection();
    }
  );

  const [sidebarState, sidebarActions] = useSidebarResize();
  const { sidebarWidth, isResizing, isCollapsed } = sidebarState;

  const [dragDropState, dragDropActions] = useDragDrop({
    onMove: (src, target) => noteOperations.moveItem(src, target),
    onMoveMultiple: async (sourceNodes, targetNode) => {
      // Move multiple files to a folder
      try {
        for (const node of sourceNodes) {
          await noteOperations.moveItem(node, targetNode);
        }
        multiSelectActions.clearSelection();
        return { success: true };
      } catch (error) {
        console.error('Failed to move multiple items:', error);
        return { success: false };
      }
    },
    onMoveToRoot: async (sourceNodes) => {
      // Move files to root workspace (out of folders)
      try {
        for (const node of sourceNodes) {
          // Create a virtual root node for the move operation
          const rootNode: TreeNode = {
            id: 'root',
            name: 'root',
            type: 'folder',
            path: '', // Root path
            children: []
          };
          await noteOperations.moveItem(node, rootNode);
        }
        multiSelectActions.clearSelection();
        return { success: true };
      } catch (error) {
        console.error('Failed to move items to root:', error);
        return { success: false };
      }
    },
    onExpandFolder: () => {},
  });

  const [terminalState, terminalActions] = useTerminal();

  const sidebarRef = useRef<HTMLDivElement>(null);

  // Add keyboard shortcuts for terminal and multi-select
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
      // Cmd+Shift+A to toggle AI chat panel
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        toggleChatPanel();
      }
      // Escape to clear multi-selection
      if (e.key === 'Escape' && multiSelectState.selectedPaths.length > 0) {
        e.preventDefault();
        multiSelectActions.clearSelection();
      }
      // Ctrl+A to select all files (when sidebar is focused)
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && document.activeElement?.closest('.overflow-auto')) {
        e.preventDefault();
        const allFilePaths = treeNodes.filter(node => node.type === 'file').map(node => node.path);
        multiSelectActions.selectAll(allFilePaths);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [terminalActions, sidebarActions, toggleChatPanel, multiSelectState.selectedPaths, multiSelectActions, treeNodes]);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <TitleBar 
        title="-" 
        onChatToggle={toggleChatPanel}
        isChatOpen={chatPanelOpen}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="flex h-full">
          {/* Sidebar Container - only render if not collapsed */}
          {!isCollapsed && (
            <div
              ref={sidebarRef}
              className="bg-card border-r border-border flex flex-col h-full relative"
              style={{ width: `${sidebarWidth}px` }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={dragDropActions.handleDropToRoot}
            >
              {/* Sidebar Header */}
              <div className="p-1 border-b border-border">
                <div className="text-sm text-muted-foreground flex justify-between items-center">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="truncate" title={currentWorkspace}>
                      {getWorkspaceDisplayName(currentWorkspace)}
                    </span>
                    <button
                      onClick={handleWorkspaceChange}
                      className="p-1 rounded hover:bg-muted transition-colors flex-shrink-0"
                      title="Change Workspace"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                    </button>
                  </div>
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

                <div className="overflow-auto flex-1 relative">
                  <TreeView
                    nodes={treeNodes}
                    onSelect={handleFileSelect}
                    onContextMenu={(event, node, selectedNodes) => {
                      // Update context menu to use selected nodes if available
                      const contextSelectedNodes = selectedNodes && selectedNodes.length > 0 ? selectedNodes : [node];
                      contextMenuActions.show(event, node, contextSelectedNodes);
                    }}
                    selectedPath={selectedPath}
                    selectedPaths={multiSelectState.selectedPaths}
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

        {/* AI Chat Panel */}
        <AgentChatPanel 
          isOpen={chatPanelOpen}
          onToggle={toggleChatPanel}
        />
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
      <ChatProvider>
        <AppContent />
      </ChatProvider>
    </ThemeProvider>
  );
}

export default App;
