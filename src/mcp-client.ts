import WebSocket from 'ws';
import { MCPClientInterface, WebSocketMessage, ConnectionStatus } from './types';

export class MCPClient implements MCPClientInterface {
  private ws: WebSocket | null = null;
  private messageHandlers: ((message: any) => void)[] = [];
  private connectionStatus: ConnectionStatus = {
    connected: false,
    port: 0,
    reconnectAttempts: 0
  };
  private reconnectTimer: NodeJS.Timeout | null = null;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000; // 2 seconds

  constructor() {
    console.log('MCPClient initialized');
  }

  async connect(port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`Connecting to MCP server on port ${port}`);
        
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          console.log('Already connected to MCP server');
          resolve();
          return;
        }

        this.connectionStatus.port = port;
        this.ws = new WebSocket(`ws://localhost:${port}`);

        this.ws!.on('open', () => {
          console.log(`Connected to MCP server on port ${port}`);
          this.connectionStatus.connected = true;
          this.connectionStatus.lastConnected = new Date();
          this.connectionStatus.reconnectAttempts = 0;
          this.clearReconnectTimer();
          resolve();
        });

        this.ws!.on('message', (data: WebSocket.Data) => {
          try {
            const message = JSON.parse(data.toString());
            console.log('Received message from MCP server:', message);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        });

        this.ws!.on('error', (error) => {
          console.error('WebSocket error:', error);
          this.connectionStatus.connected = false;
          reject(new Error(`Failed to connect to MCP server: ${error.message}`));
        });

        this.ws!.on('close', (code, reason) => {
          console.log(`WebSocket connection closed: ${code} ${reason}`);
          this.connectionStatus.connected = false;
          this.ws = null;
          this.scheduleReconnect();
        });

      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        reject(error);
      }
    });
  }

  sendMessage(message: any): void {
    try {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        throw new Error('WebSocket connection is not open');
      }

      const messageStr = JSON.stringify(message);
      console.log('Sending message to MCP server:', messageStr);
      this.ws.send(messageStr);
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  onMessage(handler: (message: any) => void): void {
    console.log('Registering message handler');
    this.messageHandlers.push(handler);
  }

  disconnect(): void {
    try {
      console.log('Disconnecting from MCP server');
      this.clearReconnectTimer();
      
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      
      this.connectionStatus.connected = false;
      this.messageHandlers = [];
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  }

  isConnected(): boolean {
    return this.connectionStatus.connected && this.ws?.readyState === WebSocket.OPEN;
  }

  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  private handleMessage(message: any): void {
    try {
      for (const handler of this.messageHandlers) {
        handler(message);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  private scheduleReconnect(): void {
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

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  async sendRequest(method: string, params: any): Promise<any> {
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
        const responseHandler = (message: any) => {
          if (message.id === id) {
            // Remove this handler
            const index = this.messageHandlers.indexOf(responseHandler);
            if (index > -1) {
              this.messageHandlers.splice(index, 1);
            }

            if (message.error) {
              reject(new Error(`MCP Error: ${message.error.message}`));
            } else {
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

      } catch (error) {
        reject(error);
      }
    });
  }
} 