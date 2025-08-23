import { MCPClientInterface, ConnectionStatus } from './types';
export declare class MCPClient implements MCPClientInterface {
    private ws;
    private messageHandlers;
    private connectionStatus;
    private reconnectTimer;
    private maxReconnectAttempts;
    private reconnectDelay;
    constructor();
    connect(port: number): Promise<void>;
    sendMessage(message: any): void;
    onMessage(handler: (message: any) => void): void;
    disconnect(): void;
    isConnected(): boolean;
    getConnectionStatus(): ConnectionStatus;
    private handleMessage;
    private scheduleReconnect;
    private clearReconnectTimer;
    sendRequest(method: string, params: any): Promise<any>;
}
