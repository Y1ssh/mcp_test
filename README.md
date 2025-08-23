# Claude-Cursor MCP Bridge

A unified MCP (Model Context Protocol) bridge system that connects Claude Desktop with Cursor IDE, providing seamless integration between the AI assistant and the code editor.

✅ MCP Bridge Successfully Tested on August 17, 2025

## 🎯 System Overview

This project follows the **Lego Block methodology** - separate components that work together as one unified system:

- **Lego Block 1**: MCP Server (`server.ts`) - Handles MCP protocol communication
- **Lego Block 2**: VS Code Extension (`extension.ts`) - Integrates with Cursor IDE via WebSocket

## 🚀 Quick Start

### One-Command Setup

```bash
# Clone and setup
git clone https://github.com/Y1ssh/mcp_test.git
cd mcp_test
npm install

# Build everything
npm run build

# Start the MCP server
npm run dev
```

## 📁 Project Structure

```
mcp_test/
├── package.json              # Unified dependencies
├── tsconfig.json             # Server TypeScript config
├── tsconfig.extension.json   # Extension TypeScript config
├── src/
│   ├── server.ts            # MCP Server (Lego Block 1)
│   ├── cursor-controller.ts # File operations controller
│   ├── extension.ts         # VS Code Extension (Lego Block 2)
│   ├── mcp-client.ts        # WebSocket MCP client
│   ├── cursor-api.ts        # Cursor IDE API wrapper
│   └── types.ts             # Shared type definitions
├── dist/                    # Built MCP server files
├── out/                     # Built extension files
└── README.md               # This file
```

## 🛠 Available Scripts

| Command | Description |
|---------|-------------|
| `npm install` | Install all dependencies |
| `npm run build` | Build both server and extension |
| `npm run build-server` | Build only the MCP server |
| `npm run build-extension` | Build only the VS Code extension |
| `npm run dev` | Build and start MCP server |
| `npm run start` | Start the built MCP server |
| `npm run watch` | Watch and rebuild server on changes |
| `npm run watch-extension` | Watch and rebuild extension on changes |

## 🔧 System Components

### MCP Server (Port 3056)
- Handles MCP protocol communication with Claude Desktop
- Provides file operations, command execution, and workspace management
- Built as ES modules for modern JavaScript compatibility

### WebSocket Bridge (Port 3057)
- Connects MCP server with Cursor IDE
- Handles real-time communication between components
- Manages connection status and automatic reconnection

### VS Code Extension
- Integrates directly with Cursor IDE interface
- Provides file opening, workspace browsing, and command execution
- Shows connection status in the status bar

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the System
```bash
npm run build
```

### 3. Configure Claude Desktop

Add to your Claude Desktop MCP configuration:
```json
{
  "mcpServers": {
    "cursor-bridge": {
      "command": "node",
      "args": ["path/to/mcp_test/dist/server.js"],
      "env": {}
    }
  }
}
```

### 4. Install VS Code Extension

Copy the built extension to your VS Code extensions directory or use the VS Code extension development host.

### 5. Start the System

```bash
npm run dev
```

## 🔌 Available MCP Tools

The server provides these tools to Claude:

- **edit_file**: Edit file contents
- **read_file**: Read file contents  
- **open_file**: Open files in Cursor at specific lines
- **list_files**: List workspace files
- **run_command**: Execute system commands

## 🔄 Communication Flow

```
Claude Desktop ←→ MCP Server (3056) ←→ WebSocket Bridge (3057) ←→ Cursor IDE Extension
```

1. Claude sends MCP requests to the server
2. Server processes requests and communicates with Cursor via WebSocket
3. Extension receives WebSocket messages and executes actions in Cursor
4. Results flow back through the same chain

## 🐛 Debugging

### Check MCP Server Status
```bash
npm run dev
```

### Check Extension Status
- Look for "MCP Connected" in VS Code status bar
- Check VS Code Developer Console for extension logs

### Common Issues

**Port conflicts**: Ensure ports 3056 and 3057 are available
**Extension not loading**: Check VS Code extension is properly installed
**Connection issues**: Verify both server and extension are running

## 🏗 Development

### Watch Mode Development
```bash
# Terminal 1: Watch server changes
npm run watch

# Terminal 2: Watch extension changes  
npm run watch-extension
```

### Adding New Features

1. Add types to `src/types.ts`
2. Implement server-side logic in `src/server.ts`
3. Add extension handlers in `src/extension.ts`
4. Update both TypeScript configs as needed

## 📦 Dependencies

### Runtime Dependencies
- `@modelcontextprotocol/sdk`: MCP protocol implementation
- `ws`: WebSocket communication

### Development Dependencies
- `typescript`: TypeScript compiler
- `@types/node`: Node.js type definitions
- `@types/vscode`: VS Code extension types
- `@types/ws`: WebSocket type definitions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test both server and extension components
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.