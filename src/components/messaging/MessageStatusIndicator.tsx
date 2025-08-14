import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ColorScheme } from '../../theme/colors';
import { MessageStatus } from '../../types';

interface MessageStatusIndicatorProps {
  status: MessageStatus;
  size?: 'small' | 'medium';
}

export const MessageStatusIndicator: React.FC<MessageStatusIndicatorProps> = ({
  status,
  size = 'small',
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme, size);

  const getStatusConfig = () => {
    switch (status) {
      case 'sending':
        return {
          icon: '⏳',
          color: theme.textSecondary,
          text: 'Sending...',
        };
      case 'sent':
        return {
          icon: '✓',
          color: theme.textSecondary,
          text: 'Sent',
        };
      case 'delivered':
        return {
          icon: '✓✓',
          color: theme.textSecondary,
          text: 'Delivered',
        };
      case 'read':
        return {
          icon: '✓✓',
          color: theme.primary,
          text: 'Read',
        };
      case 'failed':
        return {
          icon: '❌',
          color: theme.error,
          text: 'Failed',
        };
      default:
        return {
          icon: '',
          color: theme.textSecondary,
          text: '',
        };
    }
  };

  const statusConfig = getStatusConfig();

  if (!statusConfig.icon) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.icon, { color: statusConfig.color }]}>
        {statusConfig.icon}
      </Text>
      {size === 'medium' && (
        <Text style={[styles.text, { color: statusConfig.color }]}>
          {statusConfig.text}
        </Text>
      )}
    </View>
  );
};

const createStyles = (theme: ColorScheme, size: 'small' | 'medium') => {
  const sizeConfig = {
    small: {
      iconSize: 12,
      textSize: 10,
      spacing: 4,
    },
    medium: {
      iconSize: 14,
      textSize: 12,
      spacing: 6,
    },
  };

  const config = sizeConfig[size];

  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: config.spacing,
    },
    icon: {
      fontSize: config.iconSize,
      marginRight: size === 'medium' ? 4 : 0,
    },
    text: {
      fontSize: config.textSize,
      fontWeight: '500',
    },
  });
};