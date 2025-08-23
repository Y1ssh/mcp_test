import * as vscode from 'vscode';
import { MCPClient } from './mcp-client';
/**
 * MCP Chat Participant - Enables direct integration with VS Code's chat interface
 * This allows Claude Desktop to communicate with Cursor AI through the @mcp-bridge participant
 */
export declare class MCPChatParticipant {
    private participant;
    private mcpClient;
    constructor(mcpClient: MCPClient, context: vscode.ExtensionContext);
    /**
     * Main chat request handler - processes all @mcp-bridge requests
     */
    private handleChatRequest;
    /**
     * Handle @mcp-bridge bridge command
     */
    private handleBridgeCommand;
    /**
     * Handle @mcp-bridge agent command - triggers Cursor's auto agent
     */
    private handleAutoAgentCommand;
    /**
     * Handle @mcp-bridge history command
     */
    private handleHistoryCommand;
    /**
     * Handle @mcp-bridge status command
     */
    private handleStatusCommand;
    /**
     * Forward message to MCP server
     */
    private forwardToMCP;
    /**
     * Trigger Cursor's auto agent through various methods
     */
    private triggerAutoAgent;
    /**
     * Add action buttons to chat responses
     */
    private addActionButtons;
    /**
     * Provide follow-up suggestions based on context
     */
    private provideFollowups;
    /**
     * Get the participant instance (for external access)
     */
    getParticipant(): vscode.ChatParticipant;
}
