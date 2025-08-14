import { useEffect, useState, useCallback, useRef } from 'react';
import { ChatMessage } from '../types';
import { realtimeMessagingService, MessageListener } from '../services/RealtimeMessagingService';

export interface UseRealtimeMessagingResult {
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  sendMessage: (conversationId: string, message: ChatMessage) => Promise<void>;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  markMessagesAsRead: (conversationId: string, messageIds: string[]) => Promise<void>;
  getUserOnlineStatus: (userId: string) => boolean;
  reconnect: () => void;
}

export interface UseRealtimeMessagingCallbacks {
  onMessageReceived?: (message: ChatMessage, conversationId: string) => void;
  onTypingStart?: (conversationId: string, userId: string) => void;
  onTypingStop?: (conversationId: string, userId: string) => void;
  onUserOnlineStatus?: (userId: string, isOnline: boolean) => void;
  onConnectionStatusChange?: (status: 'connected' | 'disconnected' | 'connecting') => void;
}

export const useRealtimeMessaging = (callbacks?: UseRealtimeMessagingCallbacks): UseRealtimeMessagingResult => {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const listenerRef = useRef<MessageListener | null>(null);
  const callbacksRef = useRef(callbacks);

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  // Set up real-time messaging service
  useEffect(() => {
    // Create listener
    const listener: MessageListener = {
      onMessageReceived: (message: ChatMessage, conversationId: string) => {
        callbacksRef.current?.onMessageReceived?.(message, conversationId);
      },
      onTypingStart: (conversationId: string, userId: string) => {
        callbacksRef.current?.onTypingStart?.(conversationId, userId);
      },
      onTypingStop: (conversationId: string, userId: string) => {
        callbacksRef.current?.onTypingStop?.(conversationId, userId);
      },
      onUserOnlineStatus: (userId: string, isOnline: boolean) => {
        callbacksRef.current?.onUserOnlineStatus?.(userId, isOnline);
      },
    };

    // Add listener to service
    realtimeMessagingService.addListener(listener);
    listenerRef.current = listener;

    // Update connection status
    setConnectionStatus(realtimeMessagingService.getConnectionStatus());

    // Poll for connection status changes
    const statusInterval = setInterval(() => {
      const currentStatus = realtimeMessagingService.getConnectionStatus();
      setConnectionStatus(prevStatus => {
        if (prevStatus !== currentStatus) {
          callbacksRef.current?.onConnectionStatusChange?.(currentStatus);
          return currentStatus;
        }
        return prevStatus;
      });
    }, 1000);

    return () => {
      if (listenerRef.current) {
        realtimeMessagingService.removeListener(listenerRef.current);
      }
      clearInterval(statusInterval);
    };
  }, []);

  const sendMessage = useCallback(async (conversationId: string, message: ChatMessage) => {
    try {
      await realtimeMessagingService.sendMessage(conversationId, message);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }, []);

  const startTyping = useCallback((conversationId: string) => {
    realtimeMessagingService.startTyping(conversationId);
  }, []);

  const stopTyping = useCallback((conversationId: string) => {
    realtimeMessagingService.stopTyping(conversationId);
  }, []);

  const markMessagesAsRead = useCallback(async (conversationId: string, messageIds: string[]) => {
    try {
      await realtimeMessagingService.markMessagesAsRead(conversationId, messageIds);
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
      throw error;
    }
  }, []);

  const getUserOnlineStatus = useCallback((userId: string) => {
    return realtimeMessagingService.getUserOnlineStatus(userId);
  }, []);

  const reconnect = useCallback(() => {
    realtimeMessagingService.reconnect();
  }, []);

  return {
    connectionStatus,
    sendMessage,
    startTyping,
    stopTyping,
    markMessagesAsRead,
    getUserOnlineStatus,
    reconnect,
  };
};