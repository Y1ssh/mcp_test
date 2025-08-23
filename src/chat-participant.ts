import * as vscode from 'vscode';

export class MCPChatParticipant {
    private participant: vscode.ChatParticipant;
    private mcpClient: any;
    
    constructor(mcpClient: any, context: vscode.ExtensionContext) {
        this.mcpClient = mcpClient;
        
        this.participant = vscode.chat.createChatParticipant(
            'mcp-bridge.cursor-integration',
            this.handleChatRequest.bind(this)
        );
        
        // Set icon path (optional - will use default if file doesn't exist)
        try {
            this.participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'assets', 'mcp-icon.png');
        } catch (error) {
            // Use default icon if custom icon not available
        }
        
        this.participant.followupProvider = {
            provideFollowups: this.provideFollowups.bind(this)
        };
        
        // Add to context subscriptions
        context.subscriptions.push(this.participant);
    }
    
    /**
     * Handle chat requests from the @mcp-bridge participant
     */
    private async handleChatRequest(
        request: vscode.ChatRequest,
        context: vscode.ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<any> {
        
        stream.progress('Processing MCP bridge request...');
        
        try {
            // Parse command and arguments
            const command = request.command || 'default';
            const prompt = request.prompt;
            
            switch (command) {
                case 'chat':
                    await this.handleChatCommand(prompt, stream);
                    break;
                case 'agent':
                    await this.handleAgentCommand(prompt, stream);
                    break;
                case 'history':
                    await this.handleHistoryCommand(prompt, stream);
                    break;
                case 'bridge':
                    await this.handleBridgeInfo(stream);
                    break;
                default:
                    await this.handleDefaultCommand(prompt, stream);
                    break;
            }

        } catch (error) {
            stream.markdown(`❌ **Error:** ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        return { success: true };
    }
    
    /**
     * Handle /chat command - Send message to Cursor AI
     */
    private async handleChatCommand(prompt: string, stream: vscode.ChatResponseStream): Promise<void> {
        stream.markdown('💬 **Sending to Cursor AI Chat...**\n\n');
        
        try {
            // Forward to MCP server
            if (this.mcpClient && this.mcpClient.request) {
                const response = await this.mcpClient.request({
                    method: 'tools/call',
                    params: {
                        name: 'cursor_chat_with_ai',
                        arguments: {
                            message: prompt,
                            context: 'mcp-bridge'
                        }
                    }
                });
                
                stream.markdown(`✅ **Message sent successfully**\n\n`);
                stream.markdown(`**Response:** ${response.content || 'Message forwarded to chat'}`);
            } else {
                // Fallback: Use command execution
                await this.sendMessageToChat(prompt);
                stream.markdown(`✅ **Message sent via command fallback**`);
            }
            
        } catch (error) {
            stream.markdown(`❌ **Failed to send message:** ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    
    /**
     * Handle /agent command - Trigger auto agent
     */
    private async handleAgentCommand(prompt: string, stream: vscode.ChatResponseStream): Promise<void> {
        stream.markdown('🤖 **Triggering Auto Agent...**\n\n');
        
        try {
            if (this.mcpClient && this.mcpClient.request) {
                const response = await this.mcpClient.request({
                    method: 'tools/call',
                    params: {
                        name: 'cursor_trigger_auto_agent',
                        arguments: {
                            prompt: prompt,
                            strategy: 'comprehensive'
                        }
                    }
                });
                
                stream.markdown(`🚀 **Auto agent triggered successfully**\n\n`);
                stream.markdown(`**Task:** ${prompt}\n`);
                stream.markdown(`**Status:** ${response.content || 'Agent processing...'}`);
            } else {
                // Fallback: Use composer command
                await this.triggerAutoAgent(prompt);
                stream.markdown(`🚀 **Auto agent triggered via command fallback**`);
            }
            
        } catch (error) {
            stream.markdown(`❌ **Failed to trigger agent:** ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    
    /**
     * Handle /history command - Get chat history
     */
    private async handleHistoryCommand(prompt: string, stream: vscode.ChatResponseStream): Promise<void> {
        stream.markdown('📜 **Retrieving Chat History...**\n\n');
        
        try {
            const limit = parseInt(prompt) || 10;
            
            if (this.mcpClient && this.mcpClient.request) {
                const response = await this.mcpClient.request({
                    method: 'tools/call',
                    params: {
                        name: 'cursor_get_chat_history',
                        arguments: {
                            limit: limit
                        }
                    }
                });
                
                if (response.content && Array.isArray(response.content)) {
                    stream.markdown(`📋 **Recent Chat History (${response.content.length} items):**\n\n`);
                    response.content.forEach((item: any, index: number) => {
                        stream.markdown(`${index + 1}. **${item.timestamp || 'Recent'}:** ${item.message || item.content}\n`);
                    });
                } else {
                    stream.markdown(`📋 **Chat history retrieved:** ${response.content || 'No recent history'}`);
                }
            } else {
                stream.markdown(`📋 **Chat history access not available** (MCP client not connected)`);
            }
            
        } catch (error) {
            stream.markdown(`❌ **Failed to retrieve history:** ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    
    /**
     * Handle /bridge command - Show bridge information
     */
    private async handleBridgeInfo(stream: vscode.ChatResponseStream): Promise<void> {
        stream.markdown('🌉 **MCP Bridge Integration**\n\n');
        stream.markdown('This participant enables direct communication between Claude Desktop and Cursor AI.\n\n');
        
        stream.markdown('**Available Commands:**\n');
        stream.markdown('- `/chat <message>` - Send message to Cursor AI\n');
        stream.markdown('- `/agent <prompt>` - Trigger auto agent with prompt\n');
        stream.markdown('- `/history [limit]` - Get recent chat history\n');
        stream.markdown('- `/bridge` - Show this information\n\n');
        
        stream.markdown('**MCP Client Status:** ');
        if (this.mcpClient) {
            stream.markdown('✅ Connected\n');
        } else {
            stream.markdown('❌ Not connected\n');
        }
        
        stream.button({
            command: 'mcp-bridge.test-integration',
            title: 'Test Integration'
        });
    }
    
    /**
     * Handle default command - Process general requests
     */
    private async handleDefaultCommand(prompt: string, stream: vscode.ChatResponseStream): Promise<void> {
        stream.markdown(`🔄 **Processing:** ${prompt}\n\n`);
        
        try {
            // Try to determine the best action based on prompt content
            if (prompt.toLowerCase().includes('agent') || prompt.toLowerCase().includes('auto') || prompt.toLowerCase().includes('generate')) {
                await this.handleAgentCommand(prompt, stream);
            } else if (prompt.toLowerCase().includes('history') || prompt.toLowerCase().includes('previous')) {
                await this.handleHistoryCommand('10', stream);
            } else {
                await this.handleChatCommand(prompt, stream);
            }
            
        } catch (error) {
            stream.markdown(`❌ **Error processing request:** ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    
    /**
     * Provide follow-up suggestions
     */
    private async provideFollowups(
        result: any,
        context: vscode.ChatContext,
        token: vscode.CancellationToken
    ): Promise<vscode.ChatFollowup[]> {
        
        return [
            {
                prompt: '/chat Create a new React component',
                label: 'Send to Chat'
            },
            {
                prompt: '/agent Build a simple web app',
                label: 'Trigger Agent'
            },
            {
                prompt: '/history 5',
                label: 'Show History'
            },
            {
                prompt: '/bridge',
                label: 'Bridge Info'
            }
        ];
    }
    
    /**
     * Fallback: Send message to chat using commands
     */
    private async sendMessageToChat(message: string): Promise<void> {
        try {
            // Try to open chat/composer
            const chatCommands = [
                'workbench.action.chat.open',
                'workbench.panel.chat.view.copilot',
                'cursor.chat.focus',
                'cursor.composer.focus'
            ];

            for (const command of chatCommands) {
                try {
                    await vscode.commands.executeCommand(command);
                    break;
                } catch (error) {
                    continue;
                }
            }

            // Copy message to clipboard for user to paste
            await vscode.env.clipboard.writeText(message);
            vscode.window.showInformationMessage(`Message copied to clipboard: "${message}"`);
            
        } catch (error) {
            console.error('Failed to send message to chat:', error);
        }
    }
    
    /**
     * Fallback: Trigger auto agent using commands
     */
    private async triggerAutoAgent(prompt: string): Promise<void> {
        try {
            const autoAgentCommands = [
                'cursor.composer.create',
                'cursor.agent.activate',
                'workbench.action.chat.openInSidebar'
            ];

            for (const command of autoAgentCommands) {
                try {
                    await vscode.commands.executeCommand(command, { prompt });
                    vscode.window.showInformationMessage(`Auto agent triggered with: ${prompt}`);
                    return;
                } catch (error) {
                    continue;
                }
            }

            // Fallback: Copy to clipboard
            await vscode.env.clipboard.writeText(prompt);
            vscode.window.showInformationMessage(`Agent prompt copied to clipboard: "${prompt}"`);
            
        } catch (error) {
            console.error('Failed to trigger auto agent:', error);
        }
    }
} 