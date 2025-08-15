import * as vscode from 'vscode';
import * as path from 'path';
import { CursorAPIInterface, CommandResult } from './types';

export class CursorAPI implements CursorAPIInterface {
  constructor() {
    console.log('CursorAPI initialized');
  }

  async openFileAtLine(filepath: string, line?: number): Promise<void> {
    try {
      console.log(`Opening file: ${filepath}${line ? ` at line ${line}` : ''}`);
      
      // Resolve the file path relative to workspace
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        throw new Error('No workspace folder is open');
      }

      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      const absolutePath = path.isAbsolute(filepath) ? filepath : path.resolve(workspaceRoot, filepath);
      const fileUri = vscode.Uri.file(absolutePath);

      // Open the document
      const document = await vscode.workspace.openTextDocument(fileUri);
      const editor = await vscode.window.showTextDocument(document);

      // Navigate to specific line if provided
      if (line !== undefined && line > 0) {
        const position = new vscode.Position(line - 1, 0); // VS Code is 0-indexed
        const range = new vscode.Range(position, position);
        editor.selection = new vscode.Selection(position, position);
        editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
      }

      console.log(`Successfully opened file: ${filepath}${line ? ` at line ${line}` : ''}`);
    } catch (error) {
      console.error(`Error opening file ${filepath}:`, error);
      throw new Error(`Failed to open file ${filepath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async executeCommand(command: string): Promise<string> {
    try {
      console.log(`Executing command: ${command}`);
      
      // For VS Code extension, we'll execute VS Code commands
      // For shell commands, we'd need to use child_process (not implemented here for security)
      if (command.startsWith('vscode.')) {
        const result = await vscode.commands.executeCommand(command);
        const output = result ? JSON.stringify(result) : 'Command executed successfully';
        console.log(`Command executed successfully: ${command}`);
        return output;
      } else {
        // For non-VS Code commands, show a message instead of executing
        const message = `Command execution not supported in extension: ${command}`;
        this.showMessage(message);
        console.log(message);
        return message;
      }
    } catch (error) {
      console.error(`Error executing command ${command}:`, error);
      throw new Error(`Failed to execute command ${command}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getWorkspaceFiles(): Promise<string[]> {
    try {
      console.log('Getting workspace files');
      
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        throw new Error('No workspace folder is open');
      }

      const files: string[] = [];
      
      // Find all files in the workspace
      const fileUris = await vscode.workspace.findFiles(
        '**/*', // include pattern
        '{**/node_modules/**,**/.*/**,**/dist/**,**/build/**,**/out/**}' // exclude pattern
      );

      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      
      for (const uri of fileUris) {
        const relativePath = path.relative(workspaceRoot, uri.fsPath);
        files.push(relativePath.replace(/\\/g, '/')); // Normalize path separators
      }

      console.log(`Found ${files.length} files in workspace`);
      return files.sort();
    } catch (error) {
      console.error('Error getting workspace files:', error);
      throw new Error(`Failed to get workspace files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  showMessage(message: string): void {
    try {
      console.log(`Showing message: ${message}`);
      vscode.window.showInformationMessage(`MCP Bridge: ${message}`);
    } catch (error) {
      console.error('Error showing message:', error);
    }
  }

  getCurrentEditor(): vscode.TextEditor | undefined {
    try {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        console.log(`Current editor: ${editor.document.fileName}`);
      } else {
        console.log('No active editor');
      }
      return editor;
    } catch (error) {
      console.error('Error getting current editor:', error);
      return undefined;
    }
  }

  async saveCurrentFile(): Promise<void> {
    try {
      const editor = this.getCurrentEditor();
      if (editor) {
        await editor.document.save();
        console.log(`Saved file: ${editor.document.fileName}`);
      } else {
        throw new Error('No active editor to save');
      }
    } catch (error) {
      console.error('Error saving current file:', error);
      throw new Error(`Failed to save current file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getActiveFilePath(): Promise<string | undefined> {
    try {
      const editor = this.getCurrentEditor();
      if (editor) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
          const workspaceRoot = workspaceFolders[0].uri.fsPath;
          const relativePath = path.relative(workspaceRoot, editor.document.fileName);
          return relativePath.replace(/\\/g, '/');
        }
        return editor.document.fileName;
      }
      return undefined;
    } catch (error) {
      console.error('Error getting active file path:', error);
      return undefined;
    }
  }
} 