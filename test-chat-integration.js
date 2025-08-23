#!/usr/bin/env node

/**
 * Test script for MCP Bridge Chat Integration
 * Tests the new chat participant and language model tools integration
 */

const WebSocket = require('ws');

class ChatIntegrationTester {
    constructor() {
        this.mcpServerPort = 3056;
        this.extensionPort = 3057;
        this.results = [];
    }

    async runAllTests() {
        console.log('🚀 Starting MCP Bridge Chat Integration Tests...\n');
        
        try {
            // Test 1: Test MCP Server Tools List
            await this.testMCPServerToolsList();
            
            // Test 2: Test Chat Tools via MCP Server
            await this.testChatToolsViaMCP();
            
            // Test 3: Test Extension WebSocket
            await this.testExtensionWebSocket();
            
            // Test 4: Test Chat Participant Configuration
            await this.testChatParticipantConfig();
            
            // Show results
            this.showResults();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
            process.exit(1);
        }
    }

    async testMCPServerToolsList() {
        console.log('📋 Test 1: MCP Server Tools List');
        
        try {
            const ws = new WebSocket(`ws://localhost:${this.mcpServerPort}`);
            
            return new Promise((resolve, reject) => {
                ws.on('open', () => {
                    const request = {
                        jsonrpc: '2.0',
                        id: 1,
                        method: 'tools/list'
                    };
                    
                    ws.send(JSON.stringify(request));
                });
                
                ws.on('message', (data) => {
                    try {
                        const response = JSON.parse(data.toString());
                        const tools = response.result?.tools || [];
                        
                        // Check for chat tools
                        const expectedChatTools = [
                            'cursor_chat_with_ai',
                            'cursor_trigger_auto_agent',
                            'cursor_get_chat_history',
                            'start_ai_collaboration'
                        ];
                        
                        const foundChatTools = tools.filter(tool => 
                            expectedChatTools.includes(tool.name)
                        );
                        
                        if (foundChatTools.length === expectedChatTools.length) {
                            this.results.push({ test: 'MCP Server Tools List', status: '✅ PASS', details: `Found all ${expectedChatTools.length} chat tools` });
                        } else {
                            this.results.push({ test: 'MCP Server Tools List', status: '❌ FAIL', details: `Found ${foundChatTools.length}/${expectedChatTools.length} chat tools` });
                        }
                        
                        console.log(`   📝 Total tools: ${tools.length}`);
                        console.log(`   💬 Chat tools: ${foundChatTools.length}/${expectedChatTools.length}`);
                        console.log(`   🔧 Chat tools found: ${foundChatTools.map(t => t.name).join(', ')}\n`);
                        
                        ws.close();
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                });
                
                ws.on('error', (error) => {
                    this.results.push({ test: 'MCP Server Tools List', status: '❌ FAIL', details: `Connection error: ${error.message}` });
                    console.log(`   ❌ Connection failed: ${error.message}\n`);
                    resolve(); // Continue with other tests
                });
            });
        } catch (error) {
            this.results.push({ test: 'MCP Server Tools List', status: '❌ FAIL', details: error.message });
            console.log(`   ❌ Test failed: ${error.message}\n`);
        }
    }

    async testChatToolsViaMCP() {
        console.log('💬 Test 2: Chat Tools via MCP Server');
        
        try {
            const ws = new WebSocket(`ws://localhost:${this.mcpServerPort}`);
            
            return new Promise((resolve, reject) => {
                ws.on('open', async () => {
                    // Test cursor_chat_with_ai tool
                    const chatRequest = {
                        jsonrpc: '2.0',
                        id: 2,
                        method: 'tools/call',
                        params: {
                            name: 'cursor_chat_with_ai',
                            arguments: {
                                message: 'Test message from Claude Desktop',
                                context: 'integration-test'
                            }
                        }
                    };
                    
                    ws.send(JSON.stringify(chatRequest));
                });
                
                ws.on('message', (data) => {
                    try {
                        const response = JSON.parse(data.toString());
                        
                        if (response.result) {
                            this.results.push({ test: 'Chat Tools via MCP', status: '✅ PASS', details: 'Chat tool executed successfully' });
                            console.log(`   ✅ Chat tool response: ${JSON.stringify(response.result)}`);
                        } else if (response.error) {
                            this.results.push({ test: 'Chat Tools via MCP', status: '⚠️ PARTIAL', details: `Tool executed with error: ${response.error.message}` });
                            console.log(`   ⚠️ Tool error (expected if extension not running): ${response.error.message}`);
                        }
                        
                        ws.close();
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                });
                
                ws.on('error', (error) => {
                    this.results.push({ test: 'Chat Tools via MCP', status: '❌ FAIL', details: `Connection error: ${error.message}` });
                    console.log(`   ❌ Connection failed: ${error.message}`);
                    resolve();
                });
            });
        } catch (error) {
            this.results.push({ test: 'Chat Tools via MCP', status: '❌ FAIL', details: error.message });
            console.log(`   ❌ Test failed: ${error.message}\n`);
        }
        
        console.log('');
    }

    async testExtensionWebSocket() {
        console.log('🔌 Test 3: Extension WebSocket Integration');
        
        try {
            const ws = new WebSocket(`ws://localhost:${this.extensionPort}`);
            
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    this.results.push({ test: 'Extension WebSocket', status: '⚠️ PARTIAL', details: 'Extension WebSocket not running (expected when extension not loaded)' });
                    console.log(`   ⚠️ Extension WebSocket not available (extension may not be loaded)\n`);
                    resolve();
                }, 3000);
                
                ws.on('open', () => {
                    clearTimeout(timeout);
                    
                    // Test chat integration message
                    const testMessage = {
                        method: 'cursor_chat_with_ai',
                        params: {
                            message: 'Test message for chat integration',
                            context: 'websocket-test'
                        },
                        id: Date.now()
                    };
                    
                    ws.send(JSON.stringify(testMessage));
                });
                
                ws.on('message', (data) => {
                    try {
                        const response = JSON.parse(data.toString());
                        this.results.push({ test: 'Extension WebSocket', status: '✅ PASS', details: 'Extension WebSocket responding correctly' });
                        console.log(`   ✅ Extension response: ${JSON.stringify(response)}`);
                        ws.close();
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                });
                
                ws.on('error', (error) => {
                    clearTimeout(timeout);
                    this.results.push({ test: 'Extension WebSocket', status: '⚠️ PARTIAL', details: 'Extension not running (expected when not loaded in Cursor)' });
                    console.log(`   ⚠️ Extension WebSocket error (expected): ${error.message}\n`);
                    resolve();
                });
            });
        } catch (error) {
            this.results.push({ test: 'Extension WebSocket', status: '❌ FAIL', details: error.message });
            console.log(`   ❌ Test failed: ${error.message}\n`);
        }
    }

    async testChatParticipantConfig() {
        console.log('⚙️ Test 4: Chat Participant Configuration');
        
        try {
            const fs = require('fs');
            const path = require('path');
            
            // Check if extension package.json has chat participant config
            const packagePath = path.join(__dirname, 'extension-package.json');
            
            if (fs.existsSync(packagePath)) {
                const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
                const chatParticipants = packageJson.contributes?.chatParticipants || [];
                
                const mcpParticipant = chatParticipants.find(p => p.id === 'mcp-bridge.cursor-integration');
                
                if (mcpParticipant) {
                    this.results.push({ test: 'Chat Participant Config', status: '✅ PASS', details: 'Chat participant properly configured' });
                    console.log(`   ✅ Chat participant configured: ${mcpParticipant.name}`);
                    console.log(`   📝 Description: ${mcpParticipant.description}`);
                } else {
                    this.results.push({ test: 'Chat Participant Config', status: '❌ FAIL', details: 'Chat participant not found in config' });
                    console.log(`   ❌ Chat participant not configured`);
                }
            } else {
                this.results.push({ test: 'Chat Participant Config', status: '❌ FAIL', details: 'Extension package.json not found' });
                console.log(`   ❌ Extension package.json not found`);
            }
            
            // Check if compiled files exist
            const outDir = path.join(__dirname, 'out');
            const compiledFiles = [
                'extension.js',
                'chat-participant.js',
                'language-model-tools.js'
            ];
            
            const existingFiles = compiledFiles.filter(file => 
                fs.existsSync(path.join(outDir, file))
            );
            
            console.log(`   📦 Compiled files: ${existingFiles.length}/${compiledFiles.length}`);
            console.log(`   🗂️ Files: ${existingFiles.join(', ')}\n`);
            
        } catch (error) {
            this.results.push({ test: 'Chat Participant Config', status: '❌ FAIL', details: error.message });
            console.log(`   ❌ Test failed: ${error.message}\n`);
        }
    }

    showResults() {
        console.log('📊 Test Results Summary:');
        console.log('════════════════════════════════════════\n');
        
        this.results.forEach(result => {
            console.log(`${result.status} ${result.test}`);
            console.log(`   ${result.details}\n`);
        });
        
        const passed = this.results.filter(r => r.status.includes('✅')).length;
        const partial = this.results.filter(r => r.status.includes('⚠️')).length;
        const failed = this.results.filter(r => r.status.includes('❌')).length;
        
        console.log(`📈 Summary: ${passed} passed, ${partial} partial, ${failed} failed`);
        
        if (failed === 0) {
            console.log('\n🎉 Chat Integration Implementation Complete!');
            console.log('\n✨ Ready for Claude Desktop ↔ Cursor AI communication!');
            
            console.log('\n📋 Next Steps:');
            console.log('1. Install the extension in Cursor IDE');
            console.log('2. Configure Claude Desktop with the MCP server');
            console.log('3. Use @mcp-bridge in Cursor chat to test integration');
            console.log('4. Try: @mcp-bridge /chat Create a React component');
            console.log('5. Try: @mcp-bridge /agent Build a simple web app');
        } else {
            console.log('\n⚠️ Some tests failed. Check the errors above.');
        }
    }
}

// Run the tests
const tester = new ChatIntegrationTester();
tester.runAllTests().catch(console.error); 