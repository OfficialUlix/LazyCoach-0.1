import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
  type?: 'error' | 'warning' | 'info';
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  retryText = 'Try Again',
  type = 'error',
}) => {
  const getIconForType = (): string => {
    switch (type) {
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❌';
    }
  };

  const getColorForType = (): string => {
    switch (type) {
      case 'warning':
        return '#ff9500';
      case 'info':
        return '#007AFF';
      default:
        return '#ff3b30';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>{getIconForType()}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        {onRetry && (
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: getColorForType() }]}
            onPress={onRetry}
          >
            <Text style={styles.retryButtonText}>{retryText}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});