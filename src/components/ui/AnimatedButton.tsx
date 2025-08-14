import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  Animated,
  StyleSheet,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ColorScheme } from '../../theme/colors';

interface AnimatedButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  animationType?: 'scale' | 'bounce' | 'pulse' | 'none';
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  animationType = 'scale',
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme, variant, size);
  
  const scaleValue = useRef(new Animated.Value(1)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled || loading) return;

    switch (animationType) {
      case 'scale':
        Animated.spring(scaleValue, {
          toValue: 0.95,
          useNativeDriver: true,
          tension: 300,
          friction: 10,
        }).start();
        break;
      case 'bounce':
        Animated.spring(scaleValue, {
          toValue: 0.9,
          useNativeDriver: true,
          tension: 400,
          friction: 5,
        }).start();
        break;
      case 'pulse':
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.05,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
        break;
    }
  };

  const handlePressOut = () => {
    if (disabled || loading) return;

    switch (animationType) {
      case 'scale':
        Animated.spring(scaleValue, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 10,
        }).start();
        break;
      case 'bounce':
        Animated.spring(scaleValue, {
          toValue: 1,
          useNativeDriver: true,
          tension: 400,
          friction: 5,
        }).start();
        break;
    }
  };

  const getAnimatedStyle = () => {
    const baseStyle: any = {};
    
    if (animationType === 'scale' || animationType === 'bounce') {
      baseStyle.transform = [{ scale: scaleValue }];
    }
    
    if (animationType === 'pulse') {
      baseStyle.transform = [{ scale: pulseValue }];
    }
    
    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabledButton, style]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={animationType === 'none' ? 0.7 : 1}
    >
      <Animated.View style={[styles.content, getAnimatedStyle()]}>
        <Text style={[styles.text, disabled && styles.disabledText, textStyle]}>
          {loading ? 'Loading...' : title}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const createStyles = (
  theme: ColorScheme,
  variant: 'primary' | 'secondary' | 'outline' | 'ghost',
  size: 'small' | 'medium' | 'large'
) => {
  const sizeConfig = {
    small: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      fontSize: 14,
      borderRadius: 8,
    },
    medium: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      fontSize: 16,
      borderRadius: 10,
    },
    large: {
      paddingVertical: 16,
      paddingHorizontal: 24,
      fontSize: 18,
      borderRadius: 12,
    },
  };

  const variantConfig = {
    primary: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
      textColor: 'white',
    },
    secondary: {
      backgroundColor: theme.secondary,
      borderColor: theme.secondary,
      textColor: 'white',
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: theme.primary,
      textColor: theme.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      textColor: theme.primary,
    },
  };

  const config = sizeConfig[size];
  const colors = variantConfig[variant];

  return StyleSheet.create({
    button: {
      backgroundColor: colors.backgroundColor,
      borderWidth: 1,
      borderColor: colors.borderColor,
      borderRadius: config.borderRadius,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      paddingVertical: config.paddingVertical,
      paddingHorizontal: config.paddingHorizontal,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      fontSize: config.fontSize,
      fontWeight: '600',
      color: colors.textColor,
    },
    disabledButton: {
      backgroundColor: theme.disabled,
      borderColor: theme.disabled,
      opacity: 0.6,
    },
    disabledText: {
      color: theme.textMuted,
    },
  });
};