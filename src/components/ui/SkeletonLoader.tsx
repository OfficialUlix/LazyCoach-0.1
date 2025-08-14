import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ColorScheme } from '../../theme/colors';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
  count?: number;
  spacing?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
  count = 1,
  spacing = 8,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.skeleton, theme.skeletonHighlight],
  });

  const renderSkeleton = (index: number) => (
    <Animated.View
      key={index}
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor,
          marginBottom: index < count - 1 ? spacing : 0,
        },
        style,
      ]}
    />
  );

  return (
    <View>
      {Array.from({ length: count }, (_, index) => renderSkeleton(index))}
    </View>
  );
};

// Specific skeleton components for common use cases
export const CoachCardSkeleton: React.FC = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.coachCard}>
      <View style={styles.coachCardHeader}>
        <SkeletonLoader width={60} height={60} borderRadius={30} />
        <View style={styles.coachCardInfo}>
          <SkeletonLoader width="80%" height={16} />
          <SkeletonLoader width="60%" height={14} />
          <SkeletonLoader width="70%" height={12} />
        </View>
      </View>
      <SkeletonLoader width="100%" height={40} />
    </View>
  );
};

export const MessageSkeleton: React.FC<{ isUser?: boolean }> = ({ isUser = false }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.otherMessage]}>
      <View style={styles.messageBubble}>
        <SkeletonLoader width="80%" height={14} />
        <SkeletonLoader width="60%" height={14} />
        <SkeletonLoader width="30%" height={12} />
      </View>
    </View>
  );
};

export const SessionCardSkeleton: React.FC = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <SkeletonLoader width="70%" height={16} />
        <SkeletonLoader width="50%" height={14} />
      </View>
      <SkeletonLoader width="100%" height={1} />
      <View style={styles.sessionDetails}>
        <SkeletonLoader width="40%" height={14} />
        <SkeletonLoader width="30%" height={14} />
      </View>
    </View>
  );
};

const createStyles = (theme: ColorScheme) => StyleSheet.create({
  skeleton: {
    // Base skeleton styles handled by animated view
  },
  coachCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  coachCardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  coachCardInfo: {
    flex: 1,
    marginLeft: 12,
    gap: 6,
  },
  messageContainer: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    backgroundColor: theme.surface,
    borderRadius: 18,
    padding: 12,
    maxWidth: '80%',
    gap: 4,
  },
  sessionCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  sessionHeader: {
    marginBottom: 12,
    gap: 6,
  },
  sessionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
});