import React, { useRef } from 'react';
import { TextInput, TextInputProps, Platform } from 'react-native';

interface CustomTextInputProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
}

export const CustomTextInput: React.FC<CustomTextInputProps> = ({
  value,
  onChangeText,
  ...props
}) => {
  const inputRef = useRef<TextInput>(null);

  // iOS Simulator fix for character replacement bug
  const handleTextChange = (text: string): void => {
    if (Platform.OS === 'ios') {
      // Clear and reset on iOS to prevent character replacement
      if (inputRef.current) {
        inputRef.current.clear();
        setTimeout(() => {
          onChangeText(text);
        }, 0);
      }
    } else {
      onChangeText(text);
    }
  };

  return (
    <TextInput
      ref={inputRef}
      value={value}
      onChangeText={handleTextChange}
      autoCapitalize="none"
      autoComplete="off"
      autoCorrect={false}
      spellCheck={false}
      textContentType="none"
      clearButtonMode="while-editing"
      selectTextOnFocus={false}
      contextMenuHidden={true}
      {...props}
    />
  );
};