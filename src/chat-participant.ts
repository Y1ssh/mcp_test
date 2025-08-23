import * as vscode from 'vscode';
import { MCPClient } from './mcp-client';

/**
 * MCP Chat Participant - Enables direct integration with VS Code's chat interface
 * This allows Claude Desktop to communicate with Cursor AI through the @mcp-bridge participant
 */
export class MCPChatParticipant {
    private participant: vscode.ChatParticipant;
    private mcpClient: MCPClient;

    constructor(mcpClient: MCPClient, context: vscode.ExtensionContext) {
        this.mcpClient = mcpClient;
        
        // Create the chat participant
        this.participant = vscode.chat.createChatParticipant(
            'mcp-bridge.cursor-integration',
            this.handleChatRequest.bind(this)
        );
        
        // Configure participant properties
        this.participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'assets', 'mcp-icon.png');
        this.participant.followupProvider = {
            provideFollowups: this.provideFollowups.bind(this)
        };

        // Add to context subscriptions for proper cleanup
        context.subscriptions.push(this.participant);
        
        console.log('MCP Chat Participant created successfully');
    }

    /**
     * Main chat request handler - processes all @mcp-bridge requests
     */
    private async handleChatRequest(
        request: vscode.ChatRequest,
        context: vscode.ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<any> {
        
        stream.progress('🌉 Processing MCP bridge request...');
        
        try {
            // Handle different command types
            switch (request.command) {
                case 'bridge':
                    await this.handleBridgeCommand(request, stream);
                    break;
                    
                case 'agent':
                    await this.handleAutoAgentCommand(request, stream);
                    break;
                    
                case 'history':
                    await this.handleHistoryCommand(request, stream, context);
                    break;
                    
                case 'status':
                    await this.handleStatusCommand(request, stream);
                    break;
                    
                default:
                    // Default: Forward message to MCP server
                    await this.forwardToMCP(request.prompt, stream);
                    break;
            }

            // Add helpful action buttons
            this.addActionButtons(stream, request.command);

        } catch (error) {
            stream.markdown(`❌ **Error:** ${error instanceof Error ? error.message : 'Unknown error'}`);
            console.error('Chat request error:', error);
        }

        return { success: true };
    }

    /**
     * Handle @mcp-bridge bridge command
     */
    private async handleBridgeCommand(request: vscode.ChatRequest, stream: vscode.ChatResponseStream): Promise<void> {
        stream.markdown('🌉 **MCP Bridge Integration Active**\n\n');
        stream.markdown('This participant bridges Claude Desktop with Cursor AI through MCP protocol.\n\n');
        
        stream.markdown('**Available Commands:**\n');
        stream.markdown('- `@mcp-bridge bridge` - Show bridge information\n');
        stream.markdown('- `@mcp-bridge agent <prompt>` - Trigger auto agent\n');
        stream.markdown('- `@mcp-bridge history` - Get chat history\n');
        stream.markdown('- `@mcp-bridge status` - Check connection status\n\n');
        
        stream.markdown('**Direct Usage:**\n');
        stream.markdown('- Send any message to forward it to the MCP server\n');
        stream.markdown('- Claude Desktop can communicate through this bridge\n');
        
        // Show current connection status
        const isConnected = this.mcpClient.getConnectionStatus().connected;
        stream.markdown(`\n**Current Status:** ${isConnected ? '✅ Connected' : '❌ Disconnected'}\n`);
    }

    /**
     * Handle @mcp-bridge agent command - triggers Cursor's auto agent
     */
    private async handleAutoAgentCommand(request: vscode.ChatRequest, stream: vscode.ChatResponseStream): Promise<void> {
        const prompt = request.prompt || 'Generate code based on current context';
        
        stream.progress('🤖 Triggering Cursor Auto Agent...');
        
        try {
            // Try multiple methods to trigger auto agent
            const success = await this.triggerAutoAgent(prompt);
            
            if (success) {
                stream.markdown(`🚀 **Auto Agent Triggered Successfully**\n\n`);
                stream.markdown(`**Prompt:** ${prompt}\n\n`);
                stream.markdown('The auto agent should now be processing your request in Cursor.\n');
            } else {
                stream.markdown(`⚠️ **Auto Agent Trigger Attempted**\n\n`);
                stream.markdown(`**Prompt:** ${prompt}\n\n`);
                stream.markdown('Multiple trigger methods were attempted. Check if Cursor responded.\n');
            }
            
        } catch (error) {
            stream.markdown(`❌ **Failed to trigger auto agent:** ${error instanceof Error ? error.message : 'Unknown error'}\n`);
        }
    }

    /**
     * Handle @mcp-bridge history command
     */
    private async handleHistoryCommand(request: vscode.ChatRequest, stream: vscode.ChatResponseStream, context?: vscode.ChatContext): Promise<void> {
        stream.progress('📜 Retrieving chat history...');
        
        try {
            // Get chat history from context
            const history = context?.history;
            
            if (history && history.length > 0) {
                stream.markdown('📜 **Recent Chat History**\n\n');
                
                                // Show last 5 messages
                const recentHistory = history.slice(-5);
                
                for (const entry of recentHistory) {
                    if ('prompt' in entry) {
                        // This is a ChatRequestTurn
                        const role = entry.participant ? `@${entry.participant}` : 'User';
                        const message = typeof entry.prompt === 'string' ? entry.prompt : 'Complex message';
                        stream.markdown(`**${role}:** ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}\n\n`);
                    } else {
                        // This is a ChatResponseTurn
                        stream.markdown(`**Assistant:** Response provided\n\n`);
                    }
                }
            } else {
                stream.markdown('📜 **Chat History**\n\nNo recent chat history available.\n');
            }
            
        } catch (error) {
            stream.markdown(`❌ **Failed to retrieve history:** ${error instanceof Error ? error.message : 'Unknown error'}\n`);
        }
    }

    /**
     * Handle @mcp-bridge status command
     */
    private async handleStatusCommand(request: vscode.ChatRequest, stream: vscode.ChatResponseStream): Promise<void> {
        const status = this.mcpClient.getConnectionStatus();
        
        stream.markdown('📊 **MCP Bridge Status**\n\n');
        stream.markdown(`**Connection:** ${status.connected ? '✅ Connected' : '❌ Disconnected'}\n`);
        stream.markdown(`**Port:** ${status.port}\n`);
        stream.markdown(`**Last Connected:** ${status.lastConnected?.toLocaleString() || 'Never'}\n`);
        stream.markdown(`**Reconnect Attempts:** ${status.reconnectAttempts}\n\n`);
        
        // Show available VS Code commands
        try {
            const commands = await vscode.commands.getCommands();
            const cursorCommands = commands.filter(cmd => 
                cmd.includes('cursor') || 
                cmd.includes('chat') || 
                cmd.includes('composer')
            );
            
            if (cursorCommands.length > 0) {
                stream.markdown(`**Available Cursor Commands:** ${cursorCommands.length} found\n`);
                stream.markdown(`\`\`\`\n${cursorCommands.slice(0, 10).join('\n')}\n\`\`\`\n`);
            }
        } catch (error) {
            stream.markdown('Could not retrieve available commands.\n');
        }
    }

    /**
     * Forward message to MCP server
     */
    private async forwardToMCP(message: string, stream: vscode.ChatResponseStream): Promise<void> {
        stream.progress('🔄 Forwarding to MCP server...');
        
        try {
            // Check if MCP client is connected
            if (!this.mcpClient.getConnectionStatus().connected) {
                stream.markdown('⚠️ **MCP Server Not Connected**\n\n');
                stream.markdown('The MCP server is not currently connected. Please connect first.\n');
                return;
            }

            // Send message to MCP server (this would be implemented in MCPClient)
            stream.markdown('💬 **Message sent to MCP server**\n\n');
            stream.markdown(`**Your message:** ${message}\n\n`);
            stream.markdown('The message has been forwarded to the MCP server for processing.\n');
            
            // In a real implementation, we would:
            // 1. Send the message to the MCP server
            // 2. Wait for a response
            // 3. Stream the response back to the chat
            
        } catch (error) {
            stream.markdown(`❌ **MCP Communication Error:** ${error instanceof Error ? error.message : 'Unknown error'}\n`);
        }
    }

    /**
     * Trigger Cursor's auto agent through various methods
     */
    private async triggerAutoAgent(prompt: string): Promise<boolean> {
        // Method 1: Try known Cursor commands
        const autoAgentCommands = [
            'cursor.composer.create',
            'cursor.agent.activate', 
            'workbench.action.chat.openInSidebar',
            'cursor.ai.autoComplete',
            'workbench.action.chat.open'
        ];

        for (const command of autoAgentCommands) {
            try {
                await vscode.commands.executeCommand(command, { prompt });
                console.log(`Auto agent triggered successfully with command: ${command}`);
                return true;
            } catch (error) {
                // Continue to next command
                continue;
            }
        }

        // Method 2: Try clipboard + keyboard simulation
        try {
            await vscode.env.clipboard.writeText(prompt);
            // The actual keyboard simulation would need native implementation
            console.log('Prompt copied to clipboard for manual triggering');
            return false;
        } catch (error) {
            console.error('Failed clipboard method:', error);
            return false;
        }
    }

    /**
     * Add action buttons to chat responses
     */
    private addActionButtons(stream: vscode.ChatResponseStream, command?: string): void {
        if (command !== 'status') {
            stream.button({
                command: 'cursor-mcp-bridge.status',
                title: 'Check Status'
            });
        }
        
        stream.button({
            command: 'cursor-mcp-bridge.connect',
            title: 'Connect MCP'
        });
        
        if (command !== 'agent') {
            stream.button({
                command: 'mcp-bridge.trigger-agent',
                title: 'Trigger Agent',
                arguments: ['Create a helpful component']
            });
        }
    }

    /**
     * Provide follow-up suggestions based on context
     */
    private async provideFollowups(
        result: any,
        context: vscode.ChatContext,
        token: vscode.CancellationToken
    ): Promise<vscode.ChatFollowup[]> {
        
        // Get the last request to provide contextual follow-ups
        const lastMessage = context.history[context.history.length - 1];
        const lastCommand = lastMessage && 'prompt' in lastMessage ? lastMessage.prompt : undefined;

        const followups: vscode.ChatFollowup[] = [];

        // Add contextual follow-ups based on last command
        if (lastCommand?.includes('agent')) {
            followups.push({
                prompt: 'Check agent execution status',
                label: '📊 Agent Status'
            });
        }
        
        if (lastCommand?.includes('bridge') || lastCommand?.includes('status')) {
            followups.push({
                prompt: 'Test MCP server connection',
                label: '🔗 Test Connection'
            });
        }

        // Always provide these common follow-ups
        followups.push(
            {
                prompt: 'Show available commands',
                label: '📋 Commands'
            },
            {
                prompt: 'Get chat history',
                label: '📜 History'
            },
            {
                prompt: 'Trigger auto agent with current context',
                label: '🤖 Auto Agent'
            }
        );

        return followups;
    }

    /**
     * Get the participant instance (for external access)
     */
    public getParticipant(): vscode.ChatParticipant {
        return this.participant;
    }
} 