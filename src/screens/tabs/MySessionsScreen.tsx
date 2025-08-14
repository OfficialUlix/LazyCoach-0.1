import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { BookedSession } from '../../types';
import { Loading } from '../../components/LoadingStates';
import { ErrorDisplay } from '../../components/ErrorDisplay';
import { ReviewModal } from '../../components/ReviewModal';
import { useMainNavigation } from '../../hooks/useNavigation';
import { getCoachById } from '../../utils/mockData';
import { useNotifications } from '../../hooks/useNotifications';
import { useSessions } from '../../hooks/useDataService';

const mockSessions: BookedSession[] = [
  {
    id: '1',
    coachId: '1',
    coachName: 'Sarah Johnson',
    timeSlot: {
      id: '1-1',
      start: '09:00',
      end: '10:00',
      available: false,
      date: '2025-01-20',
    },
    status: 'upcoming',
    price: 80,
    notes: 'Focus on career transition planning',
  },
  {
    id: '2',
    coachId: '2',
    coachName: 'Michael Chen',
    timeSlot: {
      id: '2-1',
      start: '16:00',
      end: '17:00',
      available: false,
      date: '2025-01-18',
    },
    status: 'upcoming',
    price: 120,
    notes: 'Business strategy session',
  },
  {
    id: '3',
    coachId: '1',
    coachName: 'Sarah Johnson',
    timeSlot: {
      id: '1-2',
      start: '10:00',
      end: '11:00',
      available: false,
      date: '2025-01-10',
    },
    status: 'completed',
    price: 80,
    notes: 'Great session on goal setting',
  },
];

export const MySessionsScreen: React.FC = () => {
  const navigation = useMainNavigation();
  const { user } = useAuth();
  const { cancelSessionNotifications, scheduledCount } = useNotifications();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingSession, setReviewingSession] = useState<BookedSession | null>(null);

  // Use the new data service with caching
  const { 
    data: sessions, 
    loading, 
    error, 
    refresh,
    isCached 
  } = useSessions(user?.id || '', { 
    useCache: true, 
    cacheTTL: 2 * 60 * 1000 // 2 minute cache for fresh session data
  });

  const getFilteredSessions = (): BookedSession[] => {
    return (sessions || []).filter(session => session.status === activeTab);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'upcoming':
        return '#0066CC';
      case 'completed':
        return '#28a745';
      case 'cancelled':
        return '#dc3545';
      default:
        return '#666';
    }
  };

  const handleSessionPress = (session: BookedSession): void => {
    const coach = getCoachById(session.coachId);
    if (coach) {
      navigation.navigate('CoachDetail', { coach });
    }
  };

  const handleLeaveReview = (session: BookedSession): void => {
    setReviewingSession(session);
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (rating: number, comment: string): Promise<void> => {
    if (!reviewingSession) return;
    
    try {
      // TODO: Implement API call to submit review
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('Thank you!', 'Your review has been submitted successfully.');
    } catch (error) {
      throw new Error('Failed to submit review');
    }
  };

  const handleCancelSession = (session: BookedSession): void => {
    Alert.alert(
      'Cancel Session',
      `Are you sure you want to cancel your session with ${session.coachName}?`,
      [
        { text: 'Keep Session', style: 'cancel' },
        { 
          text: 'Cancel Session', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Cancel associated notifications
              await cancelSessionNotifications(session.id);
              
              // TODO: Implement actual session cancellation API call
              Alert.alert(
                'Session Cancelled', 
                'Your session has been cancelled. Reminder notifications have been removed and you will receive a refund within 3-5 business days.'
              );
            } catch (error) {
              console.error('Error cancelling session:', error);
              Alert.alert('Error', 'Failed to cancel session. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleBookAgain = (session: BookedSession): void => {
    const coach = getCoachById(session.coachId);
    if (coach) {
      navigation.navigate('CoachDetail', { coach });
    }
  };

  const filteredSessions = getFilteredSessions();

  if (loading && !sessions) {
    return <Loading message="Loading your sessions..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>My Sessions</Text>
            <Text style={styles.subtitle}>Manage your coaching appointments</Text>
          </View>
          <View style={styles.headerBadges}>
            {isCached && (
              <View style={styles.cacheBadge}>
                <Text style={styles.cacheText}>📱 Cached</Text>
              </View>
            )}
            {scheduledCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>🔔 {scheduledCount}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
            Upcoming ({(sessions || []).filter(s => s.status === 'upcoming').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            Completed ({(sessions || []).filter(s => s.status === 'completed').length})
          </Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <ErrorDisplay
          title="Failed to load sessions"
          message={error}
          onRetry={refresh}
          retryText="Reload Sessions"
        />
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredSessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>
              No {activeTab} sessions
            </Text>
            <Text style={styles.emptyStateText}>
              {activeTab === 'upcoming' 
                ? 'Book a session with one of our amazing coaches!'
                : 'Complete your first session to see it here.'
              }
            </Text>
            {activeTab === 'upcoming' && (
              <TouchableOpacity
                style={styles.browseButton}
                onPress={() => navigation.navigate('Home')}
              >
                <Text style={styles.browseButtonText}>Browse Coaches</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredSessions.map((session) => (
            <TouchableOpacity
              key={session.id}
              style={styles.sessionCard}
              onPress={() => handleSessionPress(session)}
            >
              <View style={styles.sessionHeader}>
                <Text style={styles.coachName}>{session.coachName}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(session.status) }]}>
                  <Text style={styles.statusText}>
                    {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                  </Text>
                </View>
              </View>

              <View style={styles.sessionDetails}>
                <Text style={styles.sessionDate}>
                  📅 {formatDate(session.timeSlot.date)}
                </Text>
                <Text style={styles.sessionTime}>
                  🕐 {session.timeSlot.start} - {session.timeSlot.end}
                </Text>
                <Text style={styles.sessionPrice}>
                  💰 ${session.price}
                </Text>
              </View>

              {session.notes && (
                <View style={styles.notesSection}>
                  <Text style={styles.notesLabel}>Notes:</Text>
                  <Text style={styles.notesText}>{session.notes}</Text>
                </View>
              )}

              <View style={styles.sessionActions}>
                {session.status === 'upcoming' ? (
                  <>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => navigation.navigate('Messages')}
                    >
                      <Text style={styles.actionButtonText}>Message Coach</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.cancelButton]}
                      onPress={() => handleCancelSession(session)}
                    >
                      <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleBookAgain(session)}
                    >
                      <Text style={styles.actionButtonText}>Book Again</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleLeaveReview(session)}
                    >
                      <Text style={styles.actionButtonText}>Leave Review</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
        </ScrollView>
      )}

      <ReviewModal
        visible={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setReviewingSession(null);
        }}
        coachName={reviewingSession?.coachName || ''}
        onSubmit={handleSubmitReview}
      />
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerBadges: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  cacheBadge: {
    backgroundColor: '#28a745',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 40,
    alignItems: 'center',
  },
  cacheText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  notificationBadge: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 40,
    alignItems: 'center',
  },
  notificationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#0066CC',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#0066CC',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sessionCard: {
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
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  coachName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  sessionDetails: {
    marginBottom: 12,
  },
  sessionDate: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  sessionTime: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  sessionPrice: {
    fontSize: 16,
    color: '#0066CC',
    fontWeight: '600',
  },
  notesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  sessionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#0066CC',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  cancelButtonText: {
    color: '#dc3545',
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