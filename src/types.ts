import * as vscode from 'vscode';

// Server-side types
export interface FileOperationResult {
  success: boolean;
  message?: string;
  data?: string;
}

export interface EditFileParams {
  filepath: string;
  content: string;
}

export interface ReadFileParams {
  filepath: string;
}

export interface OpenFileParams {
  filepath: string;
  line?: number;
}

export interface RunCommandParams {
  command: string;
}

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface CursorControllerInterface {
  editFile(filepath: string, content: string): Promise<void>;
  readFile(filepath: string): Promise<string>;
  openFile(filepath: string, line?: number): Promise<void>;
  listFiles(): Promise<string[]>;
  runCommand(command: string): Promise<string>;
}

export interface MCPError {
  code: number;
  message: string;
}

// Extension-side types
export interface WebSocketMessage {
  type: string;
  id?: string;
  payload?: any;
  error?: string;
}

export interface MCPRequest {
  method: string;
  params: any;
  id: string;
}

export interface MCPResponse {
  result?: any;
  error?: {
    code: number;
    message: string;
  };
  id: string;
}

export interface OpenFileRequest {
  filepath: string;
  line?: number;
}

export interface ExecuteCommandRequest {
  command: string;
}

export interface FileListResponse {
  files: string[];
}

export interface ExtensionCommand {
  name: string;
  handler: (...args: any[]) => any;
}

export interface ConnectionStatus {
  connected: boolean;
  port: number;
  lastConnected?: Date;
  reconnectAttempts: number;
}

export interface MCPClientInterface {
  connect(port: number): Promise<void>;
  sendMessage(message: any): void;
  onMessage(handler: (message: any) => void): void;
  disconnect(): void;
  isConnected(): boolean;
  getConnectionStatus(): ConnectionStatus;
}

export interface CursorAPIInterface {
  openFileAtLine(filepath: string, line?: number): Promise<void>;
  executeCommand(command: string): Promise<string>;
  getWorkspaceFiles(): Promise<string[]>;
  showMessage(message: string): void;
  getCurrentEditor(): vscode.TextEditor | undefined;
} 