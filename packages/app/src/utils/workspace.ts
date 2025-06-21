/**
 * Workspace utility functions
 */

export const getWorkspaceDisplayName = (workspace: string): string => {
  if (workspace.includes('/home/')) {
    return workspace.replace(/\/home\/[^\/]+/, '~');
  }
  if (workspace.includes('/Users/')) {
    return workspace.replace(/\/Users\/[^\/]+/, '~');
  }
  if (workspace.includes('C:\\Users\\')) {
    return workspace.replace(/C:\\Users\\[^\\]+/, '~');
  }
  return workspace;
}; 