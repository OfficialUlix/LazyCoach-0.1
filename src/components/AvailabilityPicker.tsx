import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

interface TimeSlot {
  id: string;
  start: string;
  end: string;
  available: boolean;
}

interface AvailabilityPickerProps {
  onSelectionChange?: (selectedSlots: string[]) => void;
}

export const AvailabilityPicker: React.FC<AvailabilityPickerProps> = ({
  onSelectionChange,
}) => {
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

  const timeSlots: TimeSlot[] = [
    { id: '9-10', start: '09:00', end: '10:00', available: true },
    { id: '10-11', start: '10:00', end: '11:00', available: true },
    { id: '11-12', start: '11:00', end: '12:00', available: false },
    { id: '14-15', start: '14:00', end: '15:00', available: true },
    { id: '15-16', start: '15:00', end: '16:00', available: true },
    { id: '16-17', start: '16:00', end: '17:00', available: true },
  ];

  const toggleSlot = (slotId: string): void => {
    const updatedSelection = selectedSlots.includes(slotId)
      ? selectedSlots.filter(id => id !== slotId)
      : [...selectedSlots, slotId];
    
    setSelectedSlots(updatedSelection);
    onSelectionChange?.(updatedSelection);
  };

  const renderTimeSlot = (slot: TimeSlot): React.ReactElement => {
    const isSelected = selectedSlots.includes(slot.id);
    const isDisabled = !slot.available;

    return (
      <TouchableOpacity
        key={slot.id}
        style={[
          styles.timeSlot,
          isSelected && styles.selectedSlot,
          isDisabled && styles.disabledSlot,
        ]}
        onPress={() => !isDisabled && toggleSlot(slot.id)}
        disabled={isDisabled}
      >
        <Text style={[
          styles.timeText,
          isSelected && styles.selectedText,
          isDisabled && styles.disabledText,
        ]}>
          {slot.start} - {slot.end}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Available Time Slots</Text>
      <ScrollView contentContainerStyle={styles.slotsContainer}>
        {timeSlots.map(renderTimeSlot)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  slotsContainer: {
    gap: 8,
  },
  timeSlot: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  selectedSlot: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  disabledSlot: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ccc',
  },
  timeText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
  selectedText: {
    color: 'white',
    fontWeight: '600',
  },
  disabledText: {
    color: '#999',
  },
});