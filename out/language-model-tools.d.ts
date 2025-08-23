import * as vscode from 'vscode';
import { MCPClient } from './mcp-client';
/**
 * Register MCP language model integration commands
 */
export declare function registerLanguageModelTools(mcpClient: MCPClient, context: vscode.ExtensionContext): void;
/**
 * Command schemas for documentation
 */
export declare const MCPCommandSchemas: {
    'mcp-bridge.query-server': {
        description: string;
        parameters: string[];
    };
    'mcp-bridge.file-operation': {
        description: string;
        parameters: string[];
    };
    'mcp-bridge.trigger-agent': {
        description: string;
        parameters: string[];
    };
    'mcp-bridge.workspace-info': {
        description: string;
        parameters: string[];
    };
};
