import * as vscode from 'vscode';
import { CursorAPIInterface } from './types';
export declare class CursorAPI implements CursorAPIInterface {
    constructor();
    openFileAtLine(filepath: string, line?: number): Promise<void>;
    executeCommand(command: string): Promise<string>;
    getWorkspaceFiles(): Promise<string[]>;
    showMessage(message: string): void;
    getCurrentEditor(): vscode.TextEditor | undefined;
    saveCurrentFile(): Promise<void>;
    getActiveFilePath(): Promise<string | undefined>;
}
