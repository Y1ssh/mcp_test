import * as vscode from 'vscode';

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

export interface CommandResult {
  output: string;
  exitCode?: number;
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
}

export interface CursorAPIInterface {
  openFileAtLine(filepath: string, line?: number): Promise<void>;
  executeCommand(command: string): Promise<string>;
  getWorkspaceFiles(): Promise<string[]>;
  showMessage(message: string): void;
  getCurrentEditor(): vscode.TextEditor | undefined;
} 