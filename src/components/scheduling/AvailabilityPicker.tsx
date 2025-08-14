import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ColorScheme } from '../../theme/colors';

export interface TimeSlot {
  id: string;
  start: string;
  end: string;
  available: boolean;
  date: string;
}

interface AvailabilityPickerProps {
  availableSlots: TimeSlot[];
  selectedSlot?: TimeSlot;
  onSlotSelect: (slot: TimeSlot) => void;
  minDate?: Date;
  maxDate?: Date;
}

export const AvailabilityPicker: React.FC<AvailabilityPickerProps> = ({
  availableSlots,
  selectedSlot,
  onSlotSelect,
  minDate = new Date(),
  maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [selectedDate, setSelectedDate] = useState<string>(
    selectedSlot?.date || getNextAvailableDate()
  );

  function getNextAvailableDate(): string {
    const today = new Date();
    const dates = getUniqueDates();
    return dates.find(date => new Date(date) >= today) || dates[0] || today.toISOString().split('T')[0];
  }

  function getUniqueDates(): string[] {
    const dates = [...new Set(availableSlots.map(slot => slot.date))];
    return dates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }

  function getAvailableSlotsForDate(date: string): TimeSlot[] {
    return availableSlots
      .filter(slot => slot.date === date && slot.available)
      .sort((a, b) => a.start.localeCompare(b.start));
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric' 
      });
    }
  }

  function formatTime(timeString: string): string {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  function getTimeRange(slot: TimeSlot): string {
    return `${formatTime(slot.start)} - ${formatTime(slot.end)}`;
  }

  const uniqueDates = getUniqueDates();
  const slotsForSelectedDate = getAvailableSlotsForDate(selectedDate);

  return (
    <View style={styles.container}>
      {/* Date Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
          {uniqueDates.map((date) => (
            <TouchableOpacity
              key={date}
              style={[
                styles.dateButton,
                selectedDate === date && styles.selectedDateButton,
              ]}
              onPress={() => setSelectedDate(date)}
            >
              <Text style={[
                styles.dateButtonText,
                selectedDate === date && styles.selectedDateButtonText,
              ]}>
                {formatDate(date)}
              </Text>
              <Text style={[
                styles.dayText,
                selectedDate === date && styles.selectedDayText,
              ]}>
                {new Date(date).getDate()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Time Slots */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Available Times for {formatDate(selectedDate)}
        </Text>
        {slotsForSelectedDate.length === 0 ? (
          <View style={styles.noSlotsContainer}>
            <Text style={styles.noSlotsText}>
              No available time slots for this date
            </Text>
            <Text style={styles.noSlotsSubtext}>
              Please select a different date
            </Text>
          </View>
        ) : (
          <View style={styles.timeSlotsContainer}>
            {slotsForSelectedDate.map((slot) => (
              <TouchableOpacity
                key={slot.id}
                style={[
                  styles.timeSlotButton,
                  selectedSlot?.id === slot.id && styles.selectedTimeSlotButton,
                ]}
                onPress={() => onSlotSelect(slot)}
              >
                <Text style={[
                  styles.timeSlotText,
                  selectedSlot?.id === slot.id && styles.selectedTimeSlotText,
                ]}>
                  {getTimeRange(slot)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Selected Slot Summary */}
      {selectedSlot && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Selected Session</Text>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryDate}>
              {formatDate(selectedSlot.date)}
            </Text>
            <Text style={styles.summaryTime}>
              {getTimeRange(selectedSlot)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: ColorScheme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 16,
  },
  dateScroll: {
    flexGrow: 0,
  },
  dateButton: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 1,
    borderColor: theme.border,
  },
  selectedDateButton: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  dateButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textSecondary,
    marginBottom: 4,
  },
  selectedDateButtonText: {
    color: 'white',
  },
  dayText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
  },
  selectedDayText: {
    color: 'white',
  },
  noSlotsContainer: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  noSlotsText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  noSlotsSubtext: {
    fontSize: 14,
    color: theme.textMuted,
    textAlign: 'center',
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeSlotButton: {
    backgroundColor: theme.surface,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.border,
    minWidth: 120,
    alignItems: 'center',
  },
  selectedTimeSlotButton: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text,
  },
  selectedTimeSlotText: {
    color: 'white',
  },
  summaryContainer: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.primary,
    borderStyle: 'dashed',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 12,
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryDate: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.primary,
  },
  summaryTime: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.primary,
  },
});