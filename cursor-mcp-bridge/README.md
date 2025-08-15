# Cursor MCP Bridge Extension

A VS Code extension that bridges the Model Context Protocol (MCP) server with Cursor IDE, enabling seamless communication and control.

## Features

- **WebSocket Bridge**: Connects MCP server to Cursor IDE via WebSocket communication
- **File Operations**: Open files at specific lines, get workspace file lists
- **Command Execution**: Execute VS Code commands through MCP
- **Real-time Status**: Status bar indicator showing connection status
- **Auto-reconnection**: Automatic reconnection to MCP server on connection loss
- **File Watching**: Monitor file changes and editor state

## Installation

### Manual Installation

1. Clone the repository:
```bash
git clone https://github.com/Y1ssh/mcp_test.git
cd cursor-mcp-bridge
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

4. Package the extension (optional):
```bash
npx vsce package
```

5. Install in VS Code:
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X)
   - Click "..." menu and select "Install from VSIX..."
   - Select the generated .vsix file

### Development Mode

1. Open the project in VS Code
2. Press F5 to launch Extension Development Host
3. The extension will be active in the new VS Code window

## Usage

### Commands

Access these commands via Command Palette (Ctrl+Shift+P):

- `Cursor MCP Bridge: Connect` - Connect to MCP server
- `Cursor MCP Bridge: Disconnect` - Disconnect from MCP server  
- `Cursor MCP Bridge: Status` - Show connection status
- `Cursor MCP Bridge: Open File` - Open file at specific line
- `Cursor MCP Bridge: Get Files` - Get workspace file list

### Status Bar

The extension adds a status bar item showing:
- `$(circle-outline) MCP Disconnected` - Not connected
- `$(loading~spin) Connecting...` - Connecting to server
- `$(check) MCP Connected` - Successfully connected
- `$(error) MCP Error` - Connection error

Click the status bar item to connect/reconnect.

## WebSocket API

The extension runs a WebSocket server on port 3057 that accepts these methods:

### `open_file`
Open a file in the editor
```json
{
  "method": "open_file",
  "params": {
    "filepath": "src/example.ts",
    "line": 25
  }
}
```

### `execute_command`
Execute a VS Code command
```json
{
  "method": "execute_command",
  "params": {
    "command": "vscode.open"
  }
}
```

### `get_workspace_files`
Get list of all workspace files
```json
{
  "method": "get_workspace_files",
  "params": {}
}
```

### `show_message`
Show an information message
```json
{
  "method": "show_message",
  "params": {
    "message": "Hello from MCP!"
  }
}
```

### `get_current_editor`
Get information about the current active editor
```json
{
  "method": "get_current_editor",
  "params": {}
}
```

## Configuration

The extension connects to MCP server on port 3056 by default. This can be configured in the source code if needed.

WebSocket server runs on port 3057 for incoming MCP connections.

## Architecture

```
Claude Desktop ↔ MCP Server ↔ WebSocket ↔ VS Code Extension ↔ Cursor IDE
```

### Components

- **extension.ts**: Main extension entry point and activation
- **mcp-client.ts**: WebSocket client for MCP server communication
- **cursor-api.ts**: VS Code API wrapper for file and editor operations
- **types.ts**: TypeScript interfaces and type definitions

### File Structure

```
cursor-mcp-bridge/
├── package.json              # Extension manifest
├── tsconfig.json            # TypeScript configuration
├── src/
│   ├── extension.ts         # Main extension entry point
│   ├── mcp-client.ts        # WebSocket client
│   ├── cursor-api.ts        # VS Code API wrapper
│   └── types.ts            # Type definitions
└── README.md               # This file
```

## Development

### Building

```bash
npm run build
```

### Watching

```bash
npm run watch
```

### Testing

1. Open project in VS Code
2. Press F5 to launch Extension Development Host
3. Test functionality in the new window
4. View output in Developer Console (Help > Toggle Developer Tools)

## Integration with MCP Server

This extension works with the `claude-cursor-mcp-server` to provide a complete bridge between Claude Desktop and Cursor IDE.

1. Start the MCP server
2. Install and activate this extension
3. Extension automatically connects to MCP server
4. Claude Desktop can now control Cursor IDE through MCP

## Error Handling

- Connection failures are logged to VS Code output
- Automatic reconnection with exponential backoff
- User-friendly error messages in status bar
- Graceful degradation when services are unavailable

## Requirements

- VS Code 1.74.0 or higher
- Node.js 16+ for development
- WebSocket support
- Access to ports 3056 (MCP) and 3057 (WebSocket)

## License

MIT 