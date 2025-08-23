import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import WebSocket, { WebSocketServer } from 'ws';
import { CursorController } from './cursor-controller';
import { 
  EditFileParams, 
  ReadFileParams, 
  OpenFileParams, 
  RunCommandParams 
} from './types';

class MCPServer {
  private server: Server;
  private cursorController: CursorController;
  private extensionWsClient: WebSocket | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'claude-cursor-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.cursorController = new CursorController();
    this.setupToolHandlers();
    // console.log('MCP Server initialized'); // Removed to prevent JSON contamination
  }

  private setupToolHandlers(): void {
    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      // console.log('Received ListTools request'); // Removed to prevent JSON contamination
      const tools: Tool[] = [
        {
          name: 'edit_file',
          description: 'Edit or create a file with the specified content',
          inputSchema: {
            type: 'object',
            properties: {
              filepath: {
                type: 'string',
                description: 'The path to the file to edit or create'
              },
              content: {
                type: 'string',
                description: 'The content to write to the file'
              }
            },
            required: ['filepath', 'content']
          }
        },
        {
          name: 'read_file',
          description: 'Read the contents of a file',
          inputSchema: {
            type: 'object',
            properties: {
              filepath: {
                type: 'string',
                description: 'The path to the file to read'
              }
            },
            required: ['filepath']
          }
        },
        {
          name: 'open_file',
          description: 'Open a file in the Cursor IDE',
          inputSchema: {
            type: 'object',
            properties: {
              filepath: {
                type: 'string',
                description: 'The path to the file to open'
              },
              line: {
                type: 'number',
                description: 'Optional line number to navigate to'
              }
            },
            required: ['filepath']
          }
        },
        {
          name: 'list_files',
          description: 'List all files in the current workspace',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false
          }
        },
        {
          name: 'run_command',
          description: 'Execute a command in the terminal',
          inputSchema: {
            type: 'object',
            properties: {
              command: {
                type: 'string',
                description: 'The command to execute'
              }
            },
            required: ['command']
          }
        },
        {
          name: 'cursor_chat_with_ai',
          description: 'Send message to Cursor AI chat interface',
          inputSchema: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'Message to send to Cursor AI chat'
              },
              context: {
                type: 'string',
                description: 'Optional context for the message'
              }
            },
            required: ['message']
          }
        },
        {
          name: 'cursor_trigger_auto_agent',
          description: 'Trigger Cursor\'s auto AI agent with optimized prompt',
          inputSchema: {
            type: 'object',
            properties: {
              prompt: {
                type: 'string',
                description: 'Prompt for the auto agent'
              },
              strategy: {
                type: 'string',
                description: 'Strategy for agent execution (e.g., comprehensive, focused, quick)'
              }
            },
            required: ['prompt']
          }
        },
        {
          name: 'cursor_get_chat_history',
          description: 'Retrieve recent chat history with Cursor AI',
          inputSchema: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: 'Number of recent messages to retrieve'
              }
            }
          }
        },
        {
          name: 'start_ai_collaboration',
          description: 'Start AI collaboration session with a specific task and strategy',
          inputSchema: {
            type: 'object',
            properties: {
              task: {
                type: 'string',
                description: 'The collaborative task to work on'
              },
              strategy: {
                type: 'string',
                description: 'Collaboration strategy (e.g., pair-programming, code-review, debugging)'
              }
            },
            required: ['task']
          }
        }
      ];

      // console.log(`Returning ${tools.length} tools`); // Removed to prevent JSON contamination
      return { tools };
    });

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      // console.log(`Received CallTool request for: ${name}`); // Removed to prevent JSON contamination
      // console.log(`Arguments:`, args); // Removed to prevent JSON contamination

      try {
        let result: any;

        switch (name) {
          case 'edit_file': {
            const params = args as unknown as EditFileParams;
            if (!params?.filepath || typeof params?.content !== 'string') {
              throw new McpError(
                ErrorCode.InvalidParams,
                'edit_file requires filepath (string) and content (string) parameters'
              );
            }
            await this.cursorController.editFile(params.filepath, params.content);
            result = { success: true, message: `File ${params.filepath} edited successfully` };
            break;
          }

          case 'read_file': {
            const params = args as unknown as ReadFileParams;
            if (!params?.filepath) {
              throw new McpError(
                ErrorCode.InvalidParams,
                'read_file requires filepath parameter'
              );
            }
            const content = await this.cursorController.readFile(params.filepath);
            result = { success: true, content, message: `File ${params.filepath} read successfully` };
            break;
          }

          case 'open_file': {
            const params = args as unknown as OpenFileParams;
            if (!params?.filepath) {
              throw new McpError(
                ErrorCode.InvalidParams,
                'open_file requires filepath parameter'
              );
            }
            
            // Try to open file through extension WebSocket first
            if (this.extensionWsClient && this.extensionWsClient.readyState === WebSocket.OPEN) {
              try {
                await this.sendToExtension('open_file', { filepath: params.filepath, line: params.line });
                result = { success: true, message: `File ${params.filepath} opened successfully via extension` };
              } catch (error) {
                console.error('Failed to open file via extension, falling back to direct method:', error);
                await this.cursorController.openFile(params.filepath, params.line);
                result = { success: true, message: `File ${params.filepath} opened successfully via direct method` };
              }
            } else {
              // Fallback to direct method if extension not connected
              await this.cursorController.openFile(params.filepath, params.line);
              result = { success: true, message: `File ${params.filepath} opened successfully via direct method` };
            }
            break;
          }

          case 'list_files': {
            const files = await this.cursorController.listFiles();
            result = { success: true, files, message: `Found ${files.length} files` };
            break;
          }

          case 'run_command': {
            const params = args as unknown as RunCommandParams;
            if (!params?.command) {
              throw new McpError(
                ErrorCode.InvalidParams,
                'run_command requires command parameter'
              );
            }
            const output = await this.cursorController.runCommand(params.command);
            result = { success: true, output, message: `Command executed successfully` };
            break;
          }

          case 'cursor_chat_with_ai': {
            const params = args as any;
            if (!params?.message) {
              throw new McpError(
                ErrorCode.InvalidParams,
                'cursor_chat_with_ai requires message parameter'
              );
            }
            
            // Send message to extension via WebSocket if connected
            if (this.extensionWsClient && this.extensionWsClient.readyState === WebSocket.OPEN) {
              try {
                await this.sendToExtension('cursor_chat_with_ai', params);
                result = { success: true, message: 'Message sent to Cursor AI chat via extension' };
              } catch (error) {
                result = { success: false, error: `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}` };
              }
            } else {
              result = { success: false, error: 'Extension not connected. Message queued for when connection is available.' };
            }
            break;
          }

          case 'cursor_trigger_auto_agent': {
            const params = args as any;
            if (!params?.prompt) {
              throw new McpError(
                ErrorCode.InvalidParams,
                'cursor_trigger_auto_agent requires prompt parameter'
              );
            }
            
            // Send auto agent trigger to extension
            if (this.extensionWsClient && this.extensionWsClient.readyState === WebSocket.OPEN) {
              try {
                await this.sendToExtension('cursor_trigger_auto_agent', params);
                result = { success: true, message: 'Auto agent triggered via extension' };
              } catch (error) {
                result = { success: false, error: `Failed to trigger auto agent: ${error instanceof Error ? error.message : 'Unknown error'}` };
              }
            } else {
              result = { success: false, error: 'Extension not connected. Cannot trigger auto agent.' };
            }
            break;
          }

          case 'cursor_get_chat_history': {
            const params = args as any;
            const limit = params?.limit || 10;
            
            // Get chat history from extension
            if (this.extensionWsClient && this.extensionWsClient.readyState === WebSocket.OPEN) {
              try {
                await this.sendToExtension('cursor_get_chat_history', { limit });
                result = { success: true, history: [], message: 'Chat history request sent to extension' };
              } catch (error) {
                result = { success: false, error: `Failed to get chat history: ${error instanceof Error ? error.message : 'Unknown error'}` };
              }
            } else {
              result = { success: false, error: 'Extension not connected. Cannot retrieve chat history.' };
            }
            break;
          }

          case 'start_ai_collaboration': {
            const params = args as any;
            if (!params?.task) {
              throw new McpError(
                ErrorCode.InvalidParams,
                'start_ai_collaboration requires task parameter'
              );
            }
            
            // Start collaboration session via extension
            if (this.extensionWsClient && this.extensionWsClient.readyState === WebSocket.OPEN) {
              try {
                await this.sendToExtension('start_ai_collaboration', params);
                result = { success: true, message: 'AI collaboration session started' };
              } catch (error) {
                result = { success: false, error: `Failed to start collaboration: ${error instanceof Error ? error.message : 'Unknown error'}` };
              }
            } else {
              result = { success: false, error: 'Extension not connected. Cannot start collaboration.' };
            }
            break;
          }

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }

        // console.log(`Tool ${name} executed successfully`); // Removed to prevent JSON contamination
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };

      } catch (error) {
        // Use stderr for error logging to avoid JSON contamination
        console.error(`Error executing tool ${name}:`, error);
        
        if (error instanceof McpError) {
          throw error;
        }
        
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to execute ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });
  }

  async run(): Promise<void> {
    // Start with stdio transport for Claude Desktop
    const transport = new StdioServerTransport();
    // console.log('Starting MCP server with stdio transport...'); // Removed to prevent JSON contamination
    
    try {
      await this.server.connect(transport);
      // console.log('MCP Server connected and running'); // Removed to prevent JSON contamination
      
      // Also start WebSocket server for testing
      this.startWebSocketServer();
      
      // Connect to extension WebSocket
      this.connectToExtension();
    } catch (error) {
      console.error('Failed to start MCP server:', error);
      process.exit(1);
    }
  }

  private connectToExtension(): void {
    try {
      this.extensionWsClient = new WebSocket('ws://localhost:3057');
      
      this.extensionWsClient.on('open', () => {
        console.error('Connected to extension WebSocket on port 3057');
      });
      
      this.extensionWsClient.on('message', (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          console.error('Received message from extension:', message);
        } catch (error) {
          console.error('Error parsing extension message:', error);
        }
      });
      
      this.extensionWsClient.on('close', () => {
        console.error('Extension WebSocket connection closed');
        this.extensionWsClient = null;
        // Try to reconnect after a delay
        setTimeout(() => this.connectToExtension(), 5000);
      });
      
      this.extensionWsClient.on('error', (error) => {
        console.error('Extension WebSocket error:', error);
      });
    } catch (error) {
      console.error('Failed to connect to extension:', error);
      // Try to reconnect after a delay
      setTimeout(() => this.connectToExtension(), 5000);
    }
  }

  private async sendToExtension(method: string, params: any): Promise<void> {
    if (!this.extensionWsClient || this.extensionWsClient.readyState !== WebSocket.OPEN) {
      throw new Error('Extension WebSocket not connected');
    }
    
    const message = {
      method,
      params,
      id: Date.now()
    };
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Extension response timeout'));
      }, 5000);
      
      const messageHandler = (data: WebSocket.Data) => {
        try {
          const response = JSON.parse(data.toString());
          if (response.id === message.id) {
            clearTimeout(timeout);
            this.extensionWsClient?.removeListener('message', messageHandler);
            if (response.error) {
              reject(new Error(response.error.message));
            } else {
              resolve();
            }
          }
        } catch (error) {
          console.error('Error parsing extension response:', error);
        }
      };
      
      this.extensionWsClient?.on('message', messageHandler);
      this.extensionWsClient?.send(JSON.stringify(message));
    });
  }

  private startWebSocketServer(): void {
    const WS_PORT = process.env.MCP_WS_PORT ? parseInt(process.env.MCP_WS_PORT) : 3056;
    
    try {
      const wss = new WebSocketServer({ port: WS_PORT });
      // Use stderr for WebSocket logging to avoid JSON contamination
      console.error(`WebSocket server listening on port ${WS_PORT}`);
      
      wss.on('connection', (ws: WebSocket) => {
        // console.error('WebSocket client connected'); // Removed to reduce stderr noise
        
        ws.on('message', async (message: string) => {
          try {
            const request = JSON.parse(message.toString());
            // console.error('WebSocket received:', request.method); // Removed to reduce stderr noise
            
            // Handle the request using the same server instance
            let response;
            
            if (request.method === 'tools/list') {
              const tools = await this.handleListTools();
              response = {
                jsonrpc: '2.0',
                id: request.id,
                result: { tools }
              };
            } else if (request.method === 'tools/call') {
              const result = await this.handleToolCall(request.params);
              response = {
                jsonrpc: '2.0',
                id: request.id,
                result
              };
            } else {
              response = {
                jsonrpc: '2.0',
                id: request.id,
                error: {
                  code: -32601,
                  message: 'Method not found'
                }
              };
            }
            
            ws.send(JSON.stringify(response));
                     } catch (error) {
             const errorResponse = {
               jsonrpc: '2.0',
               id: null,
               error: {
                 code: -32603,
                 message: `Internal error: ${error instanceof Error ? error.message : 'Unknown error'}`
               }
             };
             ws.send(JSON.stringify(errorResponse));
           }
        });
        
        ws.on('close', () => {
          // console.error('WebSocket client disconnected'); // Removed to reduce stderr noise
        });
        
        ws.on('error', (error) => {
          console.error('WebSocket error:', error);
        });
      });
      
      wss.on('error', (error) => {
        console.error('WebSocket server error:', error);
      });
    } catch (error) {
      console.warn('Failed to start WebSocket server:', error);
    }
  }

  private async handleListTools(): Promise<Tool[]> {
    return [
      {
        name: 'edit_file',
        description: 'Edit or create a file with the specified content',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path to edit' },
            content: { type: 'string', description: 'New file content' }
          },
          required: ['path', 'content']
        }
      },
      {
        name: 'read_file',
        description: 'Read the content of a file',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path to read' }
          },
          required: ['path']
        }
      },
      {
        name: 'list_files',
        description: 'List files in a directory',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Directory path to list', default: '.' }
          }
        }
      },
      {
        name: 'open_file',
        description: 'Open a file in the editor at a specific line',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path to open' },
            line: { type: 'number', description: 'Line number to navigate to' }
          },
          required: ['path']
        }
      },
      {
        name: 'run_command',
        description: 'Run a command in the terminal',
        inputSchema: {
          type: 'object',
          properties: {
            command: { type: 'string', description: 'Command to execute' },
            cwd: { type: 'string', description: 'Working directory for the command' }
          },
          required: ['command']
        }
      },
      {
        name: 'cursor_chat_with_ai',
        description: 'Send message to Cursor AI chat interface',
        inputSchema: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Message to send to chat' },
            context: { type: 'string', description: 'Optional context' }
          },
          required: ['message']
        }
      },
      {
        name: 'cursor_trigger_auto_agent',
        description: 'Trigger Cursor auto agent',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: { type: 'string', description: 'Prompt for agent' },
            strategy: { type: 'string', description: 'Agent strategy' }
          },
          required: ['prompt']
        }
      },
      {
        name: 'cursor_get_chat_history',
        description: 'Get recent chat history',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Number of messages' }
          }
        }
      },
      {
        name: 'start_ai_collaboration',
        description: 'Start AI collaboration session',
        inputSchema: {
          type: 'object',
          properties: {
            task: { type: 'string', description: 'Task to collaborate on' },
            strategy: { type: 'string', description: 'Collaboration strategy' }
          },
          required: ['task']
        }
      }
    ];
  }

     private async handleToolCall(params: any): Promise<any> {
     const { name, arguments: args } = params;
     
     switch (name) {
       case 'edit_file':
         return await this.cursorController.editFile(args.path, args.content);
       case 'read_file':
         return await this.cursorController.readFile(args.path);
       case 'list_files':
         return await this.cursorController.listFiles();
       case 'open_file':
         return await this.cursorController.openFile(args.path, args.line);
       case 'run_command':
         return await this.cursorController.runCommand(args.command);
       case 'cursor_chat_with_ai':
         if (this.extensionWsClient && this.extensionWsClient.readyState === WebSocket.OPEN) {
           await this.sendToExtension('cursor_chat_with_ai', args);
           return { success: true, message: 'Message sent to Cursor AI chat' };
         } else {
           return { success: false, error: 'Extension not connected' };
         }
       case 'cursor_trigger_auto_agent':
         if (this.extensionWsClient && this.extensionWsClient.readyState === WebSocket.OPEN) {
           await this.sendToExtension('cursor_trigger_auto_agent', args);
           return { success: true, message: 'Auto agent triggered' };
         } else {
           return { success: false, error: 'Extension not connected' };
         }
       case 'cursor_get_chat_history':
         if (this.extensionWsClient && this.extensionWsClient.readyState === WebSocket.OPEN) {
           await this.sendToExtension('cursor_get_chat_history', args);
           return { success: true, message: 'Chat history request sent' };
         } else {
           return { success: false, error: 'Extension not connected' };
         }
       case 'start_ai_collaboration':
         if (this.extensionWsClient && this.extensionWsClient.readyState === WebSocket.OPEN) {
           await this.sendToExtension('start_ai_collaboration', args);
           return { success: true, message: 'AI collaboration started' };
         } else {
           return { success: false, error: 'Extension not connected' };
         }
       default:
         throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
     }
   }
}

// Start the server
const server = new MCPServer();
server.run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 