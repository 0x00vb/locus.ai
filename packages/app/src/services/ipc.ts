/**
 * Centralized IPC service for all Electron API calls
 */

/// <reference path="../preload.d.ts" />

import type { FileSystemItem } from '@notty/core';

export class IPCService {
  /**
   * Get the current workspace path
   */
  static async getCurrentWorkspace(): Promise<string | undefined> {
    return window.api?.getCurrentWorkspace();
  }

  /**
   * List all files and folders in the current workspace
   */
  static async listFilesAndFolders(): Promise<FileSystemItem[] | undefined> {
    return window.api?.listFilesAndFolders();
  }

  /**
   * Read note content from file
   */
  static async readNote(filePath: string): Promise<string | undefined> {
    return window.api?.readNote(filePath);
  }

  /**
   * Write note content to file
   */
  static async writeNote(filePath: string, content: string): Promise<boolean | undefined> {
    return window.api?.writeNote(filePath, content);
  }

  /**
   * Create a new note file
   */
  static async createNote(filePath: string, content: string): Promise<string | undefined> {
    return window.api?.createNote(filePath, content);
  }

  /**
   * Create a new folder
   */
  static async createFolder(folderPath: string): Promise<boolean | undefined> {
    return window.api?.createFolder(folderPath);
  }

  /**
   * Delete a note file
   */
  static async deleteNote(filePath: string): Promise<boolean | undefined> {
    return window.api?.deleteNote(filePath);
  }

  /**
   * Delete a folder
   */
  static async deleteFolder(folderPath: string): Promise<boolean | undefined> {
    return window.api?.deleteFolder(folderPath);
  }

  /**
   * Rename a note file
   */
  static async renameNote(oldPath: string, newPath: string): Promise<boolean | undefined> {
    return window.api?.renameNote(oldPath, newPath);
  }

  /**
   * Rename a folder
   */
  static async renameFolder(oldPath: string, newPath: string): Promise<boolean | undefined> {
    return window.api?.renameFolder(oldPath, newPath);
  }

  /**
   * Move an item (file or folder) to a new location
   */
  static async moveItem(sourcePath: string, targetPath: string): Promise<boolean | undefined> {
    return window.api?.moveItem(sourcePath, targetPath);
  }

  /**
   * Listen for workspace changes
   */
  static onWorkspaceChanged(callback: (workspace: string) => void): void {
    window.api?.onWorkspaceChanged?.(callback);
  }
} 