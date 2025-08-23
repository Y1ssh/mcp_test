"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CursorAPI = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
class CursorAPI {
    constructor() {
        console.log('CursorAPI initialized');
    }
    async openFileAtLine(filepath, line) {
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
        }
        catch (error) {
            console.error(`Error opening file ${filepath}:`, error);
            throw new Error(`Failed to open file ${filepath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async executeCommand(command) {
        try {
            console.log(`Executing command: ${command}`);
            // For VS Code extension, we'll execute VS Code commands
            // For shell commands, we'd need to use child_process (not implemented here for security)
            if (command.startsWith('vscode.')) {
                const result = await vscode.commands.executeCommand(command);
                const output = result ? JSON.stringify(result) : 'Command executed successfully';
                console.log(`Command executed successfully: ${command}`);
                return output;
            }
            else {
                // For non-VS Code commands, show a message instead of executing
                const message = `Command execution not supported in extension: ${command}`;
                this.showMessage(message);
                console.log(message);
                return message;
            }
        }
        catch (error) {
            console.error(`Error executing command ${command}:`, error);
            throw new Error(`Failed to execute command ${command}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getWorkspaceFiles() {
        try {
            console.log('Getting workspace files');
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                throw new Error('No workspace folder is open');
            }
            const files = [];
            // Find all files in the workspace
            const fileUris = await vscode.workspace.findFiles('**/*', // include pattern
            '{**/node_modules/**,**/.*/**,**/dist/**,**/build/**,**/out/**}' // exclude pattern
            );
            const workspaceRoot = workspaceFolders[0].uri.fsPath;
            for (const uri of fileUris) {
                const relativePath = path.relative(workspaceRoot, uri.fsPath);
                files.push(relativePath.replace(/\\/g, '/')); // Normalize path separators
            }
            console.log(`Found ${files.length} files in workspace`);
            return files.sort();
        }
        catch (error) {
            console.error('Error getting workspace files:', error);
            throw new Error(`Failed to get workspace files: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    showMessage(message) {
        try {
            console.log(`Showing message: ${message}`);
            vscode.window.showInformationMessage(`MCP Bridge: ${message}`);
        }
        catch (error) {
            console.error('Error showing message:', error);
        }
    }
    getCurrentEditor() {
        try {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                console.log(`Current editor: ${editor.document.fileName}`);
            }
            else {
                console.log('No active editor');
            }
            return editor;
        }
        catch (error) {
            console.error('Error getting current editor:', error);
            return undefined;
        }
    }
    async saveCurrentFile() {
        try {
            const editor = this.getCurrentEditor();
            if (editor) {
                await editor.document.save();
                console.log(`Saved file: ${editor.document.fileName}`);
            }
            else {
                throw new Error('No active editor to save');
            }
        }
        catch (error) {
            console.error('Error saving current file:', error);
            throw new Error(`Failed to save current file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getActiveFilePath() {
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
        }
        catch (error) {
            console.error('Error getting active file path:', error);
            return undefined;
        }
    }
}
exports.CursorAPI = CursorAPI;
//# sourceMappingURL=cursor-api.js.map