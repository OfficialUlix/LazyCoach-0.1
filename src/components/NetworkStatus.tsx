import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useOfflineData } from '../hooks/useOfflineData';
import { ColorScheme } from '../theme/colors';

export interface NetworkStatusProps {
  showWhenOnline?: boolean;
  position?: 'top' | 'bottom';
  onSyncPress?: () => void;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({
  showWhenOnline = false,
  position = 'top',
  onSyncPress,
}) => {
  const { theme } = useTheme();
  const { isOnline, isSyncing, networkType, forceSyncAll } = useOfflineData();
  const [visible, setVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const styles = createStyles(theme);

  useEffect(() => {
    const shouldShow = !isOnline || (showWhenOnline && isOnline);
    
    if (shouldShow !== visible) {
      setVisible(shouldShow);
      
      Animated.timing(fadeAnim, {
        toValue: shouldShow ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOnline, showWhenOnline, visible, fadeAnim]);

  const handleSyncPress = async () => {
    if (onSyncPress) {
      onSyncPress();
    } else {
      try {
        await forceSyncAll();
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }
  };

  if (!visible) {
    return null;
  }

  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        text: 'Offline - Changes will sync when connected',
        backgroundColor: theme.warning,
        textColor: '#fff',
        icon: '📱',
        showSyncButton: false,
      };
    }

    if (isSyncing) {
      return {
        text: 'Syncing changes...',
        backgroundColor: theme.info,
        textColor: '#fff',
        icon: '🔄',
        showSyncButton: false,
      };
    }

    return {
      text: `Connected via ${networkType}`,
      backgroundColor: theme.success,
      textColor: '#fff',
      icon: '✅',
      showSyncButton: true,
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <Animated.View
      style={[
        styles.container,
        position === 'bottom' ? styles.bottom : styles.top,
        { backgroundColor: statusInfo.backgroundColor },
        { opacity: fadeAnim },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>{statusInfo.icon}</Text>
        <Text style={[styles.text, { color: statusInfo.textColor }]}>
          {statusInfo.text}
        </Text>
        {statusInfo.showSyncButton && isOnline && (
          <TouchableOpacity
            style={styles.syncButton}
            onPress={handleSyncPress}
            disabled={isSyncing}
          >
            <Text style={styles.syncButtonText}>
              {isSyncing ? 'Syncing...' : 'Sync'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const createStyles = (theme: ColorScheme) => StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  top: {
    top: 0,
  },
  bottom: {
    bottom: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
  syncButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});