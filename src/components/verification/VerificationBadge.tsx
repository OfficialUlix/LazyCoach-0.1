import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ColorScheme } from '../../theme/colors';

interface VerificationBadgeProps {
  isVerified: boolean;
  level?: 'basic' | 'premium' | 'elite';
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  isVerified,
  level = 'basic',
  size = 'medium',
  showText = true,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme, size);

  if (!isVerified) {
    return null;
  }

  const getBadgeConfig = () => {
    switch (level) {
      case 'elite':
        return {
          icon: '👑',
          text: 'Elite Verified',
          colors: {
            background: '#FFD700',
            text: '#8B7D00',
            border: '#B8860B',
          },
        };
      case 'premium':
        return {
          icon: '🛡️',
          text: 'Premium Verified',
          colors: {
            background: theme.primary + '20',
            text: theme.primary,
            border: theme.primary,
          },
        };
      case 'basic':
      default:
        return {
          icon: '✓',
          text: 'Verified',
          colors: {
            background: theme.success + '20',
            text: theme.success,
            border: theme.success,
          },
        };
    }
  };

  const badgeConfig = getBadgeConfig();

  return (
    <View style={[
      styles.badge,
      { 
        backgroundColor: badgeConfig.colors.background,
        borderColor: badgeConfig.colors.border,
      }
    ]}>
      <Text style={[styles.icon, { color: badgeConfig.colors.text }]}>
        {badgeConfig.icon}
      </Text>
      {showText && (
        <Text style={[styles.text, { color: badgeConfig.colors.text }]}>
          {badgeConfig.text}
        </Text>
      )}
    </View>
  );
};

const createStyles = (theme: ColorScheme, size: 'small' | 'medium' | 'large') => {
  const sizeConfig = {
    small: {
      paddingHorizontal: 6,
      paddingVertical: 3,
      fontSize: 10,
      iconSize: 12,
      borderRadius: 4,
    },
    medium: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      fontSize: 12,
      iconSize: 14,
      borderRadius: 6,
    },
    large: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      fontSize: 14,
      iconSize: 16,
      borderRadius: 8,
    },
  };

  const config = sizeConfig[size];

  return StyleSheet.create({
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: config.paddingHorizontal,
      paddingVertical: config.paddingVertical,
      borderRadius: config.borderRadius,
      borderWidth: 1,
    },
    icon: {
      fontSize: config.iconSize,
      marginRight: 4,
    },
    text: {
      fontSize: config.fontSize,
      fontWeight: '600',
    },
  });
};