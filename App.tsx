import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { ThemeProvider } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { serviceManager } from './src/services/ServiceManager';
import { logger } from './src/utils/logger';

export default function App(): React.ReactElement {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeApp = async () => {
      try {
        logger.info('[App] LazyCoach starting...');
        const startTime = performance.now();
        
        await serviceManager.initializeServices();
        
        const duration = performance.now() - startTime;
        logger.info(`[App] Services initialized in ${duration.toFixed(0)}ms`);
        
        // Check if required services are healthy
        const summary = serviceManager.getInitializationSummary();
        logger.info('[App] Initialization summary:', summary);
        
        if (!serviceManager.areRequiredServicesHealthy()) {
          logger.warn('[App] Some required services failed to initialize');
        }
        
        if (mounted) {
          setIsInitializing(false);
        }
      } catch (error) {
        logger.error('[App] Failed to initialize services:', error);
        if (mounted) {
          setInitError((error as Error).message || 'Service initialization failed');
          setIsInitializing(false);
        }
      }
    };

    initializeApp();

    return () => {
      mounted = false;
    };
  }, []);

  // Show loading screen while initializing
  if (isInitializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>
          Initializing LazyCoach...
        </Text>
      </View>
    );
  }

  // Show error screen if initialization failed
  if (initError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5', padding: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#d32f2f', marginBottom: 12, textAlign: 'center' }}>
          Initialization Failed
        </Text>
        <Text style={{ fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24 }}>
          {initError}
        </Text>
        <Text style={{ fontSize: 14, color: '#999', textAlign: 'center', marginTop: 16 }}>
          The app will continue with limited functionality.
        </Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}