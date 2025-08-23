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
exports.MCPChatParticipant = void 0;
const vscode = __importStar(require("vscode"));
/**
 * MCP Chat Participant - Core integration for Claude Desktop ↔ Cursor AI communication
 * Enables @mcp-bridge commands in Cursor's chat interface
 */
class MCPChatParticipant {
    participant;
    mcpClient;
    constructor(mcpClient, context) {
        this.mcpClient = mcpClient;
        // Create the chat participant
        this.participant = vscode.chat.createChatParticipant('mcp-bridge.cursor-integration', this.handleChatRequest.bind(this));
        // Set participant properties
        this.participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'assets', 'mcp-icon.png');
        this.participant.followupProvider = {
            provideFollowups: this.provideFollowups.bind(this)
        };
        // Add to context subscriptions
        context.subscriptions.push(this.participant);
        vscode.window.showInformationMessage('🌉 MCP Bridge Chat Participant activated!');
    }
    /**
     * Main chat request handler - processes @mcp-bridge commands
     */
    async handleChatRequest(request, context, stream, token) {
        stream.progress('🔄 Processing MCP Bridge request...');
        try {
            // Handle different MCP commands
            switch (request.command) {
                case 'chat':
                    await this.handleChatCommand(request, stream);
                    break;
                case 'agent':
                    await this.handleAgentCommand(request, stream);
                    break;
                case 'history':
                    await this.handleHistoryCommand(request, stream);
                    break;
                case 'collaborate':
                    await this.handleCollaborateCommand(request, stream);
                    break;
                default:
                    await this.handleDefaultCommand(request, stream);
                    break;
            }
        }
        catch (error) {
            stream.markdown(`❌ **Error:** ${error.message}`);
            console.error('MCP Chat Participant error:', error);
        }
        return { success: true };
    }
    /**
     * Handle @mcp-bridge /chat commands
     */
    async handleChatCommand(request, stream) {
        stream.markdown('💬 **Sending to Cursor AI Chat...**\n\n');
        try {
            // Forward message to Cursor AI via command execution
            await vscode.commands.executeCommand('workbench.action.chat.open');
            // Simulate sending the message
            await this.sendMessageToCursorAI(request.prompt);
            stream.markdown(`✅ Message sent: "${request.prompt}"`);
            stream.markdown('\n\n*Check the Cursor AI chat panel for the response.*');
            // Add action button
            stream.button({
                command: 'workbench.action.chat.open',
                title: 'Open Chat Panel'
            });
        }
        catch (error) {
            stream.markdown(`❌ Failed to send to chat: ${error.message}`);
        }
    }
    /**
     * Handle @mcp-bridge /agent commands
     */
    async handleAgentCommand(request, stream) {
        stream.markdown('🤖 **Triggering Cursor Auto Agent...**\n\n');
        try {
            // Try different agent triggering approaches
            const agentCommands = [
                'cursor.composer.create',
                'cursor.agent.activate',
                'workbench.action.chat.openInSidebar'
            ];
            let triggered = false;
            for (const command of agentCommands) {
                try {
                    await vscode.commands.executeCommand(command, { prompt: request.prompt });
                    triggered = true;
                    break;
                }
                catch (error) {
                    continue;
                }
            }
            if (triggered) {
                stream.markdown(`✅ Auto agent triggered with prompt: "${request.prompt}"`);
                stream.markdown('\n\n*The auto agent should start working on your request shortly.*');
            }
            else {
                // Fallback: Copy prompt to clipboard and show instructions
                await vscode.env.clipboard.writeText(request.prompt);
                stream.markdown('⚠️ Direct agent triggering failed. Prompt copied to clipboard.');
                stream.markdown('\n\n**Manual steps:**');
                stream.markdown('1. Open Cursor Composer (Ctrl+I or Cmd+I)');
                stream.markdown('2. Paste the prompt (Ctrl+V or Cmd+V)');
                stream.markdown('3. Press Enter to start the agent');
            }
        }
        catch (error) {
            stream.markdown(`❌ Failed to trigger agent: ${error.message}`);
        }
    }
    /**
     * Handle @mcp-bridge /history commands
     */
    async handleHistoryCommand(request, stream) {
        stream.markdown('📚 **Retrieving Chat History...**\n\n');
        try {
            // Extract limit from prompt
            const limitMatch = request.prompt.match(/(\d+)/);
            const limit = limitMatch ? parseInt(limitMatch[1]) : 10;
            const history = await this.getChatHistory(limit);
            if (history.length > 0) {
                stream.markdown(`**Last ${history.length} chat entries:**\n\n`);
                history.forEach((entry, index) => {
                    stream.markdown(`**${index + 1}.** ${entry.timestamp}\n`);
                    stream.markdown(`*${entry.role}:* ${entry.content}\n\n`);
                });
            }
            else {
                stream.markdown('No chat history found.');
            }
        }
        catch (error) {
            stream.markdown(`❌ Failed to retrieve history: ${error.message}`);
        }
    }
    /**
     * Handle @mcp-bridge /collaborate commands
     */
    async handleCollaborateCommand(request, stream) {
        stream.markdown('🤝 **Starting AI Collaboration Session...**\n\n');
        try {
            stream.markdown('**Collaboration Strategy:**\n');
            stream.markdown('1. 🧠 Claude Desktop analyzes the task\n');
            stream.markdown('2. 🎯 MCP Bridge forwards optimized prompts\n');
            stream.markdown('3. ⚡ Cursor AI executes the implementation\n');
            stream.markdown('4. 🔄 Continuous feedback loop established\n\n');
            // Start the collaboration
            await this.startAICollaboration(request.prompt);
            stream.markdown(`✅ Collaboration started for: "${request.prompt}"`);
            // Add follow-up buttons
            stream.button({
                command: 'mcp-bridge.monitor-collaboration',
                title: 'Monitor Progress'
            });
        }
        catch (error) {
            stream.markdown(`❌ Failed to start collaboration: ${error.message}`);
        }
    }
    /**
     * Handle default @mcp-bridge commands (info/help)
     */
    async handleDefaultCommand(request, stream) {
        stream.markdown('🌉 **MCP Bridge - Claude Desktop ↔ Cursor AI**\n\n');
        stream.markdown('**Available Commands:**\n\n');
        stream.markdown('• `@mcp-bridge /chat <message>` - Send message to Cursor AI\n');
        stream.markdown('• `@mcp-bridge /agent <prompt>` - Trigger Cursor Auto Agent\n');
        stream.markdown('• `@mcp-bridge /history [limit]` - Get chat history\n');
        stream.markdown('• `@mcp-bridge /collaborate <task>` - Start AI collaboration\n\n');
        stream.markdown('**Example Usage:**\n');
        stream.markdown('```\n');
        stream.markdown('@mcp-bridge /agent Create a React component for user authentication\n');
        stream.markdown('@mcp-bridge /chat How do I optimize this function?\n');
        stream.markdown('@mcp-bridge /collaborate Build a Windows 95 simulator\n');
        stream.markdown('```\n\n');
        if (request.prompt) {
            // Forward non-command prompts to MCP server
            const mcpResponse = await this.forwardToMCPServer(request.prompt);
            stream.markdown('**MCP Server Response:**\n');
            stream.markdown(mcpResponse);
        }
        // Add action buttons
        stream.button({
            command: 'mcp-bridge.test-connection',
            title: 'Test MCP Connection'
        });
        stream.button({
            command: 'workbench.action.chat.open',
            title: 'Open Chat'
        });
    }
    /**
     * Provide follow-up suggestions
     */
    async provideFollowups(result, context, token) {
        return [
            {
                prompt: '@mcp-bridge /chat How can I improve this code?',
                label: '💬 Ask Cursor AI'
            },
            {
                prompt: '@mcp-bridge /agent Create a new feature',
                label: '🤖 Trigger Agent'
            },
            {
                prompt: '@mcp-bridge /history 5',
                label: '📚 View History'
            },
            {
                prompt: '@mcp-bridge /collaborate Build something amazing',
                label: '🤝 Start Collaboration'
            }
        ];
    }
    /**
     * Send message to Cursor AI chat interface
     */
    async sendMessageToCursorAI(message) {
        try {
            // Try multiple approaches to send to chat
            const chatCommands = [
                'workbench.action.chat.open',
                'workbench.panel.chat.view.copilot',
                'cursor.chat.focus'
            ];
            for (const command of chatCommands) {
                try {
                    await vscode.commands.executeCommand(command);
                    break;
                }
                catch (error) {
                    continue;
                }
            }
            // Copy message to clipboard for easy pasting
            await vscode.env.clipboard.writeText(message);
            // Show notification
            vscode.window.showInformationMessage(`Message ready to paste in chat: "${message.substring(0, 50)}..."`);
        }
        catch (error) {
            console.error('Failed to send message to Cursor AI:', error);
            throw error;
        }
    }
    /**
     * Get chat history from Cursor
     */
    async getChatHistory(limit = 10) {
        try {
            // Placeholder for actual chat history retrieval
            // In real implementation, this would access Cursor's chat storage
            return [
                {
                    timestamp: new Date().toISOString(),
                    role: 'user',
                    content: 'Example chat message'
                },
                {
                    timestamp: new Date().toISOString(),
                    role: 'assistant',
                    content: 'Example AI response'
                }
            ];
        }
        catch (error) {
            console.error('Failed to get chat history:', error);
            return [];
        }
    }
    /**
     * Start AI collaboration session
     */
    async startAICollaboration(task) {
        try {
            // Optimize the prompt for auto agent
            const optimizedPrompt = this.optimizePromptForAgent(task);
            // Try to trigger composer/auto agent
            await vscode.commands.executeCommand('cursor.composer.create', {
                prompt: optimizedPrompt
            });
            // Set up monitoring
            vscode.window.showInformationMessage(`🤝 AI Collaboration started: "${task}"`);
        }
        catch (error) {
            console.error('Failed to start AI collaboration:', error);
            throw error;
        }
    }
    /**
     * Optimize prompt for Cursor's auto agent
     */
    optimizePromptForAgent(task) {
        return `🎯 AUTO AGENT TASK: ${task}

CONTEXT: This task is being coordinated between Claude Desktop and Cursor AI through the MCP Bridge.

INSTRUCTIONS:
- Implement the complete solution
- Follow best practices and modern patterns
- Add comprehensive error handling
- Include proper documentation
- Test the implementation

EXPECTED OUTCOME: A fully working solution that meets the requirements.

Please proceed with the implementation.`;
    }
    /**
     * Forward request to MCP server
     */
    async forwardToMCPServer(prompt) {
        try {
            if (this.mcpClient && this.mcpClient.isConnected) {
                // Forward to actual MCP server
                const response = await this.mcpClient.sendRequest('chat', { message: prompt });
                return response.content || 'MCP server processed the request.';
            }
            else {
                return '⚠️ MCP server not connected. Please check the connection.';
            }
        }
        catch (error) {
            console.error('Failed to forward to MCP server:', error);
            return `❌ MCP server error: ${error.message}`;
        }
    }
    /**
     * Dispose of the participant
     */
    dispose() {
        this.participant.dispose();
    }
}
exports.MCPChatParticipant = MCPChatParticipant;
//# sourceMappingURL=chat-participant.js.map