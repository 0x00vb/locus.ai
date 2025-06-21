/**
 * Types for the workspace feature
 */

export interface WorkspaceInfo {
  name: string;
  path: string;
  displayName: string;
  lastAccessed: Date;
}

export interface WorkspaceSettings {
  defaultWorkspace: string;
  recentWorkspaces: string[];
  autoLoadLastWorkspace: boolean;
}

export interface WorkspaceState {
  currentWorkspace: string;
  workspaceSettings: WorkspaceSettings;
  isLoading: boolean;
  error: string | null;
} 