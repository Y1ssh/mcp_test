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
            await this.cursorController.openFile(params.filepath, params.line);
            result = { success: true, message: `File ${params.filepath} opened successfully` };
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
    } catch (error) {
      console.error('Failed to start MCP server:', error);
      process.exit(1);
    }
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