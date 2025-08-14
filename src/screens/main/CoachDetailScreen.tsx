import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { AvailabilityPicker } from '../../components/AvailabilityPicker';
import { Coach, Review } from '../../types';
import { MainStackParamList } from '../../types/navigation';
import { useMainNavigation } from '../../hooks/useNavigation';
import { useNotifications } from '../../hooks/useNotifications';
import { ColorScheme } from '../../theme/colors';
import PaymentSheet from '../../components/payment/PaymentSheet';
import { SessionPayment, paymentService } from '../../services/PaymentService';
import { analyticsService } from '../../services/AnalyticsService';

const FEATURE_FLAG_AVAILABILITY = true;

interface CoachDetailScreenProps {
  route: RouteProp<MainStackParamList, 'CoachDetail'>;
}

export const CoachDetailScreen: React.FC<CoachDetailScreenProps> = ({ route }) => {
  const navigation = useMainNavigation();
  const { theme } = useTheme();
  const { coach } = route.params;
  const { scheduleSessionReminder, isInitialized: notificationsInitialized } = useNotifications();
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showReviews, setShowReviews] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [sessionPayment, setSessionPayment] = useState<SessionPayment | null>(null);

  const handleAvailabilityChange = (slots: string[]): void => {
    setSelectedSlots(slots);
  };

  const handleDateSelect = (date: string): void => {
    setSelectedDate(date);
  };

  const getNextWeekDates = (): Array<{date: string, display: string, dayName: string}> => {
    const dates = [];
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push({
        date: date.toISOString().split('T')[0],
        display: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' })
      });
    }
    return dates;
  };

  const calculateTotalPrice = (): number => {
    return selectedSlots.length * (coach.price || 80);
  };

  const styles = createStyles(theme);

  const handleBookSession = async (): Promise<void> => {
    if (selectedSlots.length === 0) {
      Alert.alert('Please select at least one time slot', 'Choose your preferred session time to continue.');
      return;
    }

    if (!selectedDate) {
      Alert.alert('Please select a date', 'Choose your preferred session date to continue.');
      return;
    }

    const totalPrice = calculateTotalPrice();
    
    // Check if user has payment methods
    try {
      const paymentMethods = await paymentService.getPaymentMethods();
      if (paymentMethods.length === 0) {
        Alert.alert(
          'Payment Method Required',
          'Please add a payment method to book sessions.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Add Payment Method', 
              onPress: () => {
                // Navigate to payment methods screen
                Alert.alert('Info', 'Payment method setup would be handled here');
              }
            }
          ]
        );
        return;
      }
    } catch (error) {
      console.error('Error checking payment methods:', error);
      Alert.alert('Error', 'Failed to check payment methods. Please try again.');
      return;
    }

    // Track booking attempt
    analyticsService.trackBooking(coach.id, 'Personal Training', totalPrice);

    // Create session payment details
    const sessionDateTime = new Date(selectedDate);
    const [startHour] = selectedSlots[0].split('-');
    sessionDateTime.setHours(parseInt(startHour.padStart(2, '0')), 0, 0, 0);

    const payment: SessionPayment = {
      sessionId: `${coach.id}-${selectedDate}-${Date.now()}`,
      coachId: coach.id,
      amount: totalPrice,
      currency: 'USD',
      sessionType: `${selectedSlots.length} Session${selectedSlots.length !== 1 ? 's' : ''}`,
      description: `${coach.specialty} session${selectedSlots.length !== 1 ? 's' : ''} with ${coach.name}`,
      scheduledDate: sessionDateTime.toISOString(),
    };

    setSessionPayment(payment);
    setShowPaymentSheet(true);
  };

  const handlePaymentSuccess = async (paymentIntentId: string): Promise<void> => {
    try {
      // Create session details for each selected slot
      for (let i = 0; i < selectedSlots.length; i++) {
        const slot = selectedSlots[i];
        const sessionId = `${coach.id}-${selectedDate}-${slot}-${Date.now()}-${i}`;
        
        // Parse the slot time (e.g., "9-10" -> "09:00")
        const [startHour] = slot.split('-');
        const sessionDateTime = new Date(selectedDate);
        sessionDateTime.setHours(parseInt(startHour.padStart(2, '0')), 0, 0, 0);
        
        // Schedule notifications if available
        if (notificationsInitialized) {
          await scheduleSessionReminder(
            sessionId,
            coach.name,
            sessionDateTime,
            60 // 1 hour reminder
          );
        }
      }
      
      // Track successful booking
      analyticsService.track('session_booked_successfully', {
        coachId: coach.id,
        sessionCount: selectedSlots.length,
        totalAmount: calculateTotalPrice(),
        paymentIntentId,
        scheduledDate: selectedDate,
      });
      
      const notificationMessage = notificationsInitialized 
        ? 'Your session has been booked and reminders have been scheduled!'
        : 'Your session has been booked. Enable notifications to receive reminders.';
        
      Alert.alert('Payment Successful!', notificationMessage);
      
      // Reset form
      setSelectedSlots([]);
      setSelectedDate('');
      setSessionPayment(null);
    } catch (error) {
      console.error('Error completing booking after payment:', error);
      Alert.alert('Booking Error', 'Payment was successful but there was an issue completing your booking. Please contact support.');
    }
  };

  const handlePaymentCancel = (): void => {
    setShowPaymentSheet(false);
    setSessionPayment(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <Text style={styles.title}>{coach.name}</Text>
          <Text style={styles.subtitle}>{coach.specialty}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>⭐ {coach.rating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{coach.sessions}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{coach.priceDisplay}</Text>
              <Text style={styles.statLabel}>Per Hour</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>
            {coach.description}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience & Expertise</Text>
          <View style={styles.tagsContainer}>
            {coach.tags.map((tag: string, index: number) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.experienceText}>
            {coach.experience}+ years of experience • Speaks {coach.languages.join(', ')}
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Reviews ({coach.reviews.length})</Text>
            <TouchableOpacity onPress={() => setShowReviews(!showReviews)}>
              <Text style={styles.viewAllText}>
                {showReviews ? 'Show Less' : 'View All'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {coach.reviews.slice(0, showReviews ? undefined : 2).map((review: Review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewerName}>{review.userName}</Text>
                <View style={styles.ratingContainer}>
                  <Text style={styles.reviewRating}>{'⭐'.repeat(review.rating)}</Text>
                </View>
              </View>
              <Text style={styles.reviewComment}>{review.comment}</Text>
              <Text style={styles.reviewDate}>
                {new Date(review.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
          ))}
        </View>

        {FEATURE_FLAG_AVAILABILITY && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Book a Session</Text>
            
            <View style={styles.datePickerContainer}>
              <Text style={styles.datePickerTitle}>Select Date</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroller}>
                {getNextWeekDates().map((dateObj) => (
                  <TouchableOpacity
                    key={dateObj.date}
                    style={[
                      styles.dateCard,
                      selectedDate === dateObj.date && styles.selectedDateCard
                    ]}
                    onPress={() => handleDateSelect(dateObj.date)}
                  >
                    <Text style={[
                      styles.dayName,
                      selectedDate === dateObj.date && styles.selectedDateText
                    ]}>
                      {dateObj.dayName}
                    </Text>
                    <Text style={[
                      styles.dateDisplay,
                      selectedDate === dateObj.date && styles.selectedDateText
                    ]}>
                      {dateObj.display}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {selectedDate && (
              <View style={styles.timeSlotsContainer}>
                <AvailabilityPicker onSelectionChange={handleAvailabilityChange} />
              </View>
            )}
            
            {selectedSlots.length > 0 && selectedDate && (
              <View style={styles.selectionSummary}>
                <View style={styles.bookingSummary}>
                  <Text style={styles.selectedInfo}>
                    {selectedSlots.length} session{selectedSlots.length !== 1 ? 's' : ''} on {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </Text>
                  <Text style={styles.totalPrice}>Total: ${calculateTotalPrice()}</Text>
                </View>
                <TouchableOpacity style={styles.bookButton} onPress={handleBookSession}>
                  <Text style={styles.bookButtonText}>
                    Book Session{selectedSlots.length !== 1 ? 's' : ''} - ${calculateTotalPrice()}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Payment Sheet */}
      {sessionPayment && (
        <PaymentSheet
          visible={showPaymentSheet}
          onClose={handlePaymentCancel}
          onSuccess={handlePaymentSuccess}
          sessionPayment={sessionPayment}
        />
      )}
    </SafeAreaView>
  );
};

const createStyles = (theme: ColorScheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#0066CC',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: theme.surface,
    padding: 20,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#0066CC',
    fontWeight: '500',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  statLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 4,
  },
  section: {
    backgroundColor: theme.surface,
    padding: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.textSecondary,
  },
  selectionSummary: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedInfo: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 12,
  },
  bookButton: {
    backgroundColor: theme.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#0066CC',
  },
  tagText: {
    fontSize: 12,
    color: '#0066CC',
    fontWeight: '500',
  },
  experienceText: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 8,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '500',
  },
  reviewCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  reviewRating: {
    fontSize: 12,
  },
  reviewComment: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  datePickerContainer: {
    marginBottom: 20,
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 12,
  },
  dateScroller: {
    marginBottom: 16,
  },
  dateCard: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 60,
  },
  selectedDateCard: {
    backgroundColor: theme.primary,
    borderColor: '#0066CC',
  },
  dayName: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  dateDisplay: {
    fontSize: 14,
    color: theme.text,
    fontWeight: '600',
  },
  selectedDateText: {
    color: 'white',
  },
  timeSlotsContainer: {
    marginBottom: 20,
  },
  bookingSummary: {
    marginBottom: 12,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066CC',
    marginTop: 4,
  },
});