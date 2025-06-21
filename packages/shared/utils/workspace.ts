/**
 * Workspace utility functions
 *
 * This version returns only the current directory name from a full workspace path.
 * Examples:
 *  - '~/Downloads/notes'       → 'notes'
 *  - '/home/user/Documents'    → 'Documents'
 *  - 'C:\\Users\\John\\Dev'    → 'Dev'
 */

export const getWorkspaceDisplayName = (workspace: string): string => {
  // Normalize path separators for cross-platform compatibility
  const normalized = workspace.replace(/\\/g, '/');

  // Remove trailing slash if present
  const trimmed = normalized.replace(/\/+$/, '');

  // Split by path separator and return the last segment
  const segments = trimmed.split('/');
  return segments[segments.length - 1] || '';
};
