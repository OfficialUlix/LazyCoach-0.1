import { ChatMessage, Conversation } from '../types';
import NotificationService from './NotificationService';

export interface MessageListener {
  onMessageReceived: (message: ChatMessage, conversationId: string) => void;
  onTypingStart: (conversationId: string, userId: string) => void;
  onTypingStop: (conversationId: string, userId: string) => void;
  onUserOnlineStatus: (userId: string, isOnline: boolean) => void;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  isTyping: boolean;
  timestamp: number;
}

export class RealtimeMessagingService {
  private listeners: MessageListener[] = [];
  private connectionStatus: 'connected' | 'disconnected' | 'connecting' = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();
  
  private mockActiveUsers = new Set<string>(['1', '2', '3']); // Mock online users

  constructor() {
    this.connect();
  }

  /**
   * Simulate WebSocket connection
   */
  private async connect(): Promise<void> {
    this.connectionStatus = 'connecting';
    
    try {
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      this.connectionStatus = 'connected';
      this.reconnectAttempts = 0;
      
      // Start heartbeat to maintain connection
      this.startHeartbeat();
      
      console.log('[RealtimeMessaging] Connected to messaging service');
      
      // Simulate receiving messages periodically
      this.startMockMessageSimulation();
      
    } catch (error) {
      this.connectionStatus = 'disconnected';
      this.handleConnectionError();
    }
  }

  /**
   * Handle connection errors and attempt reconnection
   */
  private handleConnectionError(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      
      console.log(`[RealtimeMessaging] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('[RealtimeMessaging] Max reconnection attempts reached');
    }
  }

  /**
   * Start heartbeat to maintain connection
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.connectionStatus === 'connected') {
        // Simulate heartbeat
        console.log('[RealtimeMessaging] Heartbeat sent');
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Simulate receiving messages for testing
   */
  private startMockMessageSimulation(): void {
    // Simulate receiving a message every 30-60 seconds
    const simulateMessage = async () => {
      if (this.connectionStatus === 'connected' && Math.random() > 0.7) {
        const mockMessage: ChatMessage = {
          id: Date.now().toString(),
          text: this.getRandomMessage(),
          senderId: 'coach1',
          timestamp: new Date().toISOString(),
          isRead: false,
        };
        
        this.listeners.forEach(listener => {
          listener.onMessageReceived(mockMessage, 'conv1');
        });
        
        // Send push notification for new message
        try {
          await NotificationService.sendMessageNotification(
            'Coach Sarah',
            mockMessage.text || 'New message',
            mockMessage.senderId,
            'conv1'
          );
        } catch (error) {
          console.error('[RealtimeMessaging] Failed to send notification:', (error as Error).message || error);
          // Continue execution even if notifications fail
        }
      }
      
      // Schedule next simulation
      setTimeout(simulateMessage, 30000 + Math.random() * 30000);
    };

    // Start simulation after 10 seconds
    setTimeout(simulateMessage, 10000);
  }

  /**
   * Get random message for simulation
   */
  private getRandomMessage(): string {
    const messages = [
      "How's your progress going?",
      "Great job on completing today's session!",
      "Remember to practice the techniques we discussed.",
      "Looking forward to our next meeting!",
      "Any questions about the homework?",
      "You're making excellent progress!",
      "Don't forget about our session tomorrow.",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Send a message
   */
  async sendMessage(conversationId: string, message: ChatMessage, skipNotification: boolean = false): Promise<void> {
    if (this.connectionStatus !== 'connected') {
      throw new Error('Not connected to messaging service');
    }

    try {
      // Simulate sending message to server
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
      
      console.log('[RealtimeMessaging] Message sent:', message);
      
      // Simulate message delivery confirmation
      // In a real implementation, this would come from the server
      
      // Send push notification for sent message (if configured for delivery confirmations)
      if (!skipNotification) {
        // This would typically be sent to other participants in the conversation
        // For now, we'll skip since it's our own message
      }
      
    } catch (error) {
      console.error('[RealtimeMessaging] Failed to send message:', error);
      throw new Error('Failed to send message');
    }
  }

  /**
   * Start typing indicator
   */
  startTyping(conversationId: string): void {
    if (this.connectionStatus !== 'connected') return;

    // Clear existing timeout for this conversation
    const timeoutKey = `typing_${conversationId}`;
    const existingTimeout = this.typingTimeouts.get(timeoutKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Simulate sending typing indicator
    console.log('[RealtimeMessaging] Started typing in conversation:', conversationId);
    
    // Auto-stop typing after 3 seconds
    const timeout = setTimeout(() => {
      this.stopTyping(conversationId);
    }, 3000);
    
    this.typingTimeouts.set(timeoutKey, timeout);
  }

  /**
   * Stop typing indicator
   */
  stopTyping(conversationId: string): void {
    if (this.connectionStatus !== 'connected') return;

    const timeoutKey = `typing_${conversationId}`;
    const existingTimeout = this.typingTimeouts.get(timeoutKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.typingTimeouts.delete(timeoutKey);
    }

    console.log('[RealtimeMessaging] Stopped typing in conversation:', conversationId);
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId: string, messageIds: string[]): Promise<void> {
    if (this.connectionStatus !== 'connected') {
      throw new Error('Not connected to messaging service');
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
      
      console.log('[RealtimeMessaging] Messages marked as read:', messageIds);
      
    } catch (error) {
      console.error('[RealtimeMessaging] Failed to mark messages as read:', error);
      throw new Error('Failed to mark messages as read');
    }
  }

  /**
   * Get online status for users
   */
  getUserOnlineStatus(userId: string): boolean {
    return this.mockActiveUsers.has(userId);
  }

  /**
   * Subscribe to real-time events
   */
  addListener(listener: MessageListener): void {
    this.listeners.push(listener);
  }

  /**
   * Unsubscribe from real-time events
   */
  removeListener(listener: MessageListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): 'connected' | 'disconnected' | 'connecting' | null {
    return this.connectionStatus;
  }

  /**
   * Force reconnection
   */
  reconnect(): void {
    this.disconnect();
    this.connect();
  }

  /**
   * Disconnect from the service
   */
  disconnect(): void {
    this.connectionStatus = 'disconnected';
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    // Clear all typing timeouts
    this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.typingTimeouts.clear();
    
    console.log('[RealtimeMessaging] Disconnected from messaging service');
  }

  /**
   * Simulate user going online/offline
   */
  simulateUserStatusChange(userId: string, isOnline: boolean): void {
    if (isOnline) {
      this.mockActiveUsers.add(userId);
    } else {
      this.mockActiveUsers.delete(userId);
    }
    
    this.listeners.forEach(listener => {
      listener.onUserOnlineStatus(userId, isOnline);
    });
  }
}

// Singleton instance
export const realtimeMessagingService = new RealtimeMessagingService();