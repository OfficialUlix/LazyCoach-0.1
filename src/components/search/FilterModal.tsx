import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
}

export interface FilterOptions {
  specialty?: string;
  priceRange: [number, number];
  minRating: number;
}

const specialties = [
  'All Specialties',
  'Life & Career Coach',
  'Business Coach',
  'Wellness Coach',
  'Executive Coach',
  'Relationship Coach',
];

const priceRanges = [
  { label: 'Any Price', range: [0, 500] as [number, number] },
  { label: '$50-$80', range: [50, 80] as [number, number] },
  { label: '$80-$120', range: [80, 120] as [number, number] },
  { label: '$120-$200', range: [120, 200] as [number, number] },
];

const ratings = [
  { label: 'Any Rating', value: 0 },
  { label: '4+ Stars', value: 4 },
  { label: '4.5+ Stars', value: 4.5 },
];

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApply,
  currentFilters,
}) => {
  const [specialty, setSpecialty] = useState(currentFilters.specialty || 'All Specialties');
  const [priceRange, setPriceRange] = useState<[number, number]>(currentFilters.priceRange);
  const [minRating, setMinRating] = useState(currentFilters.minRating);

  const handleApply = (): void => {
    onApply({
      specialty: specialty === 'All Specialties' ? undefined : specialty,
      priceRange,
      minRating,
    });
    onClose();
  };

  const handleReset = (): void => {
    setSpecialty('All Specialties');
    setPriceRange([0, 500]);
    setMinRating(0);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Filter Coaches</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetButton}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specialty</Text>
            {specialties.map((spec) => (
              <TouchableOpacity
                key={spec}
                style={[
                  styles.option,
                  specialty === spec && styles.selectedOption,
                ]}
                onPress={() => setSpecialty(spec)}
              >
                <Text style={[
                  styles.optionText,
                  specialty === spec && styles.selectedOptionText,
                ]}>
                  {spec}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price Range</Text>
            {priceRanges.map((range) => (
              <TouchableOpacity
                key={range.label}
                style={[
                  styles.option,
                  priceRange[0] === range.range[0] && priceRange[1] === range.range[1] && styles.selectedOption,
                ]}
                onPress={() => setPriceRange(range.range)}
              >
                <Text style={[
                  styles.optionText,
                  priceRange[0] === range.range[0] && priceRange[1] === range.range[1] && styles.selectedOptionText,
                ]}>
                  {range.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Minimum Rating</Text>
            {ratings.map((rating) => (
              <TouchableOpacity
                key={rating.label}
                style={[
                  styles.option,
                  minRating === rating.value && styles.selectedOption,
                ]}
                onPress={() => setMinRating(rating.value)}
              >
                <Text style={[
                  styles.optionText,
                  minRating === rating.value && styles.selectedOptionText,
                ]}>
                  {rating.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  cancelButton: {
    color: '#666',
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  resetButton: {
    color: '#0066CC',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
  },
  selectedOption: {
    backgroundColor: '#0066CC',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedOptionText: {
    color: 'white',
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  applyButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});