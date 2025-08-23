/**
 * CHAT INTEGRATION TEST SCRIPT
 * 
 * Tests the complete MCP Bridge chat functionality:
 * - Chat Participant Integration
 * - Auto Agent Triggering
 * - Chat History Access
 * - AI Collaboration Features
 */

const WebSocket = require('ws');

class ChatIntegrationTester {
    constructor() {
        this.serverUrl = 'ws://localhost:3057';
        this.tests = [];
        this.results = [];
    }

    /**
     * Run all chat integration tests
     */
    async runAllTests() {
        console.log('🌉 MCP BRIDGE CHAT INTEGRATION TEST SUITE');
        console.log('==========================================\n');

        this.tests = [
            this.testChatWithAI,
            this.testTriggerAutoAgent,
            this.testGetChatHistory,
            this.testStartAICollaboration,
            this.testMCPServerChatTools
        ];

        for (let i = 0; i < this.tests.length; i++) {
            const test = this.tests[i];
            try {
                console.log(`\n📋 Running Test ${i + 1}/${this.tests.length}: ${test.name}`);
                console.log('─'.repeat(50));
                
                const result = await test.call(this);
                this.results.push({ test: test.name, status: 'PASSED', result });
                console.log(`✅ ${test.name} PASSED`);
                
            } catch (error) {
                this.results.push({ test: test.name, status: 'FAILED', error: error.message });
                console.log(`❌ ${test.name} FAILED: ${error.message}`);
            }
        }

        this.printTestSummary();
    }

    /**
     * Test: Chat with AI functionality
     */
    async testChatWithAI() {
        console.log('Testing chat_with_ai functionality...');
        
        const ws = await this.connectToServer();
        
        const message = {
            id: 1,
            method: 'cursor_chat_with_ai',
            params: {
                message: 'Hello Cursor AI, this is a test message from Claude Desktop!',
                context: 'Integration testing'
            }
        };

        const response = await this.sendMessage(ws, message);
        ws.close();

        if (!response.success) {
            throw new Error(`Chat with AI failed: ${response.message}`);
        }

        console.log(`📤 Message sent: "${message.params.message}"`);
        console.log(`📥 Response: ${response.message}`);
        
        return response;
    }

    /**
     * Test: Auto Agent Triggering
     */
    async testTriggerAutoAgent() {
        console.log('Testing auto agent triggering...');
        
        const ws = await this.connectToServer();
        
        const message = {
            id: 2,
            method: 'cursor_trigger_auto_agent',
            params: {
                prompt: 'Create a simple React component for a todo list',
                strategy: 'rapid_prototype'
            }
        };

        const response = await this.sendMessage(ws, message);
        ws.close();

        if (!response.success) {
            throw new Error(`Auto agent trigger failed: ${response.message}`);
        }

        console.log(`🤖 Agent triggered with: "${message.params.prompt}"`);
        console.log(`⚡ Strategy: ${message.params.strategy}`);
        console.log(`📥 Response: ${response.message}`);
        
        return response;
    }

    /**
     * Test: Chat History Retrieval
     */
    async testGetChatHistory() {
        console.log('Testing chat history retrieval...');
        
        const ws = await this.connectToServer();
        
        const message = {
            id: 3,
            method: 'cursor_get_chat_history',
            params: {
                limit: 5
            }
        };

        const response = await this.sendMessage(ws, message);
        ws.close();

        if (!response.success) {
            throw new Error(`Get chat history failed: ${response.message}`);
        }

        console.log(`📚 Retrieved ${response.history?.length || 0} chat entries`);
        console.log(`📥 Response: ${response.message}`);
        
        return response;
    }

    /**
     * Test: AI Collaboration Session
     */
    async testStartAICollaboration() {
        console.log('Testing AI collaboration session...');
        
        const ws = await this.connectToServer();
        
        const message = {
            id: 4,
            method: 'start_ai_collaboration',
            params: {
                task: 'Build a retro Windows 95 file explorer simulator',
                strategy: 'collaborative'
            }
        };

        const response = await this.sendMessage(ws, message);
        ws.close();

        if (!response.success) {
            throw new Error(`AI collaboration failed: ${response.message}`);
        }

        console.log(`🤝 Collaboration started: "${message.params.task}"`);
        console.log(`🎯 Strategy: ${message.params.strategy}`);
        console.log(`🆔 Collaboration ID: ${response.collaborationId}`);
        console.log(`📥 Response: ${response.message}`);
        
        return response;
    }

    /**
     * Test: MCP Server Chat Tools Availability
     */
    async testMCPServerChatTools() {
        console.log('Testing MCP server chat tools availability...');
        
        // Test by connecting directly to MCP server
        try {
            const { spawn } = require('child_process');
            
            return new Promise((resolve, reject) => {
                const mcpServer = spawn('node', ['dist/server.js'], {
                    stdio: ['pipe', 'pipe', 'pipe']
                });

                let output = '';
                
                mcpServer.stdout.on('data', (data) => {
                    output += data.toString();
                });

                mcpServer.stderr.on('data', (data) => {
                    console.log('MCP Server Error:', data.toString());
                });

                // Send list_tools request
                const listToolsRequest = {
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'tools/list'
                };

                mcpServer.stdin.write(JSON.stringify(listToolsRequest) + '\n');

                setTimeout(() => {
                    mcpServer.kill();
                    
                    try {
                        const lines = output.split('\n').filter(line => line.trim());
                        let toolsResponse = null;
                        
                        for (const line of lines) {
                            try {
                                const parsed = JSON.parse(line);
                                if (parsed.result && parsed.result.tools) {
                                    toolsResponse = parsed.result.tools;
                                    break;
                                }
                            } catch (e) {
                                // Skip non-JSON lines
                                continue;
                            }
                        }

                        if (!toolsResponse) {
                            throw new Error('No tools response received from MCP server');
                        }

                        const chatTools = toolsResponse.filter(tool => 
                            tool.name.includes('cursor_chat') || 
                            tool.name.includes('cursor_trigger') || 
                            tool.name.includes('start_ai_collaboration')
                        );

                        console.log(`🔧 Found ${chatTools.length} chat tools in MCP server:`);
                        chatTools.forEach(tool => {
                            console.log(`  • ${tool.name}: ${tool.description}`);
                        });

                        if (chatTools.length === 0) {
                            throw new Error('No chat tools found in MCP server');
                        }

                        resolve({ 
                            success: true, 
                            chatToolsCount: chatTools.length,
                            tools: chatTools.map(t => t.name)
                        });
                        
                    } catch (error) {
                        reject(error);
                    }
                }, 3000);
            });
            
        } catch (error) {
            throw new Error(`MCP server test failed: ${error.message}`);
        }
    }

    /**
     * Connect to WebSocket server
     */
    async connectToServer() {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(this.serverUrl);
            
            ws.on('open', () => {
                console.log('📡 Connected to extension WebSocket server');
                resolve(ws);
            });
            
            ws.on('error', (error) => {
                reject(new Error(`WebSocket connection failed: ${error.message}`));
            });
            
            // Timeout after 5 seconds
            setTimeout(() => {
                if (ws.readyState !== WebSocket.OPEN) {
                    reject(new Error('WebSocket connection timeout'));
                }
            }, 5000);
        });
    }

    /**
     * Send message and wait for response
     */
    async sendMessage(ws, message) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Message timeout'));
            }, 10000);
            
            ws.on('message', (data) => {
                clearTimeout(timeout);
                try {
                    const response = JSON.parse(data.toString());
                    resolve(response);
                } catch (error) {
                    reject(new Error(`Invalid JSON response: ${error.message}`));
                }
            });
            
            ws.send(JSON.stringify(message));
        });
    }

    /**
     * Print test results summary
     */
    printTestSummary() {
        console.log('\n🎯 TEST RESULTS SUMMARY');
        console.log('======================\n');

        const passed = this.results.filter(r => r.status === 'PASSED').length;
        const failed = this.results.filter(r => r.status === 'FAILED').length;
        const total = this.results.length;

        console.log(`Total Tests: ${total}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📊 Success Rate: ${Math.round((passed / total) * 100)}%\n`);

        if (failed > 0) {
            console.log('❌ FAILED TESTS:');
            this.results
                .filter(r => r.status === 'FAILED')
                .forEach(r => {
                    console.log(`  • ${r.test}: ${r.error}`);
                });
            console.log();
        }

        if (passed === total) {
            console.log('🎉 ALL TESTS PASSED! Chat integration is working correctly.');
            console.log('\n🌉 MCP BRIDGE CHAT INTEGRATION STATUS: ✅ READY FOR USE');
            console.log('\n📋 NEXT STEPS:');
            console.log('1. Install the extension in Cursor IDE');
            console.log('2. Connect to Claude Desktop with MCP server');
            console.log('3. Use @mcp-bridge commands in Cursor chat');
            console.log('4. Test AI-to-AI collaboration workflows');
        } else {
            console.log('⚠️  Some tests failed. Please check the implementation.');
        }
    }
}

// Demo scenarios for manual testing
function printDemoScenarios() {
    console.log('\n🎭 DEMO SCENARIOS FOR MANUAL TESTING');
    console.log('====================================\n');

    console.log('📝 SCENARIO 1: Basic Chat Communication');
    console.log('Claude Desktop Command:');
    console.log('  cursor_chat_with_ai("How do I optimize this React component?")\n');

    console.log('📝 SCENARIO 2: Auto Agent Triggering');
    console.log('Claude Desktop Command:');
    console.log('  cursor_trigger_auto_agent("Create a Windows 95 file explorer simulator")\n');

    console.log('📝 SCENARIO 3: AI Collaboration');
    console.log('Claude Desktop Command:');
    console.log('  start_ai_collaboration("Build a retro gaming interface", "collaborative")\n');

    console.log('📝 SCENARIO 4: Cursor Chat Commands');
    console.log('In Cursor AI Chat:');
    console.log('  @mcp-bridge /agent Create a React component');
    console.log('  @mcp-bridge /chat How can I improve performance?');
    console.log('  @mcp-bridge /collaborate Build something amazing\n');
}

// Run the tests
async function main() {
    const tester = new ChatIntegrationTester();
    
    try {
        await tester.runAllTests();
        printDemoScenarios();
    } catch (error) {
        console.error('❌ Test suite failed:', error.message);
        process.exit(1);
    }
}

// Handle command line arguments
if (process.argv.includes('--demo-only')) {
    printDemoScenarios();
} else {
    main().catch(console.error);
} 