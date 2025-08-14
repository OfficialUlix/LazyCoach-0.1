import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

interface LoadingProps {
  message?: string;
  size?: 'small' | 'large';
  overlay?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({ 
  message = 'Loading...', 
  size = 'large',
  overlay = false 
}) => {
  const containerStyle = overlay ? styles.overlayContainer : styles.container;

  return (
    <View style={containerStyle}>
      <ActivityIndicator size={size} color="#0066CC" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    />
  );
};

export const LoadingCard: React.FC = () => {
  return (
    <View style={styles.loadingCard}>
      <Skeleton width={50} height={50} borderRadius={25} style={{ marginBottom: 12 }} />
      <Skeleton width="80%" height={18} style={{ marginBottom: 8 }} />
      <Skeleton width="60%" height={14} style={{ marginBottom: 8 }} />
      <Skeleton width="40%" height={14} />
    </View>
  );
};

export const LoadingList: React.FC<{ itemCount?: number }> = ({ itemCount = 3 }) => {
  return (
    <View style={styles.loadingList}>
      {Array.from({ length: itemCount }).map((_, index) => (
        <LoadingCard key={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 249, 250, 0.8)',
    zIndex: 1000,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  skeleton: {
    backgroundColor: '#e9ecef',
    opacity: 0.7,
  },
  loadingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingList: {
    padding: 20,
  },
});