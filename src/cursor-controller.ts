import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { resolve, dirname } from 'path';
import { CursorControllerInterface, CommandResult } from './types';

const execAsync = promisify(exec);

export class CursorController implements CursorControllerInterface {
  private workingDirectory: string;

  constructor(workingDirectory?: string) {
    this.workingDirectory = workingDirectory || process.cwd();
    // console.error(`CursorController initialized with working directory: ${this.workingDirectory}`); // Removed to prevent JSON contamination
  }

  async editFile(filepath: string, content: string): Promise<void> {
    try {
      // console.error(`Editing file: ${filepath}`); // Removed to prevent JSON contamination
      const resolvedPath = resolve(this.workingDirectory, filepath);
      
      // Ensure directory exists
      const dir = dirname(resolvedPath);
      await fs.mkdir(dir, { recursive: true });
      
      await fs.writeFile(resolvedPath, content, 'utf8');
      // console.error(`Successfully edited file: ${resolvedPath}`); // Removed to prevent JSON contamination
    } catch (error) {
      console.error(`Error editing file ${filepath}:`, error);
      throw new Error(`Failed to edit file ${filepath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async readFile(filepath: string): Promise<string> {
    try {
      // console.error(`Reading file: ${filepath}`); // Removed to prevent JSON contamination
      const resolvedPath = resolve(this.workingDirectory, filepath);
      const content = await fs.readFile(resolvedPath, 'utf8');
      // console.error(`Successfully read file: ${resolvedPath} (${content.length} characters)`); // Removed to prevent JSON contamination
      return content;
    } catch (error) {
      console.error(`Error reading file ${filepath}:`, error);
      throw new Error(`Failed to read file ${filepath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async openFile(filepath: string, line?: number): Promise<void> {
    try {
      // console.error(`Opening file: ${filepath}${line ? ` at line ${line}` : ''}`); // Removed to prevent JSON contamination
      const resolvedPath = resolve(this.workingDirectory, filepath);
      
      // Check if file exists
      await fs.access(resolvedPath);
      
      // Simulate opening file in Cursor (in real implementation, this would integrate with Cursor's API)
      // console.error(`File opened successfully: ${resolvedPath}${line ? ` at line ${line}` : ''}`); // Removed to prevent JSON contamination
    } catch (error) {
      console.error(`Error opening file ${filepath}:`, error);
      throw new Error(`Failed to open file ${filepath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async listFiles(): Promise<string[]> {
    try {
      // console.error(`Listing files in: ${this.workingDirectory}`); // Removed to prevent JSON contamination
      const files = await this.getFilesRecursively(this.workingDirectory);
      // console.error(`Found ${files.length} files`); // Removed to prevent JSON contamination
      return files;
    } catch (error) {
      console.error('Error listing files:', error);
      throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getFilesRecursively(dir: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = resolve(dir, entry.name);
      const relativePath = fullPath.replace(this.workingDirectory + '/', '').replace(this.workingDirectory + '\\', '');
      
      if (entry.isDirectory()) {
        // Skip node_modules and other common directories
        if (!['node_modules', '.git', 'dist', '.next', 'build'].includes(entry.name)) {
          files.push(...await this.getFilesRecursively(fullPath));
        }
      } else {
        files.push(relativePath);
      }
    }
    
    return files;
  }

  async runCommand(command: string): Promise<string> {
    try {
      // console.error(`Running command: ${command}`); // Removed to prevent JSON contamination
      const result = await execAsync(command, { 
        cwd: this.workingDirectory,
        maxBuffer: 1024 * 1024 // 1MB buffer
      });
      
      const output = result.stdout || result.stderr || '';
      // console.error(`Command executed successfully: ${command}`); // Removed to prevent JSON contamination
      // console.error(`Output length: ${output.length} characters`); // Removed to prevent JSON contamination
      
      return output;
    } catch (error: any) {
      console.error(`Error running command ${command}:`, error);
      const errorMessage = error.stderr || error.stdout || error.message || 'Unknown error';
      throw new Error(`Failed to run command ${command}: ${errorMessage}`);
    }
  }
} 