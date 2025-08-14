import React, { Component, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { themes } from '../theme/colors';
import { analyticsService } from '../services/AnalyticsService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetOnPropsChange?: any;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to analytics with error handling
    try {
      analyticsService.trackError(error, {
        component: 'ErrorBoundary',
        errorInfo: errorInfo.componentStack,
      });
    } catch (analyticsError) {
      console.warn('Failed to track error to analytics:', analyticsError);
    }

    // Call custom error handler with error handling
    try {
      if (this.props.onError) {
        this.props.onError(error, errorInfo);
      }
    } catch (handlerError) {
      console.warn('Error handler failed:', handlerError);
    }

    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    // Reset error boundary when specified props change
    if (
      this.state.hasError &&
      this.props.resetOnPropsChange !== prevProps.resetOnPropsChange
    ) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return <DefaultErrorFallback 
        error={this.state.error} 
        onRetry={this.resetErrorBoundary}
      />;
    }

    return this.props.children;
  }
}

interface DefaultErrorFallbackProps {
  error: Error | null;
  onRetry: () => void;
}

const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({ 
  error, 
  onRetry 
}) => {
  const theme = themes.light; // Default to light theme for error boundary

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={[styles.emoji, { color: theme.error }]}>😵</Text>
        <Text style={[styles.title, { color: theme.text }]}>
          Oops! Something went wrong
        </Text>
        <Text style={[styles.message, { color: theme.textSecondary }]}>
          The app encountered an unexpected error. Don't worry, your data is safe.
        </Text>
        
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.primary }]}
          onPress={onRetry}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>

        {__DEV__ && error && (
          <ScrollView style={styles.errorDetails} showsVerticalScrollIndicator={false}>
            <Text style={[styles.errorTitle, { color: theme.error }]}>
              Error Details (Development Only):
            </Text>
            <Text style={[styles.errorText, { color: theme.textMuted }]}>
              {error.toString()}
            </Text>
            <Text style={[styles.errorText, { color: theme.textMuted }]}>
              {error.stack}
            </Text>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

// Specialized error boundaries for different sections
export const ScreenErrorBoundary: React.FC<{
  children: ReactNode;
  screenName: string;
}> = ({ children, screenName }) => {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        analyticsService.trackError(error, {
          screen: screenName,
          errorInfo: errorInfo.componentStack,
        });
      }}
      fallback={
        <View style={styles.screenErrorFallback}>
          <Text style={styles.screenErrorTitle}>Unable to load {screenName}</Text>
          <Text style={styles.screenErrorMessage}>
            Please try refreshing the page or navigate back.
          </Text>
        </View>
      }
    >
      {children}
    </ErrorBoundary>
  );
};

export const ComponentErrorBoundary: React.FC<{
  children: ReactNode;
  componentName: string;
}> = ({ children, componentName }) => {
  return (
    <ErrorBoundary
      fallback={
        <View style={styles.componentErrorFallback}>
          <Text style={styles.componentErrorText}>
            Failed to load {componentName}
          </Text>
        </View>
      }
    >
      {children}
    </ErrorBoundary>
  );
};

// Service-specific error boundaries
export const ServiceErrorBoundary: React.FC<{
  children: ReactNode;
  serviceName: string;
  fallbackComponent?: ReactNode;
}> = ({ children, serviceName, fallbackComponent }) => {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error(`[${serviceName}] Service error:`, error);
        
        // Try to track error safely
        try {
          analyticsService.trackError(error, {
            service: serviceName,
            errorInfo: errorInfo.componentStack,
          });
        } catch (trackingError) {
          console.warn('Failed to track service error:', trackingError);
        }
      }}
      fallback={fallbackComponent || (
        <View style={styles.serviceErrorFallback}>
          <Text style={styles.serviceErrorTitle}>Service Unavailable</Text>
          <Text style={styles.serviceErrorText}>
            {serviceName} is temporarily unavailable. Some features may not work as expected.
          </Text>
        </View>
      )}
    >
      {children}
    </ErrorBoundary>
  );
};

// Network-related error boundary
export const NetworkErrorBoundary: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={
        <View style={styles.networkErrorFallback}>
          <Text style={styles.networkErrorTitle}>Connection Issue</Text>
          <Text style={styles.networkErrorText}>
            Unable to connect to our servers. Please check your internet connection and try again.
          </Text>
        </View>
      }
    >
      {children}
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorDetails: {
    maxHeight: 200,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    width: '100%',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  screenErrorFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  screenErrorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  screenErrorMessage: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
  },
  componentErrorFallback: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignItems: 'center',
  },
  componentErrorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  serviceErrorFallback: {
    padding: 20,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffeaa7',
    margin: 16,
    alignItems: 'center',
  },
  serviceErrorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
    textAlign: 'center',
  },
  serviceErrorText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
    lineHeight: 20,
  },
  networkErrorFallback: {
    padding: 20,
    backgroundColor: '#f8d7da',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f5c6cb',
    margin: 16,
    alignItems: 'center',
  },
  networkErrorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#721c24',
    marginBottom: 8,
    textAlign: 'center',
  },
  networkErrorText: {
    fontSize: 14,
    color: '#721c24',
    textAlign: 'center',
    lineHeight: 20,
  },
});