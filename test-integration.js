import { spawn } from 'child_process';
import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MCPIntegrationTester {
    constructor() {
        this.serverProcess = null;
        this.ws = null;
        this.testResults = [];
        this.timeout = 10000; // 10 seconds
    }

    log(message, type = 'INFO') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${type}] ${message}`);
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async startMCPServer() {
        return new Promise((resolve, reject) => {
            this.log('Starting MCP server...');
            
            // Check if dist directory exists
            if (!fs.existsSync('./dist/server.js')) {
                reject(new Error('Server build not found. Run "npm run build-server" first.'));
                return;
            }

            this.serverProcess = spawn('node', ['./dist/server.js'], {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: process.cwd()
            });

            this.serverProcess.stdout.on('data', (data) => {
                this.log(`Server stdout: ${data.toString().trim()}`);
            });

            this.serverProcess.stderr.on('data', (data) => {
                this.log(`Server stderr: ${data.toString().trim()}`, 'WARN');
            });

            this.serverProcess.on('error', (error) => {
                this.log(`Server process error: ${error.message}`, 'ERROR');
                reject(error);
            });

            this.serverProcess.on('exit', (code, signal) => {
                this.log(`Server process exited with code ${code}, signal ${signal}`);
            });

            // Wait for server to start
            setTimeout(() => {
                if (this.serverProcess && !this.serverProcess.killed) {
                    this.log('MCP server started successfully');
                    resolve();
                } else {
                    reject(new Error('Server failed to start'));
                }
            }, 3000);
        });
    }

    async testWebSocketConnection() {
        return new Promise((resolve, reject) => {
            this.log('Testing WebSocket connection on port 3057...');
            
            const timeout = setTimeout(() => {
                if (this.ws) {
                    this.ws.terminate();
                }
                reject(new Error('WebSocket connection timeout'));
            }, this.timeout);

            try {
                this.ws = new WebSocket('ws://localhost:3057');

                this.ws.on('open', () => {
                    clearTimeout(timeout);
                    this.log('WebSocket connection established successfully');
                    resolve();
                });

                this.ws.on('error', (error) => {
                    clearTimeout(timeout);
                    this.log(`WebSocket connection error: ${error.message}`, 'ERROR');
                    reject(error);
                });

                this.ws.on('close', (code, reason) => {
                    this.log(`WebSocket connection closed: ${code} ${reason}`);
                });

            } catch (error) {
                clearTimeout(timeout);
                reject(error);
            }
        });
    }

    async sendMCPRequest(method, params = {}) {
        return new Promise((resolve, reject) => {
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                reject(new Error('WebSocket not connected'));
                return;
            }

            const requestId = Date.now().toString();
            const request = {
                jsonrpc: '2.0',
                id: requestId,
                method: method,
                params: params
            };

            const timeout = setTimeout(() => {
                reject(new Error(`Request timeout for method: ${method}`));
            }, this.timeout);

            const responseHandler = (data) => {
                try {
                    const response = JSON.parse(data);
                    if (response.id === requestId) {
                        clearTimeout(timeout);
                        this.ws.off('message', responseHandler);
                        
                        if (response.error) {
                            reject(new Error(`MCP Error: ${response.error.message}`));
                        } else {
                            resolve(response.result);
                        }
                    }
                } catch (error) {
                    // Ignore parsing errors for other messages
                }
            };

            this.ws.on('message', responseHandler);
            this.ws.send(JSON.stringify(request));
            this.log(`Sent MCP request: ${method}`);
        });
    }

    async testMCPTools() {
        const tests = [
            {
                name: 'list_tools',
                method: 'tools/list',
                params: {}
            },
            {
                name: 'list_files',
                method: 'tools/call',
                params: {
                    name: 'list_files',
                    arguments: { path: '.' }
                }
            },
            {
                name: 'read_file',
                method: 'tools/call',
                params: {
                    name: 'read_file',
                    arguments: { path: 'package.json' }
                }
            },
            {
                name: 'create_test_file',
                method: 'tools/call',
                params: {
                    name: 'edit_file',
                    arguments: {
                        path: 'test-temp.txt',
                        content: 'This is a test file created by integration test'
                    }
                }
            }
        ];

        for (const test of tests) {
            try {
                this.log(`Testing ${test.name}...`);
                const result = await this.sendMCPRequest(test.method, test.params);
                this.log(`✓ ${test.name} passed`);
                this.testResults.push({ name: test.name, status: 'PASS', result });
            } catch (error) {
                this.log(`✗ ${test.name} failed: ${error.message}`, 'ERROR');
                this.testResults.push({ name: test.name, status: 'FAIL', error: error.message });
            }
        }
    }

    async testErrorHandling() {
        this.log('Testing error handling...');
        
        try {
            // Test invalid method
            await this.sendMCPRequest('invalid_method', {});
            this.testResults.push({ name: 'invalid_method', status: 'FAIL', error: 'Should have failed' });
        } catch (error) {
            this.log('✓ Invalid method properly rejected');
            this.testResults.push({ name: 'invalid_method_error', status: 'PASS' });
        }

        try {
            // Test invalid file read
            await this.sendMCPRequest('tools/call', {
                name: 'read_file',
                arguments: { path: 'nonexistent-file.txt' }
            });
            this.testResults.push({ name: 'invalid_file_read', status: 'FAIL', error: 'Should have failed' });
        } catch (error) {
            this.log('✓ Invalid file read properly handled');
            this.testResults.push({ name: 'invalid_file_read_error', status: 'PASS' });
        }
    }

    async cleanup() {
        this.log('Cleaning up test environment...');
        
        // Clean up test file
        if (fs.existsSync('test-temp.txt')) {
            fs.unlinkSync('test-temp.txt');
            this.log('Removed test file');
        }

        // Close WebSocket
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        // Stop server process
        if (this.serverProcess) {
            this.serverProcess.kill('SIGTERM');
            await this.sleep(2000);
            
            if (!this.serverProcess.killed) {
                this.serverProcess.kill('SIGKILL');
            }
            this.serverProcess = null;
        }

        this.log('Cleanup completed');
    }

    generateReport() {
        this.log('\n=== INTEGRATION TEST REPORT ===');
        
        const passedTests = this.testResults.filter(test => test.status === 'PASS');
        const failedTests = this.testResults.filter(test => test.status === 'FAIL');
        
        this.log(`Total Tests: ${this.testResults.length}`);
        this.log(`Passed: ${passedTests.length}`);
        this.log(`Failed: ${failedTests.length}`);
        
        if (failedTests.length > 0) {
            this.log('\nFAILED TESTS:');
            failedTests.forEach(test => {
                this.log(`  ✗ ${test.name}: ${test.error}`);
            });
        }
        
        if (passedTests.length > 0) {
            this.log('\nPASSED TESTS:');
            passedTests.forEach(test => {
                this.log(`  ✓ ${test.name}`);
            });
        }
        
        const success = failedTests.length === 0 && passedTests.length > 0;
        this.log(`\nOVERALL RESULT: ${success ? 'SUCCESS' : 'FAILURE'}\n`);
        
        return success;
    }

    async runAllTests() {
        try {
            await this.startMCPServer();
            await this.sleep(2000); // Give server time to fully initialize
            
            await this.testWebSocketConnection();
            await this.testMCPTools();
            await this.testErrorHandling();
            
            return this.generateReport();
            
        } catch (error) {
            this.log(`Integration test failed: ${error.message}`, 'ERROR');
            return false;
        } finally {
            await this.cleanup();
        }
    }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('test-integration.js')) {
    const tester = new MCPIntegrationTester();
    
    tester.runAllTests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test runner error:', error);
            process.exit(1);
        });
}

export default MCPIntegrationTester; 