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
exports.MCPCommandSchemas = void 0;
exports.registerLanguageModelTools = registerLanguageModelTools;
const vscode = __importStar(require("vscode"));
/**
 * MCP Language Model Integration - Provides command-based integration
 *
 * This provides a working alternative to the Language Model Tools API
 * by registering VS Code commands that can be called by chat participants
 * and other VS Code extensions.
 */
/**
 * Query MCP server with a specific request
 */
async function queryMCPServer(mcpClient, query, context) {
    try {
        // Check MCP connection
        if (!mcpClient.getConnectionStatus().connected) {
            return {
                success: false,
                error: 'MCP server not connected',
                query,
                context
            };
        }
        // For now, return a simulated response
        // In a real implementation, this would communicate with the MCP server
        return {
            success: true,
            query,
            context,
            response: `Simulated MCP response for: "${query}"`,
            timestamp: new Date().toISOString()
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            query,
            context
        };
    }
}
/**
 * Perform file operations through VS Code API
 */
async function performFileOperation(operation, filepath, content, line) {
    try {
        switch (operation) {
            case 'read':
                const document = await vscode.workspace.openTextDocument(filepath);
                return {
                    success: true,
                    operation: 'read',
                    filepath,
                    content: document.getText(),
                    lineCount: document.lineCount
                };
            case 'open':
                const doc = await vscode.workspace.openTextDocument(filepath);
                await vscode.window.showTextDocument(doc);
                if (line !== undefined) {
                    const editor = vscode.window.activeTextEditor;
                    if (editor) {
                        const position = new vscode.Position(Math.max(0, line - 1), 0);
                        editor.selection = new vscode.Selection(position, position);
                        editor.revealRange(new vscode.Range(position, position));
                    }
                }
                return {
                    success: true,
                    operation: 'open',
                    filepath,
                    line
                };
            case 'write':
                if (!content) {
                    return {
                        success: false,
                        operation: 'write',
                        filepath,
                        error: 'Content parameter required for write operation'
                    };
                }
                const uri = vscode.Uri.file(filepath);
                const encoder = new TextEncoder();
                await vscode.workspace.fs.writeFile(uri, encoder.encode(content));
                return {
                    success: true,
                    operation: 'write',
                    filepath,
                    contentLength: content.length
                };
            case 'create':
                const createUri = vscode.Uri.file(filepath);
                const createEncoder = new TextEncoder();
                await vscode.workspace.fs.writeFile(createUri, createEncoder.encode(content || ''));
                return {
                    success: true,
                    operation: 'create',
                    filepath
                };
            default:
                return {
                    success: false,
                    operation,
                    filepath,
                    error: `Unknown operation: ${operation}`
                };
        }
    }
    catch (error) {
        return {
            success: false,
            operation,
            filepath,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
/**
 * Trigger Cursor's auto agent through various methods
 */
async function triggerAutoAgent(prompt, strategy) {
    try {
        const commands = getCommandsByStrategy(strategy);
        let lastError;
        // Try each command in order
        for (const command of commands) {
            try {
                await vscode.commands.executeCommand(command, { prompt });
                return {
                    success: true,
                    command,
                    prompt,
                    strategy,
                    message: 'Auto agent triggered successfully'
                };
            }
            catch (error) {
                lastError = error instanceof Error ? error.message : 'Unknown error';
                continue;
            }
        }
        // If all commands failed, try clipboard method
        try {
            await vscode.env.clipboard.writeText(prompt);
            return {
                success: false,
                prompt,
                strategy,
                message: 'Commands failed, prompt copied to clipboard for manual triggering',
                error: lastError
            };
        }
        catch (clipboardError) {
            return {
                success: false,
                prompt,
                strategy,
                message: 'All trigger methods failed',
                error: lastError
            };
        }
    }
    catch (error) {
        return {
            success: false,
            prompt,
            strategy,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
/**
 * Get command list based on strategy
 */
function getCommandsByStrategy(strategy) {
    switch (strategy) {
        case 'composer':
            return [
                'cursor.composer.create',
                'cursor.composer.open',
                'workbench.action.chat.openInSidebar'
            ];
        case 'chat':
            return [
                'workbench.action.chat.open',
                'workbench.action.chat.openInSidebar',
                'workbench.panel.chat.view.copilot'
            ];
        case 'auto':
        default:
            return [
                'cursor.composer.create',
                'cursor.agent.activate',
                'workbench.action.chat.openInSidebar',
                'cursor.ai.autoComplete',
                'workbench.action.chat.open',
                'cursor.composer.open'
            ];
    }
}
/**
 * Perform workspace operations
 */
async function performWorkspaceOperation(operation, pattern) {
    try {
        switch (operation) {
            case 'workspace_info':
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                return {
                    success: true,
                    operation: 'workspace_info',
                    workspaceFolder: workspaceFolder?.uri.fsPath,
                    name: workspaceFolder?.name
                };
            case 'get_current_file':
                const activeEditor = vscode.window.activeTextEditor;
                if (activeEditor) {
                    return {
                        success: true,
                        operation: 'get_current_file',
                        filepath: activeEditor.document.fileName,
                        languageId: activeEditor.document.languageId,
                        lineCount: activeEditor.document.lineCount,
                        isDirty: activeEditor.document.isDirty
                    };
                }
                else {
                    return {
                        success: false,
                        operation: 'get_current_file',
                        message: 'No active editor'
                    };
                }
            case 'find_files':
                if (!pattern) {
                    return {
                        success: false,
                        operation: 'find_files',
                        error: 'Pattern parameter required for find_files operation'
                    };
                }
                const files = await vscode.workspace.findFiles(pattern, null, 100);
                return {
                    success: true,
                    operation: 'find_files',
                    pattern,
                    files: files.map(uri => uri.fsPath),
                    count: files.length
                };
            case 'list_files':
                const allFiles = await vscode.workspace.findFiles('**/*', null, 1000);
                return {
                    success: true,
                    operation: 'list_files',
                    files: allFiles.map(uri => uri.fsPath),
                    count: allFiles.length
                };
            default:
                return {
                    success: false,
                    operation,
                    error: `Unknown operation: ${operation}`
                };
        }
    }
    catch (error) {
        return {
            success: false,
            operation,
            pattern,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
/**
 * Register MCP language model integration commands
 */
function registerLanguageModelTools(mcpClient, context) {
    try {
        console.log('Registering MCP language model integration...');
        // Register commands that can be called by chat participants and other extensions
        const commands = [
            {
                name: 'mcp-bridge.query-server',
                handler: async (query, context) => {
                    return await queryMCPServer(mcpClient, query, context);
                }
            },
            {
                name: 'mcp-bridge.file-operation',
                handler: async (operation, filepath, content, line) => {
                    return await performFileOperation(operation, filepath, content, line);
                }
            },
            {
                name: 'mcp-bridge.trigger-agent',
                handler: async (prompt, strategy) => {
                    return await triggerAutoAgent(prompt, strategy);
                }
            },
            {
                name: 'mcp-bridge.workspace-info',
                handler: async (operation, pattern) => {
                    return await performWorkspaceOperation(operation, pattern);
                }
            }
        ];
        // Register all commands
        for (const command of commands) {
            const disposable = vscode.commands.registerCommand(command.name, command.handler);
            context.subscriptions.push(disposable);
            console.log(`Registered MCP command: ${command.name}`);
        }
        console.log(`Successfully registered ${commands.length} MCP commands for language model integration`);
    }
    catch (error) {
        console.error('Error registering language model tools:', error);
    }
}
/**
 * Command schemas for documentation
 */
exports.MCPCommandSchemas = {
    'mcp-bridge.query-server': {
        description: 'Query the MCP server with a specific request',
        parameters: ['query: string', 'context?: string']
    },
    'mcp-bridge.file-operation': {
        description: 'Perform file operations through MCP bridge',
        parameters: ['operation: read|write|open|create', 'filepath: string', 'content?: string', 'line?: number']
    },
    'mcp-bridge.trigger-agent': {
        description: 'Trigger Cursor auto agent through MCP bridge',
        parameters: ['prompt: string', 'strategy?: composer|chat|auto']
    },
    'mcp-bridge.workspace-info': {
        description: 'Get workspace information and perform workspace operations',
        parameters: ['operation: workspace_info|get_current_file|find_files|list_files', 'pattern?: string']
    }
};
//# sourceMappingURL=language-model-tools.js.map