import * as vscode from 'vscode';
/**
 * MCP Language Model Tool - Enables Cursor AI agent mode to interact with MCP servers
 * This provides the missing link for sophisticated AI-to-AI collaboration
 */
export declare class MCPLanguageModelTool implements vscode.LanguageModelTool<any> {
    private mcpClient;
    private toolName;
    constructor(mcpClient: any, toolName: string);
    invoke(options: vscode.LanguageModelToolInvocationOptions<any>, token: vscode.CancellationToken): Promise<vscode.LanguageModelToolResult>;
    /**
     * Handle MCP query operations
     */
    private handleMCPQuery;
    /**
     * Handle file operations through MCP
     */
    private handleFileOperation;
    /**
     * Handle auto agent coordination
     */
    private handleAutoAgent;
    /**
     * Handle AI collaboration coordination
     */
    private handleCollaboration;
    /**
     * Handle generic MCP operations
     */
    private handleGenericMCP;
    /**
     * Optimize prompt for Cursor's auto agent
     */
    private optimizeForAutoAgent;
    /**
     * Get strategy-specific instructions
     */
    private getStrategyInstructions;
    /**
     * Generate unique collaboration ID
     */
    private generateCollaborationId;
}
/**
 * Register all MCP Language Model Tools
 */
export declare function registerLanguageModelTools(mcpClient: any): vscode.Disposable[];
/**
 * Tool definitions for MCP server registration
 */
export declare const MCP_LANGUAGE_MODEL_TOOLS: ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query: {
                type: string;
                description: string;
            };
            context: {
                type: string;
                description: string;
            };
            operation?: undefined;
            path?: undefined;
            content?: undefined;
            options?: undefined;
            prompt?: undefined;
            strategy?: undefined;
            task?: undefined;
            participants?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            operation: {
                type: string;
                enum: string[];
            };
            path: {
                type: string;
                description: string;
            };
            content: {
                type: string;
                description: string;
            };
            options: {
                type: string;
                description: string;
            };
            query?: undefined;
            context?: undefined;
            prompt?: undefined;
            strategy?: undefined;
            task?: undefined;
            participants?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            prompt: {
                type: string;
                description: string;
            };
            strategy: {
                type: string;
                enum: string[];
                description?: undefined;
            };
            context: {
                type: string;
                description: string;
            };
            query?: undefined;
            operation?: undefined;
            path?: undefined;
            content?: undefined;
            options?: undefined;
            task?: undefined;
            participants?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            task: {
                type: string;
                description: string;
            };
            participants: {
                type: string;
                items: {
                    type: string;
                };
            };
            strategy: {
                type: string;
                description: string;
                enum?: undefined;
            };
            query?: undefined;
            context?: undefined;
            operation?: undefined;
            path?: undefined;
            content?: undefined;
            options?: undefined;
            prompt?: undefined;
        };
        required: string[];
    };
})[];
