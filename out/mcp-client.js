"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPClient = void 0;
const ws_1 = __importDefault(require("ws"));
class MCPClient {
    ws = null;
    messageHandlers = [];
    connectionStatus = {
        connected: false,
        port: 0,
        reconnectAttempts: 0
    };
    reconnectTimer = null;
    maxReconnectAttempts = 5;
    reconnectDelay = 2000; // 2 seconds
    constructor() {
        console.log('MCPClient initialized');
    }
    async connect(port) {
        return new Promise((resolve, reject) => {
            try {
                console.log(`Connecting to MCP server on port ${port}`);
                if (this.ws && this.ws.readyState === ws_1.default.OPEN) {
                    console.log('Already connected to MCP server');
                    resolve();
                    return;
                }
                this.connectionStatus.port = port;
                this.ws = new ws_1.default(`ws://localhost:${port}`);
                this.ws.on('open', () => {
                    console.log(`Connected to MCP server on port ${port}`);
                    this.connectionStatus.connected = true;
                    this.connectionStatus.lastConnected = new Date();
                    this.connectionStatus.reconnectAttempts = 0;
                    this.clearReconnectTimer();
                    resolve();
                });
                this.ws.on('message', (data) => {
                    try {
                        const message = JSON.parse(data.toString());
                        console.log('Received message from MCP server:', message);
                        this.handleMessage(message);
                    }
                    catch (error) {
                        console.error('Error parsing WebSocket message:', error);
                    }
                });
                this.ws.on('error', (error) => {
                    console.error('WebSocket error:', error);
                    this.connectionStatus.connected = false;
                    reject(new Error(`Failed to connect to MCP server: ${error.message}`));
                });
                this.ws.on('close', (code, reason) => {
                    console.log(`WebSocket connection closed: ${code} ${reason}`);
                    this.connectionStatus.connected = false;
                    this.ws = null;
                    this.scheduleReconnect();
                });
            }
            catch (error) {
                console.error('Error creating WebSocket connection:', error);
                reject(error);
            }
        });
    }
    sendMessage(message) {
        try {
            if (!this.ws || this.ws.readyState !== ws_1.default.OPEN) {
                throw new Error('WebSocket connection is not open');
            }
            const messageStr = JSON.stringify(message);
            console.log('Sending message to MCP server:', messageStr);
            this.ws.send(messageStr);
        }
        catch (error) {
            console.error('Error sending message:', error);
            throw new Error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    onMessage(handler) {
        console.log('Registering message handler');
        this.messageHandlers.push(handler);
    }
    disconnect() {
        try {
            console.log('Disconnecting from MCP server');
            this.clearReconnectTimer();
            if (this.ws) {
                this.ws.close();
                this.ws = null;
            }
            this.connectionStatus.connected = false;
            this.messageHandlers = [];
        }
        catch (error) {
            console.error('Error disconnecting:', error);
        }
    }
    isConnected() {
        return this.connectionStatus.connected && this.ws?.readyState === ws_1.default.OPEN;
    }
    getConnectionStatus() {
        return { ...this.connectionStatus };
    }
    handleMessage(message) {
        try {
            for (const handler of this.messageHandlers) {
                handler(message);
            }
        }
        catch (error) {
            console.error('Error handling message:', error);
        }
    }
    scheduleReconnect() {
        if (this.connectionStatus.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('Max reconnect attempts reached, stopping reconnection');
            return;
        }
        this.clearReconnectTimer();
        const delay = this.reconnectDelay * Math.pow(2, this.connectionStatus.reconnectAttempts);
        console.log(`Scheduling reconnect in ${delay}ms (attempt ${this.connectionStatus.reconnectAttempts + 1})`);
        this.reconnectTimer = setTimeout(() => {
            this.connectionStatus.reconnectAttempts++;
            this.connect(this.connectionStatus.port).catch((error) => {
                console.error('Reconnection failed:', error);
            });
        }, delay);
    }
    clearReconnectTimer() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }
    async sendRequest(method, params) {
        return new Promise((resolve, reject) => {
            try {
                const id = Math.random().toString(36).substr(2, 9);
                const request = {
                    jsonrpc: '2.0',
                    method,
                    params,
                    id
                };
                // Set up response handler
                const responseHandler = (message) => {
                    if (message.id === id) {
                        // Remove this handler
                        const index = this.messageHandlers.indexOf(responseHandler);
                        if (index > -1) {
                            this.messageHandlers.splice(index, 1);
                        }
                        if (message.error) {
                            reject(new Error(`MCP Error: ${message.error.message}`));
                        }
                        else {
                            resolve(message.result);
                        }
                    }
                };
                this.onMessage(responseHandler);
                this.sendMessage(request);
                // Set timeout for request
                setTimeout(() => {
                    const index = this.messageHandlers.indexOf(responseHandler);
                    if (index > -1) {
                        this.messageHandlers.splice(index, 1);
                        reject(new Error('Request timeout'));
                    }
                }, 10000); // 10 second timeout
            }
            catch (error) {
                reject(error);
            }
        });
    }
}
exports.MCPClient = MCPClient;
//# sourceMappingURL=mcp-client.js.map