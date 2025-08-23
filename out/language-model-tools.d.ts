import * as vscode from 'vscode';
/**
 * MCP Language Model Tool for agent mode integration
 */
export declare class MCPLanguageModelTool implements vscode.LanguageModelTool<any> {
    private toolName;
    protected mcpClient: any;
    private description;
    constructor(toolName: string, mcpClient: any, description: string);
    invoke(options: vscode.LanguageModelToolInvocationOptions<any>, token: vscode.CancellationToken): Promise<vscode.LanguageModelToolResult>;
}
/**
 * MCP Query Tool - for general MCP server queries
 */
export declare class MCPQueryTool extends MCPLanguageModelTool {
    constructor(mcpClient: any);
    invoke(options: vscode.LanguageModelToolInvocationOptions<any>, token: vscode.CancellationToken): Promise<vscode.LanguageModelToolResult>;
}
/**
 * MCP Chat Tool - for cursor chat integration
 */
export declare class MCPChatTool extends MCPLanguageModelTool {
    constructor(mcpClient: any);
    invoke(options: vscode.LanguageModelToolInvocationOptions<any>, token: vscode.CancellationToken): Promise<vscode.LanguageModelToolResult>;
    private fallbackSendToChat;
}
/**
 * MCP Auto Agent Tool - for triggering auto agents
 */
export declare class MCPAutoAgentTool extends MCPLanguageModelTool {
    constructor(mcpClient: any);
    invoke(options: vscode.LanguageModelToolInvocationOptions<any>, token: vscode.CancellationToken): Promise<vscode.LanguageModelToolResult>;
    private fallbackTriggerAgent;
}
/**
 * Register all MCP language model tools
 */
export declare function registerLanguageModelTools(mcpClient: any): vscode.Disposable[];
/**
 * Get available language model tools information
 */
export declare function getToolsInfo(): any[];
