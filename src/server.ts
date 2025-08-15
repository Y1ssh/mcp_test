import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import { CursorController } from './cursor-controller.js';
import { 
  EditFileParams, 
  ReadFileParams, 
  OpenFileParams, 
  RunCommandParams 
} from './types.js';

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
    console.log('MCP Server initialized');
  }

  private setupToolHandlers(): void {
    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      console.log('Received ListTools request');
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

      console.log(`Returning ${tools.length} tools`);
      return { tools };
    });

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      console.log(`Received CallTool request for: ${name}`);
      console.log(`Arguments:`, args);

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

        console.log(`Tool ${name} executed successfully`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };

      } catch (error) {
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
    const transport = new StdioServerTransport();
    console.log('Starting MCP server with stdio transport...');
    
    try {
      await this.server.connect(transport);
      console.log('MCP Server connected and running');
    } catch (error) {
      console.error('Failed to start MCP server:', error);
      process.exit(1);
    }
  }
}

// Start the server
const server = new MCPServer();
server.run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 