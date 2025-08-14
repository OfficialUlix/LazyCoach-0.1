import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ColorScheme } from '../../theme/colors';
import { AvailabilityPicker, TimeSlot } from './AvailabilityPicker';
import { Coach } from '../../types';
import { FadeInView } from '../ui/FadeInView';
import { AnimatedButton } from '../ui/AnimatedButton';

interface SessionBookingFlowProps {
  coach: Coach;
  onBookingComplete: (bookingData: BookingData) => void;
  onCancel: () => void;
}

export interface BookingData {
  coachId: string;
  timeSlot: TimeSlot;
  sessionType: 'discovery' | 'coaching' | 'followup';
  duration: number;
  notes: string;
  price: number;
}

const SESSION_TYPES = [
  {
    id: 'discovery',
    name: 'Discovery Call',
    duration: 30,
    description: 'Free 30-minute consultation to discuss your goals',
    price: 0,
  },
  {
    id: 'coaching',
    name: 'Coaching Session',
    duration: 60,
    description: 'Full 60-minute one-on-one coaching session',
    price: 75,
  },
  {
    id: 'followup',
    name: 'Follow-up Session',
    duration: 45,
    description: '45-minute session to review progress and next steps',
    price: 60,
  },
];

export const SessionBookingFlow: React.FC<SessionBookingFlowProps> = ({
  coach,
  onBookingComplete,
  onCancel,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSessionType, setSelectedSessionType] = useState(SESSION_TYPES[0]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | undefined>();
  const [notes, setNotes] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  const totalSteps = 3;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleBooking = async () => {
    if (!selectedTimeSlot) {
      Alert.alert('Error', 'Please select a time slot');
      return;
    }

    setIsBooking(true);
    try {
      const bookingData: BookingData = {
        coachId: coach.id,
        timeSlot: selectedTimeSlot,
        sessionType: selectedSessionType.id as 'discovery' | 'coaching' | 'followup',
        duration: selectedSessionType.duration,
        notes: notes.trim(),
        price: selectedSessionType.price,
      };

      // Simulate booking API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onBookingComplete(bookingData);
    } catch (error) {
      Alert.alert('Error', 'Failed to book session. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedSessionType !== null;
      case 2:
        return selectedTimeSlot !== undefined;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${(currentStep / totalSteps) * 100}%` }
          ]} 
        />
      </View>
      <Text style={styles.progressText}>
        Step {currentStep} of {totalSteps}
      </Text>
    </View>
  );

  const renderSessionTypeSelection = () => (
    <FadeInView direction="up">
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Choose Session Type</Text>
        <Text style={styles.stepDescription}>
          Select the type of session you'd like to book with {coach.name}
        </Text>

        <View style={styles.sessionTypeContainer}>
          {SESSION_TYPES.map((sessionType) => (
            <TouchableOpacity
              key={sessionType.id}
              style={[
                styles.sessionTypeCard,
                selectedSessionType.id === sessionType.id && styles.selectedSessionTypeCard,
              ]}
              onPress={() => setSelectedSessionType(sessionType)}
            >
              <View style={styles.sessionTypeHeader}>
                <Text style={[
                  styles.sessionTypeName,
                  selectedSessionType.id === sessionType.id && styles.selectedSessionTypeName,
                ]}>
                  {sessionType.name}
                </Text>
                <Text style={[
                  styles.sessionTypePrice,
                  selectedSessionType.id === sessionType.id && styles.selectedSessionTypePrice,
                ]}>
                  {sessionType.price === 0 ? 'FREE' : `$${sessionType.price}`}
                </Text>
              </View>
              <Text style={[
                styles.sessionTypeDuration,
                selectedSessionType.id === sessionType.id && styles.selectedSessionTypeDuration,
              ]}>
                {sessionType.duration} minutes
              </Text>
              <Text style={[
                styles.sessionTypeDescription,
                selectedSessionType.id === sessionType.id && styles.selectedSessionTypeDescription,
              ]}>
                {sessionType.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </FadeInView>
  );

  const renderTimeSelection = () => (
    <FadeInView direction="up">
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Select Time</Text>
        <Text style={styles.stepDescription}>
          Choose an available time slot for your {selectedSessionType.name.toLowerCase()}
        </Text>

        <AvailabilityPicker
          availableSlots={coach.availability}
          selectedSlot={selectedTimeSlot}
          onSlotSelect={setSelectedTimeSlot}
        />
      </View>
    </FadeInView>
  );

  const renderConfirmation = () => (
    <FadeInView direction="up">
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Confirm Booking</Text>
        <Text style={styles.stepDescription}>
          Review your session details and add any notes
        </Text>

        <View style={styles.confirmationCard}>
          <View style={styles.confirmationRow}>
            <Text style={styles.confirmationLabel}>Coach:</Text>
            <Text style={styles.confirmationValue}>{coach.name}</Text>
          </View>
          <View style={styles.confirmationRow}>
            <Text style={styles.confirmationLabel}>Session:</Text>
            <Text style={styles.confirmationValue}>{selectedSessionType.name}</Text>
          </View>
          <View style={styles.confirmationRow}>
            <Text style={styles.confirmationLabel}>Duration:</Text>
            <Text style={styles.confirmationValue}>{selectedSessionType.duration} minutes</Text>
          </View>
          {selectedTimeSlot && (
            <>
              <View style={styles.confirmationRow}>
                <Text style={styles.confirmationLabel}>Date:</Text>
                <Text style={styles.confirmationValue}>
                  {new Date(selectedTimeSlot.date).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.confirmationRow}>
                <Text style={styles.confirmationLabel}>Time:</Text>
                <Text style={styles.confirmationValue}>
                  {selectedTimeSlot.start} - {selectedTimeSlot.end}
                </Text>
              </View>
            </>
          )}
          <View style={styles.confirmationRow}>
            <Text style={styles.confirmationLabel}>Price:</Text>
            <Text style={[styles.confirmationValue, styles.confirmationPrice]}>
              {selectedSessionType.price === 0 ? 'FREE' : `$${selectedSessionType.price}`}
            </Text>
          </View>
        </View>

        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any specific topics you'd like to focus on or questions you have..."
            placeholderTextColor={theme.textMuted}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
          <Text style={styles.notesCounter}>
            {notes.length}/500 characters
          </Text>
        </View>
      </View>
    </FadeInView>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderSessionTypeSelection();
      case 2:
        return renderTimeSelection();
      case 3:
        return renderConfirmation();
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderProgressBar()}
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {renderStepContent()}
      </ScrollView>

      <View style={styles.navigation}>
        <View style={styles.navigationButtons}>
          {currentStep > 1 ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}

          {currentStep < totalSteps ? (
            <AnimatedButton
              title="Next"
              onPress={handleNext}
              disabled={!canProceed()}
              style={styles.nextButton}
              animationType="scale"
            />
          ) : (
            <AnimatedButton
              title={isBooking ? 'Booking...' : 'Book Session'}
              onPress={handleBooking}
              disabled={!canProceed() || isBooking}
              loading={isBooking}
              style={styles.bookButton}
              animationType="pulse"
            />
          )}
        </View>
      </View>
    </View>
  );
};

const createStyles = (theme: ColorScheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  progressContainer: {
    padding: 20,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.border,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: 4,
    backgroundColor: theme.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
  },
  sessionTypeContainer: {
    gap: 16,
  },
  sessionTypeCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: theme.border,
  },
  selectedSessionTypeCard: {
    borderColor: theme.primary,
    backgroundColor: theme.primary + '10',
  },
  sessionTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionTypeName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  selectedSessionTypeName: {
    color: theme.primary,
  },
  sessionTypePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.success,
  },
  selectedSessionTypePrice: {
    color: theme.primary,
  },
  sessionTypeDuration: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 8,
  },
  selectedSessionTypeDuration: {
    color: theme.primary,
  },
  sessionTypeDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
  },
  selectedSessionTypeDescription: {
    color: theme.text,
  },
  confirmationCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 24,
  },
  confirmationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
  },
  confirmationLabel: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  confirmationValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text,
  },
  confirmationPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.primary,
  },
  notesContainer: {
    marginBottom: 20,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: theme.inputBackground,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.text,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  notesCounter: {
    fontSize: 12,
    color: theme.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },
  navigation: {
    padding: 20,
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.error,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: theme.error,
    fontWeight: '500',
  },
  nextButton: {
    flex: 2,
  },
  bookButton: {
    flex: 2,
    backgroundColor: theme.success,
  },
});