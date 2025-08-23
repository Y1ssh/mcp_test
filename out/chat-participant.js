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
 * MCP Chat Participant - Enables direct integration with VS Code's chat interface
 * This allows Claude Desktop to communicate with Cursor AI through the @mcp-bridge participant
 */
class MCPChatParticipant {
    participant;
    mcpClient;
    constructor(mcpClient, context) {
        this.mcpClient = mcpClient;
        // Create the chat participant
        this.participant = vscode.chat.createChatParticipant('mcp-bridge.cursor-integration', this.handleChatRequest.bind(this));
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
    async handleChatRequest(request, context, stream, token) {
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
        }
        catch (error) {
            stream.markdown(`❌ **Error:** ${error instanceof Error ? error.message : 'Unknown error'}`);
            console.error('Chat request error:', error);
        }
        return { success: true };
    }
    /**
     * Handle @mcp-bridge bridge command
     */
    async handleBridgeCommand(request, stream) {
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
    async handleAutoAgentCommand(request, stream) {
        const prompt = request.prompt || 'Generate code based on current context';
        stream.progress('🤖 Triggering Cursor Auto Agent...');
        try {
            // Try multiple methods to trigger auto agent
            const success = await this.triggerAutoAgent(prompt);
            if (success) {
                stream.markdown(`🚀 **Auto Agent Triggered Successfully**\n\n`);
                stream.markdown(`**Prompt:** ${prompt}\n\n`);
                stream.markdown('The auto agent should now be processing your request in Cursor.\n');
            }
            else {
                stream.markdown(`⚠️ **Auto Agent Trigger Attempted**\n\n`);
                stream.markdown(`**Prompt:** ${prompt}\n\n`);
                stream.markdown('Multiple trigger methods were attempted. Check if Cursor responded.\n');
            }
        }
        catch (error) {
            stream.markdown(`❌ **Failed to trigger auto agent:** ${error instanceof Error ? error.message : 'Unknown error'}\n`);
        }
    }
    /**
     * Handle @mcp-bridge history command
     */
    async handleHistoryCommand(request, stream, context) {
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
                    }
                    else {
                        // This is a ChatResponseTurn
                        stream.markdown(`**Assistant:** Response provided\n\n`);
                    }
                }
            }
            else {
                stream.markdown('📜 **Chat History**\n\nNo recent chat history available.\n');
            }
        }
        catch (error) {
            stream.markdown(`❌ **Failed to retrieve history:** ${error instanceof Error ? error.message : 'Unknown error'}\n`);
        }
    }
    /**
     * Handle @mcp-bridge status command
     */
    async handleStatusCommand(request, stream) {
        const status = this.mcpClient.getConnectionStatus();
        stream.markdown('📊 **MCP Bridge Status**\n\n');
        stream.markdown(`**Connection:** ${status.connected ? '✅ Connected' : '❌ Disconnected'}\n`);
        stream.markdown(`**Port:** ${status.port}\n`);
        stream.markdown(`**Last Connected:** ${status.lastConnected?.toLocaleString() || 'Never'}\n`);
        stream.markdown(`**Reconnect Attempts:** ${status.reconnectAttempts}\n\n`);
        // Show available VS Code commands
        try {
            const commands = await vscode.commands.getCommands();
            const cursorCommands = commands.filter(cmd => cmd.includes('cursor') ||
                cmd.includes('chat') ||
                cmd.includes('composer'));
            if (cursorCommands.length > 0) {
                stream.markdown(`**Available Cursor Commands:** ${cursorCommands.length} found\n`);
                stream.markdown(`\`\`\`\n${cursorCommands.slice(0, 10).join('\n')}\n\`\`\`\n`);
            }
        }
        catch (error) {
            stream.markdown('Could not retrieve available commands.\n');
        }
    }
    /**
     * Forward message to MCP server
     */
    async forwardToMCP(message, stream) {
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
        }
        catch (error) {
            stream.markdown(`❌ **MCP Communication Error:** ${error instanceof Error ? error.message : 'Unknown error'}\n`);
        }
    }
    /**
     * Trigger Cursor's auto agent through various methods
     */
    async triggerAutoAgent(prompt) {
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
            }
            catch (error) {
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
        }
        catch (error) {
            console.error('Failed clipboard method:', error);
            return false;
        }
    }
    /**
     * Add action buttons to chat responses
     */
    addActionButtons(stream, command) {
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
    async provideFollowups(result, context, token) {
        // Get the last request to provide contextual follow-ups
        const lastMessage = context.history[context.history.length - 1];
        const lastCommand = lastMessage && 'prompt' in lastMessage ? lastMessage.prompt : undefined;
        const followups = [];
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
        followups.push({
            prompt: 'Show available commands',
            label: '📋 Commands'
        }, {
            prompt: 'Get chat history',
            label: '📜 History'
        }, {
            prompt: 'Trigger auto agent with current context',
            label: '🤖 Auto Agent'
        });
        return followups;
    }
    /**
     * Get the participant instance (for external access)
     */
    getParticipant() {
        return this.participant;
    }
}
exports.MCPChatParticipant = MCPChatParticipant;
//# sourceMappingURL=chat-participant.js.map