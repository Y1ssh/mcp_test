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
exports.MCP_LANGUAGE_MODEL_TOOLS = exports.MCPLanguageModelTool = void 0;
exports.registerLanguageModelTools = registerLanguageModelTools;
const vscode = __importStar(require("vscode"));
/**
 * MCP Language Model Tool - Enables Cursor AI agent mode to interact with MCP servers
 * This provides the missing link for sophisticated AI-to-AI collaboration
 */
class MCPLanguageModelTool {
    mcpClient;
    toolName;
    constructor(mcpClient, toolName) {
        this.mcpClient = mcpClient;
        this.toolName = toolName;
    }
    async invoke(options, token) {
        try {
            const parameters = options.input;
            // Route to appropriate MCP tool based on tool name
            let result;
            switch (this.toolName) {
                case 'mcp_query':
                    result = await this.handleMCPQuery(parameters);
                    break;
                case 'mcp_file_operation':
                    result = await this.handleFileOperation(parameters);
                    break;
                case 'mcp_auto_agent':
                    result = await this.handleAutoAgent(parameters);
                    break;
                case 'mcp_collaboration':
                    result = await this.handleCollaboration(parameters);
                    break;
                default:
                    result = await this.handleGenericMCP(parameters);
                    break;
            }
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(JSON.stringify(result, null, 2))
            ]);
        }
        catch (error) {
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`Error: ${error.message}`)
            ]);
        }
    }
    /**
     * Handle MCP query operations
     */
    async handleMCPQuery(parameters) {
        const { query, context } = parameters;
        if (!this.mcpClient?.isConnected) {
            throw new Error('MCP client not connected');
        }
        // Send query to MCP server
        const response = await this.mcpClient.sendRequest('query', {
            query,
            context,
            timestamp: new Date().toISOString()
        });
        return {
            success: true,
            result: response,
            source: 'mcp_server'
        };
    }
    /**
     * Handle file operations through MCP
     */
    async handleFileOperation(parameters) {
        const { operation, path, content, options } = parameters;
        if (!this.mcpClient?.isConnected) {
            throw new Error('MCP client not connected');
        }
        // Execute file operation through MCP server
        const response = await this.mcpClient.sendRequest('file_operation', {
            operation,
            path,
            content,
            options
        });
        return {
            success: true,
            operation,
            result: response,
            source: 'mcp_server'
        };
    }
    /**
     * Handle auto agent coordination
     */
    async handleAutoAgent(parameters) {
        const { prompt, strategy, context } = parameters;
        // Optimize prompt for Cursor's auto agent
        const optimizedPrompt = this.optimizeForAutoAgent(prompt, strategy);
        // Trigger auto agent
        try {
            await vscode.commands.executeCommand('cursor.composer.create', {
                prompt: optimizedPrompt
            });
            return {
                success: true,
                action: 'auto_agent_triggered',
                prompt: optimizedPrompt,
                strategy
            };
        }
        catch (error) {
            // Fallback: clipboard approach
            await vscode.env.clipboard.writeText(optimizedPrompt);
            return {
                success: true,
                action: 'prompt_prepared',
                message: 'Prompt copied to clipboard. Please paste in Cursor Composer.',
                prompt: optimizedPrompt
            };
        }
    }
    /**
     * Handle AI collaboration coordination
     */
    async handleCollaboration(parameters) {
        const { task, participants, strategy } = parameters;
        // Set up collaboration session
        const collaborationId = this.generateCollaborationId();
        // Notify participants
        const notification = `🤝 AI Collaboration Session Started
Task: ${task}
ID: ${collaborationId}
Strategy: ${strategy || 'adaptive'}`;
        vscode.window.showInformationMessage(notification);
        // Log collaboration start
        console.log('AI Collaboration started:', {
            id: collaborationId,
            task,
            participants,
            strategy,
            timestamp: new Date().toISOString()
        });
        return {
            success: true,
            collaborationId,
            task,
            participants,
            strategy,
            status: 'active'
        };
    }
    /**
     * Handle generic MCP operations
     */
    async handleGenericMCP(parameters) {
        if (!this.mcpClient?.isConnected) {
            throw new Error('MCP client not connected');
        }
        // Forward generic request to MCP server
        const response = await this.mcpClient.sendRequest('generic', parameters);
        return {
            success: true,
            result: response,
            parameters,
            source: 'mcp_server'
        };
    }
    /**
     * Optimize prompt for Cursor's auto agent
     */
    optimizeForAutoAgent(prompt, strategy) {
        const strategyInstructions = this.getStrategyInstructions(strategy);
        return `🎯 CURSOR AUTO AGENT TASK

ORIGINAL REQUEST: ${prompt}

${strategyInstructions}

EXECUTION GUIDELINES:
- Implement complete, production-ready solution
- Follow modern best practices and patterns
- Add comprehensive error handling
- Include proper documentation and comments
- Ensure code is testable and maintainable
- Consider edge cases and performance
- Provide clear implementation steps

EXPECTED OUTCOME: Fully functional implementation ready for use.

Please proceed with the implementation now.`;
    }
    /**
     * Get strategy-specific instructions
     */
    getStrategyInstructions(strategy) {
        switch (strategy) {
            case 'rapid_prototype':
                return `STRATEGY: Rapid Prototyping
- Focus on core functionality first
- Use simple, direct approaches
- Prioritize working solution over perfection
- Add TODOs for future enhancements`;
            case 'production_ready':
                return `STRATEGY: Production Ready
- Implement robust error handling
- Add comprehensive logging
- Include security considerations
- Optimize for performance and scalability`;
            case 'collaborative':
                return `STRATEGY: Collaborative Development
- Break down into clear, modular components
- Document interfaces and APIs
- Consider team development workflows
- Enable easy testing and debugging`;
            default:
                return `STRATEGY: Adaptive Approach
- Analyze requirements and choose appropriate patterns
- Balance speed and quality based on context
- Implement incrementally with clear milestones`;
        }
    }
    /**
     * Generate unique collaboration ID
     */
    generateCollaborationId() {
        return `collab_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }
}
exports.MCPLanguageModelTool = MCPLanguageModelTool;
/**
 * Register all MCP Language Model Tools
 */
function registerLanguageModelTools(mcpClient) {
    const disposables = [];
    try {
        // Register MCP query tool
        const queryTool = vscode.lm.registerTool('mcp_query', new MCPLanguageModelTool(mcpClient, 'mcp_query'));
        disposables.push(queryTool);
        // Register file operation tool
        const fileTool = vscode.lm.registerTool('mcp_file_operation', new MCPLanguageModelTool(mcpClient, 'mcp_file_operation'));
        disposables.push(fileTool);
        // Register auto agent tool
        const agentTool = vscode.lm.registerTool('mcp_auto_agent', new MCPLanguageModelTool(mcpClient, 'mcp_auto_agent'));
        disposables.push(agentTool);
        // Register collaboration tool
        const collabTool = vscode.lm.registerTool('mcp_collaboration', new MCPLanguageModelTool(mcpClient, 'mcp_collaboration'));
        disposables.push(collabTool);
        console.log('✅ MCP Language Model Tools registered successfully');
        vscode.window.showInformationMessage('🔧 MCP Language Model Tools activated for agent mode');
    }
    catch (error) {
        console.error('Failed to register language model tools:', error);
        vscode.window.showErrorMessage(`Failed to register MCP tools: ${error.message}`);
    }
    return disposables;
}
/**
 * Tool definitions for MCP server registration
 */
exports.MCP_LANGUAGE_MODEL_TOOLS = [
    {
        name: 'mcp_query',
        description: 'Query MCP server for information and execute operations',
        inputSchema: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Query to execute' },
                context: { type: 'string', description: 'Additional context' }
            },
            required: ['query']
        }
    },
    {
        name: 'mcp_file_operation',
        description: 'Perform file operations through MCP server',
        inputSchema: {
            type: 'object',
            properties: {
                operation: { type: 'string', enum: ['read', 'write', 'create', 'delete'] },
                path: { type: 'string', description: 'File path' },
                content: { type: 'string', description: 'File content for write operations' },
                options: { type: 'object', description: 'Additional options' }
            },
            required: ['operation', 'path']
        }
    },
    {
        name: 'mcp_auto_agent',
        description: 'Trigger and coordinate Cursor auto agent functionality',
        inputSchema: {
            type: 'object',
            properties: {
                prompt: { type: 'string', description: 'Task prompt for auto agent' },
                strategy: { type: 'string', enum: ['rapid_prototype', 'production_ready', 'collaborative'] },
                context: { type: 'string', description: 'Additional context' }
            },
            required: ['prompt']
        }
    },
    {
        name: 'mcp_collaboration',
        description: 'Start and manage AI collaboration sessions',
        inputSchema: {
            type: 'object',
            properties: {
                task: { type: 'string', description: 'Collaboration task description' },
                participants: { type: 'array', items: { type: 'string' } },
                strategy: { type: 'string', description: 'Collaboration strategy' }
            },
            required: ['task']
        }
    }
];
//# sourceMappingURL=language-model-tools.js.map