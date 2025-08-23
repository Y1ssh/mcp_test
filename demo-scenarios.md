# Claude Desktop Demo Scenarios

This document provides example commands and scenarios for testing the Claude Desktop MCP Bridge integration with Cursor IDE.

## Basic File Operations

### 1. File Listing
**Command:** "List all files in my project"
**Expected Result:** 
- Returns a structured list of files and directories
- Shows file types and sizes
- Excludes node_modules and build artifacts

**Verification:**
```bash
# Compare with actual directory listing
ls -la
```

### 2. File Reading
**Command:** "Read the package.json file and show me the dependencies"
**Expected Result:**
- Displays full package.json content
- Highlights dependencies section
- Shows version numbers

**Alternative Commands:**
- "Show me the content of src/server.ts"
- "What's in the README.md file?"
- "Read the tsconfig.json configuration"

### 3. File Creation
**Command:** "Create a React component called Button.jsx with a simple button implementation"
**Expected Result:**
- Creates new file `Button.jsx`
- Contains functional React component
- Includes proper imports and exports

**Sample Output File:**
```jsx
import React from 'react';

const Button = ({ children, onClick, className = '', ...props }) => {
  return (
    <button 
      className={`btn ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
```

### 4. File Modification
**Command:** "Add a console.log statement at the beginning of src/server.ts to log when the server starts"
**Expected Result:**
- Modifies existing file
- Adds logging statement in appropriate location
- Preserves existing code structure

## TypeScript/JavaScript Development

### 5. Component Creation
**Command:** "Create a TypeScript interface for a User with id, name, email, and optional avatar properties"
**Expected Result:**
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}
```

### 6. Function Implementation
**Command:** "Create a utility function that validates email addresses"
**Expected Result:**
- Creates new utility file or adds to existing
- Includes proper TypeScript types
- Has basic email validation logic

### 7. Class Creation
**Command:** "Create a Logger class with methods for info, warn, and error logging"
**Expected Result:**
```typescript
class Logger {
  info(message: string): void {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`);
  }

  warn(message: string): void {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`);
  }

  error(message: string, error?: Error): void {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error);
  }
}
```

## Project Analysis

### 8. Dependency Analysis
**Command:** "Analyze my package.json and tell me about the dependencies"
**Expected Result:**
- Lists all dependencies and devDependencies
- Identifies potential security issues
- Suggests updates if needed

### 9. Code Structure Analysis
**Command:** "List all TypeScript files in the src directory and describe their purposes"
**Expected Result:**
- Scans src/ directory
- Lists .ts and .tsx files
- Provides brief description of each file's purpose

### 10. Configuration Review
**Command:** "Review my tsconfig.json and explain the compiler options"
**Expected Result:**
- Reads TypeScript configuration
- Explains each compiler option
- Suggests improvements if applicable

## IDE Integration Commands

### 11. File Navigation
**Command:** "Open server.ts at line 50"
**Expected Result:**
- Opens file in Cursor IDE
- Navigates to specific line number
- Focuses editor on that location

### 12. Search Operations
**Command:** "Find all files that import WebSocket"
**Expected Result:**
- Searches across project files
- Lists files containing WebSocket imports
- Shows relevant code snippets

### 13. Workspace Operations
**Command:** "Show me the current working directory structure"
**Expected Result:**
- Displays hierarchical directory tree
- Shows file organization
- Indicates file types and sizes

## Complex Development Tasks

### 14. Feature Implementation
**Command:** "Create a simple REST API endpoint for user management with CRUD operations"
**Expected Result:**
- Creates new API file
- Implements GET, POST, PUT, DELETE endpoints
- Includes proper error handling and TypeScript types

### 15. Testing Setup
**Command:** "Create a test file for the MCPIntegrationTester class"
**Expected Result:**
- Creates new test file
- Includes test cases for major methods
- Uses appropriate testing framework

### 16. Configuration Updates
**Command:** "Add a new script to package.json for running tests in watch mode"
**Expected Result:**
- Modifies package.json
- Adds new script entry
- Preserves existing scripts and formatting

## Error Handling Scenarios

### 17. Invalid File Operations
**Command:** "Read a file that doesn't exist"
**Expected Result:**
- Returns appropriate error message
- Doesn't crash the system
- Suggests alternative actions

### 18. Permission Issues
**Command:** "Try to write to a read-only file"
**Expected Result:**
- Handles permission errors gracefully
- Provides clear error explanation
- Suggests solutions

### 19. Large File Handling
**Command:** "Read a very large file (>1MB)"
**Expected Result:**
- Handles large files appropriately
- May suggest partial reading
- Doesn't overwhelm the response

## Advanced Integration Scenarios

### 20. Multi-File Operations
**Command:** "Refactor the MCP server code to use environment variables for port configuration"
**Expected Result:**
- Modifies multiple relevant files
- Updates configuration handling
- Maintains backward compatibility

### 21. Code Generation
**Command:** "Generate a complete Express.js server with middleware, routes, and error handling"
**Expected Result:**
- Creates comprehensive server structure
- Includes proper TypeScript types
- Follows best practices

### 22. Documentation Generation
**Command:** "Create JSDoc comments for all public methods in the MCPIntegrationTester class"
**Expected Result:**
- Adds comprehensive JSDoc comments
- Documents parameters and return types
- Includes usage examples

## Performance Testing

### 23. Concurrent Operations
**Command:** "Create 5 different files simultaneously"
**Expected Result:**
- Handles multiple file operations
- Completes all operations successfully
- Maintains system stability

### 24. Large Directory Listing
**Command:** "List all files in node_modules directory"
**Expected Result:**
- Handles large directory efficiently
- May suggest filtering or pagination
- Provides reasonable response time

## Integration Verification

### 25. End-to-End Workflow
**Command Sequence:**
1. "Create a new React component called TodoItem"
2. "Add TypeScript interfaces for Todo and TodoProps"
3. "Implement the component with proper props and styling"
4. "Create a test file for this component"

**Expected Result:**
- Completes entire workflow
- Creates multiple related files
- Maintains consistency across files

### 26. Real-time Updates
**Command:** "Monitor the server.ts file and tell me when it changes"
**Expected Result:**
- Sets up file watching (if supported)
- Detects changes in real-time
- Reports modifications

## Troubleshooting Commands

### 27. System Status
**Command:** "Check if the MCP server is running properly"
**Expected Result:**
- Verifies server status
- Reports connection health
- Identifies any issues

### 28. Configuration Validation
**Command:** "Verify that my Claude Desktop configuration is correct"
**Expected Result:**
- Validates configuration file
- Checks paths and settings
- Suggests corrections if needed

### 29. Port Availability
**Command:** "Check if ports 3056 and 3057 are available"
**Expected Result:**
- Tests port availability
- Reports current port usage
- Suggests alternatives if needed

## Success Criteria

For each scenario, verify:
1. **Response Speed**: Commands complete within reasonable time (< 10 seconds)
2. **Accuracy**: Results match expected output
3. **Error Handling**: Graceful failure for invalid operations
4. **File Integrity**: No corruption of existing files
5. **System Stability**: No crashes or memory leaks
6. **UI Integration**: Proper interaction with Cursor IDE
7. **Logging**: Appropriate log messages for debugging

## Usage Tips

1. **Be Specific**: Include file paths and exact requirements
2. **Check Results**: Verify generated code compiles and runs
3. **Use Context**: Reference existing files and project structure
4. **Test Incrementally**: Start with simple operations before complex ones
5. **Monitor Performance**: Watch for resource usage during operations

## Feedback Collection

When testing scenarios, note:
- Response time for each command
- Accuracy of generated content
- Any error messages or failures
- Suggestions for improvement
- Missing functionality

This information helps improve the MCP bridge system and Claude Desktop integration. 