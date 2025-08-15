# Claude Cursor MCP Server

A Model Context Protocol (MCP) server that enables Claude Desktop to communicate with Cursor IDE for file operations and command execution.

## Features

- **File Operations**: Edit, read, and open files in Cursor IDE
- **File Management**: List files in the workspace
- **Command Execution**: Run terminal commands
- **Real-time Communication**: Direct bridge between Claude Desktop and Cursor IDE

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Y1ssh/mcp_test.git
cd claude-cursor-mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

## Available Tools

### edit_file
Edit or create a file with specified content.
- **Parameters**: `filepath` (string), `content` (string)

### read_file
Read the contents of a file.
- **Parameters**: `filepath` (string)

### open_file
Open a file in Cursor IDE.
- **Parameters**: `filepath` (string), `line` (number, optional)

### list_files
List all files in the current workspace.
- **Parameters**: None

### run_command
Execute a command in the terminal.
- **Parameters**: `command` (string)

## Configuration

Configure Claude Desktop to use this MCP server by adding the following to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "claude-cursor-mcp-server": {
      "command": "node",
      "args": ["path/to/claude-cursor-mcp-server/dist/server.js"]
    }
  }
}
```

## Architecture

- **server.ts**: Main MCP server implementation with tool handlers
- **cursor-controller.ts**: File operations and command execution logic
- **types.ts**: TypeScript interfaces and type definitions

## Error Handling

The server includes comprehensive error handling:
- File operation errors (permissions, file not found, etc.)
- Command execution errors
- Invalid parameter validation
- Proper MCP error responses

## Dependencies

- `@modelcontextprotocol/sdk`: Official MCP SDK
- `typescript`: TypeScript compiler
- `@types/node`: Node.js type definitions

## License

MIT 