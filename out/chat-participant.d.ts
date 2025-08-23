import * as vscode from 'vscode';
export declare class MCPChatParticipant {
    private participant;
    private mcpClient;
    constructor(mcpClient: any, context: vscode.ExtensionContext);
    /**
     * Handle chat requests from the @mcp-bridge participant
     */
    private handleChatRequest;
    /**
     * Handle /chat command - Send message to Cursor AI
     */
    private handleChatCommand;
    /**
     * Handle /agent command - Trigger auto agent
     */
    private handleAgentCommand;
    /**
     * Handle /history command - Get chat history
     */
    private handleHistoryCommand;
    /**
     * Handle /bridge command - Show bridge information
     */
    private handleBridgeInfo;
    /**
     * Handle default command - Process general requests
     */
    private handleDefaultCommand;
    /**
     * Provide follow-up suggestions
     */
    private provideFollowups;
    /**
     * Fallback: Send message to chat using commands
     */
    private sendMessageToChat;
    /**
     * Fallback: Trigger auto agent using commands
     */
    private triggerAutoAgent;
}
