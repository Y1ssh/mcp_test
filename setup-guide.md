# Claude Desktop MCP Bridge Setup Guide

This guide will walk you through setting up the Claude Desktop MCP Bridge to control Cursor IDE directly from Claude Desktop.

## Overview

The Claude Desktop MCP Bridge consists of three components:
1. **MCP Server** - Handles communication between Claude Desktop and Cursor
2. **VS Code Extension** - Provides file operations and IDE control
3. **WebSocket Server** - Enables real-time communication

## Prerequisites

- Node.js 18+ installed
- VS Code or Cursor IDE
- Claude Desktop application
- Git (for cloning the repository)

## Installation Steps

### 1. Clone and Setup Project

```bash
git clone <repository-url>
cd mcp_test
npm install
```

### 2. Build the Project

```bash
# Build both server and extension
npm run build

# Or build individually
npm run build-server
npm run build-extension
```

### 3. Install VS Code Extension

#### Option A: Development Mode
1. Open VS Code/Cursor
2. Press `F5` to run the extension in development mode
3. A new Extension Development Host window will open

#### Option B: Package and Install
```bash
# Install vsce if not already installed
npm install -g vsce

# Package the extension
vsce package

# Install the generated .vsix file in VS Code
```

### 4. Configure Claude Desktop

#### Method 1: Automatic Configuration
Copy the provided `claude-desktop-config.json` to Claude Desktop's configuration directory:

**Windows:**
```bash
copy claude-desktop-config.json "%APPDATA%\Claude\claude_desktop_config.json"
```

**macOS:**
```bash
cp claude-desktop-config.json ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Linux:**
```bash
cp claude-desktop-config.json ~/.config/claude/claude_desktop_config.json
```

#### Method 2: Manual Configuration
Create or edit the Claude Desktop configuration file with the following content:

```json
{
  "mcpServers": {
    "cursor-bridge": {
      "command": "node",
      "args": ["./dist/server.js"],
      "env": {},
      "cwd": "/full/path/to/mcp_test"
    }
  }
}
```

**Important:** Replace `/full/path/to/mcp_test` with the absolute path to your project directory.

### 5. Port Configuration

The system uses two ports:
- **Port 3056**: VS Code Extension WebSocket server
- **Port 3057**: MCP Server WebSocket server

#### Verify Ports are Available
```bash
# Check if ports are in use (should return nothing if available)
netstat -an | findstr :3056
netstat -an | findstr :3057
```

#### Configure Firewall (if needed)
If you have firewall restrictions, allow inbound connections on ports 3056 and 3057.

## Testing the Setup

### 1. Start the MCP Server
```bash
npm run dev
```

You should see output similar to:
```
CursorController initialized with working directory: /path/to/mcp_test
MCP Server initialized
Starting MCP server with stdio transport...
WebSocket server listening on port 3057
MCP Server connected and running
```

### 2. Run Integration Tests
```bash
# Run all tests
npm run test

# Test just the server
npm run test-server

# Verify complete setup
npm run verify-setup
```

### 3. Test VS Code Extension
1. Open VS Code/Cursor
2. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. Look for "Cursor Controller" commands
4. Check the Output panel for extension logs

### 4. Test Claude Desktop Integration
1. Restart Claude Desktop after configuration
2. In a new conversation, try commands like:
   - "List the files in my project"
   - "Read the package.json file"
   - "Create a new file called test.js"

## Connection Testing Procedures

### Test MCP Server
```bash
# Start server and test basic functionality
npm run dev &
sleep 5
npm run test
```

### Test WebSocket Connection
Use a WebSocket client to test connection:
```javascript
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3057');

ws.on('open', () => {
    console.log('Connected to MCP server');
    ws.close();
});

ws.on('error', (error) => {
    console.error('Connection failed:', error);
});
```

### Test MCP Protocol
Send a test MCP request:
```json
{
  "jsonrpc": "2.0",
  "id": "test-1",
  "method": "tools/list",
  "params": {}
}
```

## Troubleshooting Common Issues

### Issue: Server Won't Start
**Symptoms:** Error when running `npm run dev`

**Solutions:**
1. Check if build artifacts exist: `ls -la dist/`
2. Rebuild the server: `npm run build-server`
3. Check Node.js version: `node --version` (should be 18+)
4. Check for port conflicts: Use different ports in configuration

### Issue: Claude Desktop Can't Connect
**Symptoms:** Claude Desktop shows MCP server as unavailable

**Solutions:**
1. Verify configuration file path and content
2. Check that the `cwd` path in config is absolute and correct
3. Ensure MCP server is running: `npm run dev`
4. Check Claude Desktop logs for detailed error messages
5. Restart Claude Desktop after configuration changes

### Issue: VS Code Extension Not Loading
**Symptoms:** Extension commands not available

**Solutions:**
1. Check VS Code Extensions panel for errors
2. Look at Output panel > "Cursor Controller" for logs
3. Reload VS Code window: `Ctrl+Shift+P` > "Developer: Reload Window"
4. Check if extension is properly packaged: `npm run build-extension`

### Issue: WebSocket Connection Fails
**Symptoms:** Connection timeout or refused errors

**Solutions:**
1. Check if ports 3056/3057 are available
2. Verify firewall settings
3. Check VS Code extension is running and created WebSocket server
4. Ensure localhost resolution works: `ping localhost`

### Issue: File Operations Fail
**Symptoms:** MCP tools return errors when reading/writing files

**Solutions:**
1. Check file permissions in working directory
2. Verify working directory path is correct
3. Check if files exist before operations
4. Ensure VS Code has necessary file access permissions

### Issue: MCP Protocol Errors
**Symptoms:** Invalid JSON-RPC responses

**Solutions:**
1. Check MCP server logs for detailed errors
2. Verify request format matches MCP specification
3. Test with integration test script: `npm run test`
4. Check for proper request/response ID matching

## Advanced Configuration

### Custom Port Configuration
Modify the ports in `src/server.ts` and `src/extension.ts`:

```typescript
// In server.ts
const WS_PORT = process.env.MCP_WS_PORT || 3057;

// In extension.ts  
const WS_PORT = process.env.VSC_WS_PORT || 3056;
```

### Environment Variables
Set environment variables for configuration:
```bash
export MCP_WS_PORT=3057
export VSC_WS_PORT=3056
export DEBUG_MCP=true
```

### Logging Configuration
Enable detailed logging by setting environment variables:
```bash
export NODE_ENV=development
export DEBUG=mcp:*
```

## Security Considerations

1. **Localhost Only**: The WebSocket servers only bind to localhost
2. **No Authentication**: Currently no authentication mechanism (intended for local development)
3. **File Access**: The system has full access to files in the working directory
4. **Process Control**: Can execute commands through VS Code extension

## Performance Tips

1. **Keep Working Directory Small**: Large directories may slow file operations
2. **Use Specific Paths**: Avoid broad directory scans when possible
3. **Monitor Resource Usage**: Check memory/CPU usage during heavy operations
4. **Regular Cleanup**: Remove temporary files created during testing

## Getting Help

1. Check the integration test output: `npm run test`
2. Review server logs when running `npm run dev`
3. Check VS Code Output panel for extension logs
4. Verify setup with: `npm run verify-setup`

For additional support, please check the project repository issues or documentation. 