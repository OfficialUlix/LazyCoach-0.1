import React, { useState, useRef } from 'react';
import { TextInput, TextInputProps, Platform, Alert } from 'react-native';

interface WorkaroundTextInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
}

export const WorkaroundTextInput: React.FC<WorkaroundTextInputProps> = ({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  ...props
}) => {
  const [internalValue, setInternalValue] = useState(value);
  const inputRef = useRef<TextInput>(null);

  const handleTextChange = (text: string): void => {
    // iOS Simulator workaround for character replacement bug
    if (Platform.OS === 'ios') {
      // If we detect repeated 'A's, show an alert with manual input option
      if (text.match(/^a+$/i) && text.length > 1) {
        Alert.prompt(
          `Enter ${placeholder || 'text'}`,
          'Type the text you want to enter:',
          (inputText) => {
            if (inputText) {
              setInternalValue(inputText);
              onChangeText(inputText);
            }
          },
          'plain-text',
          value
        );
        return;
      }
    }
    
    setInternalValue(text);
    onChangeText(text);
  };

  // For password fields on iOS, use more aggressive anti-autofill props
  const iosPasswordProps = Platform.OS === 'ios' && secureTextEntry ? {
    textContentType: "none" as const,
    autoComplete: "off" as const,
    autoCorrect: false,
    spellCheck: false,
    passwordRules: "",
    importantForAutofill: "no" as const,
    clearButtonMode: "never" as const,
    contextMenuHidden: true,
    selectTextOnFocus: false,
    keyboardType: "default" as const,
    secureTextEntry: true,
  } : {};

  // Generate stable key to prevent iOS caching but avoid React warnings
  const inputKey = `input-${placeholder || 'text'}-${secureTextEntry ? 'secure' : 'plain'}`;

  return (
    <TextInput
      ref={inputRef}
      key={inputKey}
      value={internalValue}
      onChangeText={handleTextChange}
      placeholder={placeholder}
      secureTextEntry={secureTextEntry}
      autoCapitalize="none"
      autoComplete="off"
      autoCorrect={false}
      spellCheck={false}
      textContentType="none"
      clearButtonMode="never"
      selectTextOnFocus={false}
      contextMenuHidden={true}
      passwordRules=""
      importantForAutofill="no"
      keyboardType={props.keyboardType || "default"}
      enablesReturnKeyAutomatically={false}
      returnKeyType="done"
      style={[props.style]}
      {...iosPasswordProps}
      {...props}
    />
  );
};