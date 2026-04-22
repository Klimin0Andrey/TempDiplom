type WSMessageHandler = (payload: any) => void;
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export class SignalingClient {
  private ws: WebSocket | null = null;
  private handlers: Map<string, Set<WSMessageHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private url: string;
  private state: ConnectionState = 'disconnected';
  private stateListeners: Set<(state: ConnectionState) => void> = new Set();

  constructor(url: string = 'ws://localhost:3001') {
    this.url = url;
  }

  private setState(newState: ConnectionState) {
    this.state = newState;
    this.stateListeners.forEach(listener => listener(newState));
  }

  getState(): ConnectionState {
    return this.state;
  }

  onStateChange(listener: (state: ConnectionState) => void) {
    this.stateListeners.add(listener);
    listener(this.state); // Immediate call with current state
    return () => this.stateListeners.delete(listener);
  }

  connect(roomId: string, token: string) {
    if (this.ws?.readyState === WebSocket.OPEN || this.state === 'connecting') return;

    this.setState('connecting');
    
    // Mocking connection delay for UI demonstration
    setTimeout(() => {
      try {
        // In a real app: this.ws = new WebSocket(`${this.url}?token=${token}`);
        // For this skeleton, we'll mock the WebSocket object to avoid console errors
        this.ws = {
          readyState: WebSocket.OPEN,
          send: (data: string) => {
            console.log('WS Send:', JSON.parse(data));
            // Echo back chat messages for demonstration
            const parsed = JSON.parse(data);
            if (parsed.type === 'chat') {
              setTimeout(() => {
                this.emit('chat', {
                  id: Date.now().toString(),
                  userId: 'u1',
                  username: 'Alex (You)',
                  message: parsed.message,
                  messageType: 'text',
                  createdAt: new Date().toISOString(),
                  replyToId: parsed.reply_to_id
                });
              }, 100);
            }
          },
          close: () => {
            this.setState('disconnected');
          }
        } as unknown as WebSocket;

        this.setState('connected');
        this.reconnectAttempts = 0;
        this.send('join', { roomId });
      } catch (e) {
        this.setState('error');
        this.handleReconnect(roomId, token);
      }
    }, 800);
  }

  private handleReconnect(roomId: string, token: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      console.log(`Reconnecting in ${delay}ms...`);
      setTimeout(() => this.connect(roomId, token), delay);
    } else {
      this.setState('error');
      this.emit('error', { code: 'CONNECTION_FAILED', message: 'Max reconnect attempts reached' });
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setState('disconnected');
  }

  send(type: string, payload: any = {}) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, ...payload }));
    } else {
      console.warn('WebSocket is not open. Cannot send message:', type);
    }
  }

  on(type: string, handler: WSMessageHandler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
  }

  off(type: string, handler: WSMessageHandler) {
    const typeHandlers = this.handlers.get(type);
    if (typeHandlers) {
      typeHandlers.delete(handler);
    }
  }

  private emit(type: string, payload: any) {
    const typeHandlers = this.handlers.get(type);
    if (typeHandlers) {
      typeHandlers.forEach(handler => handler(payload));
    }
  }

  sendChat(roomId: string, message: string, replyToId?: string) {
    this.send('chat', { roomId, message, reply_to_id: replyToId });
  }

  updatePresence(status: 'speaking' | 'typing' | 'hand_raised' | 'idle', target: string = 'broadcast') {
    this.send('presence', { status, target });
  }
}

export const wsClient = new SignalingClient();
