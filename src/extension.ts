import * as vscode from 'vscode';
import WebSocket, { WebSocketServer } from 'ws';
import { MCPClient } from './mcp-client';
import { CursorAPI } from './cursor-api';
import { ExtensionCommand, ConnectionStatus } from './types';

let mcpClient: MCPClient;
let cursorAPI: CursorAPI;
let statusBarItem: vscode.StatusBarItem;
let wsServer: WebSocketServer;

export function activate(context: vscode.ExtensionContext) {
  console.log('Cursor MCP Bridge extension activated');
  
  try {
    // Initialize components
    mcpClient = new MCPClient();
    cursorAPI = new CursorAPI();
    
    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = '$(circle-outline) MCP Disconnected';
    statusBarItem.tooltip = 'MCP Bridge Status';
    statusBarItem.command = 'cursor-mcp-bridge.connect';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Setup WebSocket server for MCP communication
    setupWebSocketServer();

    // Register commands
    registerCommands(context);

    // Setup file change listeners
    setupFileWatchers(context);

    // Auto-connect to MCP server
    setTimeout(() => {
      connectToMCPServer();
    }, 1000);

    console.log('Cursor MCP Bridge extension setup complete');
  } catch (error) {
    console.error('Error activating extension:', error);
    vscode.window.showErrorMessage(`Failed to activate MCP Bridge: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function deactivate() {
  console.log('Cursor MCP Bridge extension deactivated');
  
  try {
    if (mcpClient) {
      mcpClient.disconnect();
    }
    
    if (wsServer) {
      wsServer.close();
    }
    
    if (statusBarItem) {
      statusBarItem.dispose();
    }
  } catch (error) {
    console.error('Error deactivating extension:', error);
  }
}

function setupWebSocketServer() {
  try {
    console.log('Setting up WebSocket server on port 3057');
    
    wsServer = new WebSocketServer({ port: 3057 });
    
    wsServer.on('connection', (ws: WebSocket) => {
      console.log('WebSocket client connected');
      
      ws.on('message', async (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log('Received WebSocket message:', message);
          
          const response = await handleWebSocketMessage(message);
          ws.send(JSON.stringify(response));
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
          ws.send(JSON.stringify({
            id: null,
            error: {
              code: -32603,
              message: `Internal error: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          }));
        }
      });
      
      ws.on('close', () => {
        console.log('WebSocket client disconnected');
      });
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
    
    wsServer.on('error', (error) => {
      console.error('WebSocket server error:', error);
      vscode.window.showErrorMessage(`WebSocket server error: ${error.message}`);
    });
    
    console.log('WebSocket server listening on port 3057');
  } catch (error) {
    console.error('Error setting up WebSocket server:', error);
    vscode.window.showErrorMessage(`Failed to setup WebSocket server: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function handleWebSocketMessage(message: any): Promise<any> {
  const { method, params, id } = message;
  
  try {
    let result: any;
    
    switch (method) {
      case 'open_file':
        await cursorAPI.openFileAtLine(params.filepath, params.line);
        result = { success: true, message: 'File opened successfully' };
        break;
        
      case 'execute_command':
        const output = await cursorAPI.executeCommand(params.command);
        result = { success: true, output };
        break;
        
      case 'get_workspace_files':
        const files = await cursorAPI.getWorkspaceFiles();
        result = { success: true, files };
        break;
        
      case 'show_message':
        cursorAPI.showMessage(params.message);
        result = { success: true, message: 'Message shown' };
        break;
        
      case 'get_current_editor':
        const editor = cursorAPI.getCurrentEditor();
        result = { 
          success: true, 
          editor: editor ? {
            fileName: editor.document.fileName,
            languageId: editor.document.languageId,
            lineCount: editor.document.lineCount
          } : null 
        };
        break;
        
      default:
        throw new Error(`Unknown method: ${method}`);
    }
    
    return {
      jsonrpc: '2.0',
      result,
      id
    };
  } catch (error) {
    return {
      jsonrpc: '2.0',
      error: {
        code: -32601,
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      id
    };
  }
}

function registerCommands(context: vscode.ExtensionContext) {
  console.log('Registering extension commands');
  
  const commands: ExtensionCommand[] = [
    {
      name: 'cursor-mcp-bridge.connect',
      handler: connectToMCPServer
    },
    {
      name: 'cursor-mcp-bridge.disconnect',
      handler: disconnectFromMCPServer
    },
    {
      name: 'cursor-mcp-bridge.status',
      handler: showStatus
    },
    {
      name: 'cursor-mcp-bridge.openFile',
      handler: (filepath: string, line?: number) => cursorAPI.openFileAtLine(filepath, line)
    },
    {
      name: 'cursor-mcp-bridge.getFiles',
      handler: () => cursorAPI.getWorkspaceFiles()
    }
  ];
  
  for (const command of commands) {
    const disposable = vscode.commands.registerCommand(command.name, command.handler);
    context.subscriptions.push(disposable);
  }
  
  console.log(`Registered ${commands.length} commands`);
}

function setupFileWatchers(context: vscode.ExtensionContext) {
  console.log('Setting up file watchers');
  
  try {
    // Watch for file changes
    const fileWatcher = vscode.workspace.createFileSystemWatcher('**/*');
    
    fileWatcher.onDidChange((uri) => {
      console.log(`File changed: ${uri.fsPath}`);
      // Could notify MCP server of file changes
    });
    
    fileWatcher.onDidCreate((uri) => {
      console.log(`File created: ${uri.fsPath}`);
    });
    
    fileWatcher.onDidDelete((uri) => {
      console.log(`File deleted: ${uri.fsPath}`);
    });
    
    context.subscriptions.push(fileWatcher);
    
    // Watch for active editor changes
    const editorWatcher = vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        console.log(`Active editor changed: ${editor.document.fileName}`);
      }
    });
    
    context.subscriptions.push(editorWatcher);
  } catch (error) {
    console.error('Error setting up file watchers:', error);
  }
}

async function connectToMCPServer() {
  try {
    console.log('Connecting to MCP server...');
    statusBarItem.text = '$(loading~spin) Connecting...';
    
    await mcpClient.connect(3056); // Default MCP server port
    
    statusBarItem.text = '$(check) MCP Connected';
    statusBarItem.tooltip = 'Connected to MCP Server';
    cursorAPI.showMessage('Connected to MCP Server');
    
    console.log('Connected to MCP server');
  } catch (error) {
    console.error('Failed to connect to MCP server:', error);
    statusBarItem.text = '$(error) MCP Error';
    statusBarItem.tooltip = `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    vscode.window.showErrorMessage(`Failed to connect to MCP server: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function disconnectFromMCPServer() {
  try {
    console.log('Disconnecting from MCP server...');
    mcpClient.disconnect();
    
    statusBarItem.text = '$(circle-outline) MCP Disconnected';
    statusBarItem.tooltip = 'Disconnected from MCP Server';
    cursorAPI.showMessage('Disconnected from MCP Server');
    
    console.log('Disconnected from MCP server');
  } catch (error) {
    console.error('Error disconnecting from MCP server:', error);
  }
}

async function showStatus() {
  try {
    const status = mcpClient.getConnectionStatus();
    const message = `MCP Bridge Status:
Connected: ${status.connected}
Port: ${status.port}
Last Connected: ${status.lastConnected?.toLocaleString() || 'Never'}
Reconnect Attempts: ${status.reconnectAttempts}`;
    
    vscode.window.showInformationMessage(message);
  } catch (error) {
    console.error('Error showing status:', error);
    vscode.window.showErrorMessage('Failed to get status');
  }
} 