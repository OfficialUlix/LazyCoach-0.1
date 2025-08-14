import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { MainStackParamList } from '../../types/navigation';
import { useMainNavigation } from '../../hooks/useNavigation';
import { WorkaroundTextInput } from '../../components/WorkaroundTextInput';
import { Conversation, ChatMessage, MessageStatus } from '../../types';
import { Loading } from '../../components/Loading';
import { NetworkStatus } from '../../components/NetworkStatus';
import { useRealtimeMessaging } from '../../hooks/useRealtimeMessaging';
import { useOfflineData } from '../../hooks/useOfflineData';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useScreenPerformance } from '../../hooks/usePerformance';
import { TypingIndicator } from '../../components/messaging/TypingIndicator';
import { MessageStatusIndicator } from '../../components/messaging/MessageStatusIndicator';

const mockMessages: ChatMessage[] = [
  {
    id: '1',
    senderId: '1',
    senderName: 'Sarah Johnson',
    message: 'Hi! Thanks for booking a session with me. Looking forward to working together!',
    timestamp: '2025-01-10T10:00:00Z',
    type: 'text',
  },
  {
    id: '2',
    senderId: 'user-1',
    senderName: 'You',
    message: 'Thanks Sarah! I\'m excited to get started on my career goals.',
    timestamp: '2025-01-10T10:05:00Z',
    type: 'text',
  },
  {
    id: '3',
    senderId: '1',
    senderName: 'Sarah Johnson',
    message: 'Perfect! I\'ve prepared some questions for our session tomorrow. We\'ll focus on identifying your core strengths and mapping out a clear path forward.',
    timestamp: '2025-01-10T10:10:00Z',
    type: 'text',
  },
  {
    id: '4',
    senderId: 'system',
    senderName: 'System',
    message: 'Session scheduled for January 20, 2025 at 9:00 AM',
    timestamp: '2025-01-10T10:11:00Z',
    type: 'system',
  },
  {
    id: '5',
    senderId: '1',
    senderName: 'Sarah Johnson',
    message: 'Looking forward to our session tomorrow!',
    timestamp: '2025-01-11T14:30:00Z',
    type: 'text',
  },
];

interface ChatScreenProps {
  route: RouteProp<MainStackParamList, 'Chat'>;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ route }) => {
  const navigation = useMainNavigation();
  const { user } = useAuth();
  const { conversation } = route.params;
  const { queueAction } = useOfflineData();
  const { trackScreenView, trackMessage, trackAction } = useAnalytics();
  
  // Track screen performance
  useScreenPerformance('ChatScreen');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time messaging callbacks
  const handleMessageReceived = useCallback((message: ChatMessage, conversationId: string) => {
    if (conversationId === conversation.id) {
      setMessages(prev => [...prev, message]);
      // Mark message as read automatically when chat is open
      realtimeMessaging.markMessagesAsRead(conversationId, [message.id]);
    }
  }, [conversation.id]);

  const handleTypingStart = useCallback((conversationId: string, userId: string) => {
    if (conversationId === conversation.id && userId !== user?.id) {
      setOtherUserTyping(true);
    }
  }, [conversation.id, user?.id]);

  const handleTypingStop = useCallback((conversationId: string, userId: string) => {
    if (conversationId === conversation.id && userId !== user?.id) {
      setOtherUserTyping(false);
    }
  }, [conversation.id, user?.id]);

  const handleUserOnlineStatus = useCallback((userId: string, isOnline: boolean) => {
    // Could update UI to show online status
    console.log(`User ${userId} is ${isOnline ? 'online' : 'offline'}`);
  }, []);

  const realtimeMessaging = useRealtimeMessaging({
    onMessageReceived: handleMessageReceived,
    onTypingStart: handleTypingStart,
    onTypingStop: handleTypingStop,
    onUserOnlineStatus: handleUserOnlineStatus,
  });

  useEffect(() => {
    loadMessages();
    trackScreenView('ChatScreen');
  }, [trackScreenView]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessages(mockMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = (): void => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  const sendMessage = async (): Promise<void> => {
    if (!newMessage.trim() || !user) return;

    const messageText = newMessage.trim();
    const message: ChatMessage = {
      id: Date.now().toString(),
      senderId: user.id,
      senderName: user.name,
      text: messageText,
      message: messageText, // Backward compatibility
      timestamp: new Date().toISOString(),
      type: 'text',
      status: 'sending',
      isRead: false,
    };

    // Add message optimistically to UI
    setMessages(prev => [...prev, message]);
    const isFirstMessage = messages.length === 0;
    setNewMessage('');
    
    // Stop typing indicator
    realtimeMessaging.stopTyping(conversation.id);
    setIsTyping(false);

    // Track message analytics
    trackMessage(conversation.id, messageText.length, isFirstMessage);
    trackAction('message_sent', 'chat_input', { 
      messageLength: messageText.length,
      conversationId: conversation.id,
      isFirstMessage,
    });

    try {
      // Update status to sent
      updateMessageStatus(message.id, 'sent');
      
      // Send message through real-time service
      await realtimeMessaging.sendMessage(conversation.id, message);
      
      // Update status to delivered
      updateMessageStatus(message.id, 'delivered');
    } catch (error) {
      console.error('Failed to send message:', error);
      // Update status to failed
      updateMessageStatus(message.id, 'failed');
      
      // Queue for offline sync
      await queueAction({
        type: 'create',
        entity: 'message',
        entityId: message.id,
        data: { ...message, conversationId: conversation.id },
      });
    }
  };

  // Update message status
  const updateMessageStatus = (messageId: string, status: MessageStatus) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, status } : msg
    ));
  };

  // Handle typing indicator
  const handleTextChange = (text: string) => {
    setNewMessage(text);

    if (text.trim() && !isTyping) {
      setIsTyping(true);
      realtimeMessaging.startTyping(conversation.id);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      realtimeMessaging.stopTyping(conversation.id);
    }, 2000);

    // Stop typing immediately if text is empty
    if (!text.trim() && isTyping) {
      setIsTyping(false);
      realtimeMessaging.stopTyping(conversation.id);
    }
  };

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  const renderMessage = (message: ChatMessage, index: number): React.ReactElement => {
    const isFromUser = message.senderId === user?.id;
    const isSystem = message.type === 'system';
    const showDate = index === 0 || 
      new Date(messages[index - 1].timestamp).toDateString() !== new Date(message.timestamp).toDateString();

    return (
      <View key={message.id}>
        {showDate && (
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{formatDate(message.timestamp)}</Text>
          </View>
        )}
        
        {isSystem ? (
          <View style={styles.systemMessageContainer}>
            <Text style={styles.systemMessage}>{message.text || message.message}</Text>
          </View>
        ) : (
          <View style={[
            styles.messageContainer,
            isFromUser ? styles.userMessageContainer : styles.coachMessageContainer
          ]}>
            <View style={[
              styles.messageBubble,
              isFromUser ? styles.userMessageBubble : styles.coachMessageBubble
            ]}>
              <Text style={[
                styles.messageText,
                isFromUser ? styles.userMessageText : styles.coachMessageText
              ]}>
                {message.text || message.message}
              </Text>
              <View style={styles.messageFooter}>
                <Text style={[
                  styles.messageTime,
                  isFromUser ? styles.userMessageTime : styles.coachMessageTime
                ]}>
                  {formatTime(message.timestamp)}
                </Text>
                {isFromUser && message.status && (
                  <MessageStatusIndicator 
                    status={message.status} 
                    size="small"
                  />
                )}
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <NetworkStatus position="top" showWhenOnline={false} />
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.coachName}>{conversation.coachName}</Text>
          <Text style={[
            styles.status,
            { color: realtimeMessaging.connectionStatus === 'connected' ? '#28a745' : '#dc3545' }
          ]}>
            {realtimeMessaging.getUserOnlineStatus(conversation.coachId) && realtimeMessaging.connectionStatus === 'connected' ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.content} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message, index) => renderMessage(message, index))}
          
          {/* Typing indicator */}
          <TypingIndicator 
            userName={conversation.coachName}
            isVisible={otherUserTyping}
          />
        </ScrollView>

        <View style={styles.inputContainer}>
          <WorkaroundTextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={handleTextChange}
            placeholder="Type a message..."
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!newMessage.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 18,
    color: '#0066CC',
    fontWeight: '500',
  },
  headerInfo: {
    flex: 1,
  },
  coachName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  status: {
    fontSize: 14,
    color: '#28a745',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageContainer: {
    marginVertical: 4,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  coachMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userMessageBubble: {
    backgroundColor: '#0066CC',
    borderBottomRightRadius: 6,
  },
  coachMessageBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: 'white',
  },
  coachMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  coachMessageTime: {
    color: '#666',
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  systemMessage: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
});