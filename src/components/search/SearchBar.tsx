import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WorkaroundTextInput } from '../WorkaroundTextInput';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = "Search coaches, specialties, or skills..."
}) => {
  return (
    <View style={styles.container}>
      <WorkaroundTextInput
        style={styles.searchInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType="default"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
});