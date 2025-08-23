import * as vscode from 'vscode';
/**
 * MCP Chat Participant - Core integration for Claude Desktop ↔ Cursor AI communication
 * Enables @mcp-bridge commands in Cursor's chat interface
 */
export declare class MCPChatParticipant {
    private participant;
    private mcpClient;
    constructor(mcpClient: any, context: vscode.ExtensionContext);
    /**
     * Main chat request handler - processes @mcp-bridge commands
     */
    private handleChatRequest;
    /**
     * Handle @mcp-bridge /chat commands
     */
    private handleChatCommand;
    /**
     * Handle @mcp-bridge /agent commands
     */
    private handleAgentCommand;
    /**
     * Handle @mcp-bridge /history commands
     */
    private handleHistoryCommand;
    /**
     * Handle @mcp-bridge /collaborate commands
     */
    private handleCollaborateCommand;
    /**
     * Handle default @mcp-bridge commands (info/help)
     */
    private handleDefaultCommand;
    /**
     * Provide follow-up suggestions
     */
    private provideFollowups;
    /**
     * Send message to Cursor AI chat interface
     */
    sendMessageToCursorAI(message: string): Promise<void>;
    /**
     * Get chat history from Cursor
     */
    private getChatHistory;
    /**
     * Start AI collaboration session
     */
    private startAICollaboration;
    /**
     * Optimize prompt for Cursor's auto agent
     */
    private optimizePromptForAgent;
    /**
     * Forward request to MCP server
     */
    private forwardToMCPServer;
    /**
     * Dispose of the participant
     */
    dispose(): void;
}
