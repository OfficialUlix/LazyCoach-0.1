import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Conversation } from '../../types';
import { Loading } from '../../components/Loading';
import { useMainNavigation } from '../../hooks/useNavigation';

const mockConversations: Conversation[] = [
  {
    id: '1',
    coachId: '1',
    coachName: 'Sarah Johnson',
    lastMessage: 'Looking forward to our session tomorrow!',
    lastMessageTime: '2025-01-11T14:30:00Z',
    unreadCount: 2,
    messages: [],
  },
  {
    id: '2',
    coachId: '2',
    coachName: 'Michael Chen',
    lastMessage: 'Here are the resources I mentioned...',
    lastMessageTime: '2025-01-10T16:45:00Z',
    unreadCount: 0,
    messages: [],
  },
  {
    id: '3',
    coachId: '3',
    coachName: 'Emily Rodriguez',
    lastMessage: 'Thanks for the great session!',
    lastMessageTime: '2025-01-09T11:20:00Z',
    unreadCount: 1,
    messages: [],
  },
];

export const MessagesScreen: React.FC = () => {
  const navigation = useMainNavigation();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setConversations(mockConversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const handleConversationPress = (conversation: Conversation): void => {
    navigation.navigate('Chat', { conversation });
  };

  if (isLoading && !refreshing) {
    return <Loading />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>Chat with your coaches</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No messages yet</Text>
            <Text style={styles.emptyStateText}>
              Start a conversation by booking a session with a coach!
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.browseButtonText}>Find Coaches</Text>
            </TouchableOpacity>
          </View>
        ) : (
          conversations.map((conversation) => (
            <TouchableOpacity
              key={conversation.id}
              style={styles.conversationCard}
              onPress={() => handleConversationPress(conversation)}
            >
              <View style={styles.conversationHeader}>
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatar}>
                    {conversation.coachName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.conversationInfo}>
                  <View style={styles.nameContainer}>
                    <Text style={styles.coachName}>{conversation.coachName}</Text>
                    <Text style={styles.timestamp}>
                      {formatTime(conversation.lastMessageTime)}
                    </Text>
                  </View>
                  <View style={styles.messageContainer}>
                    <Text 
                      style={[
                        styles.lastMessage,
                        conversation.unreadCount > 0 && styles.unreadMessage
                      ]} 
                      numberOfLines={1}
                    >
                      {conversation.lastMessage}
                    </Text>
                    {conversation.unreadCount > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadCount}>
                          {conversation.unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  conversationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatar: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  conversationInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  coachName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    marginRight: 8,
  },
  unreadMessage: {
    color: '#333',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#0066CC',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  browseButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});