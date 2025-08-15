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