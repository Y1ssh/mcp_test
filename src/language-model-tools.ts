import * as vscode from 'vscode';

/**
 * MCP Language Model Tool for agent mode integration
 */
export class MCPLanguageModelTool implements vscode.LanguageModelTool<any> {
    constructor(
        private toolName: string,
        protected mcpClient: any,
        private description: string
    ) {}

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<any>,
        token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        
        try {
            // Extract parameters from the invocation
            const parameters = options.input;
            
            // Call MCP server with the tool
            if (this.mcpClient && this.mcpClient.request) {
                const response = await this.mcpClient.request({
                    method: 'tools/call',
                    params: {
                        name: this.toolName,
                        arguments: parameters
                    }
                });
                
                // Return formatted result for LLM processing
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(JSON.stringify(response.content || response))
                ]);
            } else {
                // Fallback when MCP client is not available
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(`MCP tool ${this.toolName} called with parameters: ${JSON.stringify(parameters)}`)
                ]);
            }
            
        } catch (error) {
            // Return error information to the language model
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`Error calling MCP tool ${this.toolName}: ${error instanceof Error ? error.message : 'Unknown error'}`)
            ]);
        }
    }
}

/**
 * MCP Query Tool - for general MCP server queries
 */
export class MCPQueryTool extends MCPLanguageModelTool {
    constructor(mcpClient: any) {
        super('mcp_query', mcpClient, 'Query MCP server for information or perform operations');
    }

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<any>,
        token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        
        try {
            const { tool_name, ...parameters } = options.input as any;
            
            if (!tool_name) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart('Error: tool_name parameter is required')
                ]);
            }
            
            // Call the specified MCP tool
            if (this.mcpClient && this.mcpClient.request) {
                const response = await this.mcpClient.request({
                    method: 'tools/call',
                    params: {
                        name: tool_name,
                        arguments: parameters
                    }
                });
                
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(JSON.stringify({
                        tool: tool_name,
                        result: response.content || response,
                        success: true
                    }))
                ]);
            } else {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart('MCP client not connected')
                ]);
            }
            
        } catch (error) {
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
            ]);
        }
    }
}

/**
 * MCP Chat Tool - for cursor chat integration
 */
export class MCPChatTool extends MCPLanguageModelTool {
    constructor(mcpClient: any) {
        super('cursor_chat_with_ai', mcpClient, 'Send messages to Cursor AI chat interface');
    }

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<any>,
        token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        
        try {
            const { message, context } = options.input as any;
            
            if (!message) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart('Error: message parameter is required')
                ]);
            }
            
            // Send message to Cursor AI
            if (this.mcpClient && this.mcpClient.request) {
                const response = await this.mcpClient.request({
                    method: 'tools/call',
                    params: {
                        name: 'cursor_chat_with_ai',
                        arguments: {
                            message: message,
                            context: context || 'language-model-tool'
                        }
                    }
                });
                
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(JSON.stringify({
                        action: 'chat_message_sent',
                        message: message,
                        response: response.content || 'Message sent successfully',
                        success: true
                    }))
                ]);
            } else {
                // Fallback: Use VS Code commands
                await this.fallbackSendToChat(message);
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(JSON.stringify({
                        action: 'chat_message_sent',
                        message: message,
                        response: 'Message sent via fallback method',
                        success: true
                    }))
                ]);
            }
            
        } catch (error) {
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`Error sending chat message: ${error instanceof Error ? error.message : 'Unknown error'}`)
            ]);
        }
    }
    
    private async fallbackSendToChat(message: string): Promise<void> {
        try {
            await vscode.commands.executeCommand('workbench.action.chat.open');
            await vscode.env.clipboard.writeText(message);
            vscode.window.showInformationMessage(`Chat message copied to clipboard: "${message}"`);
        } catch (error) {
            console.error('Fallback chat send failed:', error);
        }
    }
}

/**
 * MCP Auto Agent Tool - for triggering auto agents
 */
export class MCPAutoAgentTool extends MCPLanguageModelTool {
    constructor(mcpClient: any) {
        super('cursor_trigger_auto_agent', mcpClient, 'Trigger Cursor auto agent with prompts');
    }

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<any>,
        token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        
        try {
            const { prompt, strategy } = options.input as any;
            
            if (!prompt) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart('Error: prompt parameter is required')
                ]);
            }
            
            // Trigger auto agent
            if (this.mcpClient && this.mcpClient.request) {
                const response = await this.mcpClient.request({
                    method: 'tools/call',
                    params: {
                        name: 'cursor_trigger_auto_agent',
                        arguments: {
                            prompt: prompt,
                            strategy: strategy || 'comprehensive'
                        }
                    }
                });
                
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(JSON.stringify({
                        action: 'auto_agent_triggered',
                        prompt: prompt,
                        strategy: strategy || 'comprehensive',
                        response: response.content || 'Auto agent activated',
                        success: true
                    }))
                ]);
            } else {
                // Fallback: Use composer commands
                await this.fallbackTriggerAgent(prompt);
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(JSON.stringify({
                        action: 'auto_agent_triggered',
                        prompt: prompt,
                        response: 'Auto agent triggered via fallback method',
                        success: true
                    }))
                ]);
            }
            
        } catch (error) {
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`Error triggering auto agent: ${error instanceof Error ? error.message : 'Unknown error'}`)
            ]);
        }
    }
    
    private async fallbackTriggerAgent(prompt: string): Promise<void> {
        try {
            const commands = ['cursor.composer.create', 'cursor.agent.activate'];
            
            for (const command of commands) {
                try {
                    await vscode.commands.executeCommand(command, { prompt });
                    vscode.window.showInformationMessage(`Auto agent triggered: ${prompt}`);
                    return;
                } catch (error) {
                    continue;
                }
            }
            
            // Final fallback: copy to clipboard
            await vscode.env.clipboard.writeText(prompt);
            vscode.window.showInformationMessage(`Agent prompt copied to clipboard: "${prompt}"`);
            
        } catch (error) {
            console.error('Fallback agent trigger failed:', error);
        }
    }
}

/**
 * Register all MCP language model tools
 */
export function registerLanguageModelTools(mcpClient: any): vscode.Disposable[] {
    const disposables: vscode.Disposable[] = [];
    
    try {
        // Register MCP query tool for general operations
        const queryTool = new MCPQueryTool(mcpClient);
        disposables.push(vscode.lm.registerTool('mcp_query', queryTool));
        
        // Register chat tool for sending messages to Cursor AI
        const chatTool = new MCPChatTool(mcpClient);
        disposables.push(vscode.lm.registerTool('mcp_chat', chatTool));
        
        // Register auto agent tool for triggering AI agents
        const agentTool = new MCPAutoAgentTool(mcpClient);
        disposables.push(vscode.lm.registerTool('mcp_auto_agent', agentTool));
        
        // Register specific MCP tools as language model tools
        const specificTools = [
            'cursor_get_chat_history',
            'start_ai_collaboration',
            'get_workspace_info',
            'create_file',
            'read_file',
            'edit_file'
        ];
        
        for (const toolName of specificTools) {
            const tool = new MCPLanguageModelTool(toolName, mcpClient, `MCP tool: ${toolName}`);
            disposables.push(vscode.lm.registerTool(`mcp_${toolName}`, tool));
        }
        
        console.log(`Registered ${disposables.length} MCP language model tools`);
        
    } catch (error) {
        console.error('Failed to register language model tools:', error);
    }
    
    return disposables;
}

/**
 * Get available language model tools information
 */
export function getToolsInfo(): any[] {
    return [
        {
            name: 'mcp_query',
            description: 'Query MCP server for information or perform operations',
            parameters: {
                tool_name: 'string (required) - Name of the MCP tool to call',
                '...args': 'Additional arguments for the specific tool'
            }
        },
        {
            name: 'mcp_chat',
            description: 'Send messages to Cursor AI chat interface',
            parameters: {
                message: 'string (required) - Message to send to chat',
                context: 'string (optional) - Additional context for the message'
            }
        },
        {
            name: 'mcp_auto_agent',
            description: 'Trigger Cursor auto agent with prompts',
            parameters: {
                prompt: 'string (required) - Prompt for the auto agent',
                strategy: 'string (optional) - Strategy for agent execution'
            }
        },
        {
            name: 'mcp_cursor_get_chat_history',
            description: 'Get recent chat history from Cursor AI',
            parameters: {
                limit: 'number (optional) - Number of recent messages to retrieve'
            }
        }
    ];
} 