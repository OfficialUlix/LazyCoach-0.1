import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ColorScheme } from '../../theme/colors';

interface TypingIndicatorProps {
  userName?: string;
  isVisible: boolean;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  userName = 'Someone',
  isVisible,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;
  const containerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      // Fade in the container
      Animated.timing(containerAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Start the typing animation
      startTypingAnimation();
    } else {
      // Fade out the container
      Animated.timing(containerAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  const startTypingAnimation = () => {
    const createDotAnimation = (animatedValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    Animated.parallel([
      createDotAnimation(dot1Anim, 0),
      createDotAnimation(dot2Anim, 200),
      createDotAnimation(dot3Anim, 400),
    ]).start();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity: containerAnim }]}>
      <View style={styles.bubble}>
        <Text style={styles.typingText}>{userName} is typing</Text>
        <View style={styles.dotsContainer}>
          <Animated.View
            style={[
              styles.dot,
              {
                opacity: dot1Anim,
                transform: [
                  {
                    scale: dot1Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.3],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                opacity: dot2Anim,
                transform: [
                  {
                    scale: dot2Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.3],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                opacity: dot3Anim,
                transform: [
                  {
                    scale: dot3Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.3],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );
};

// Simple version for inline use
export const InlineTypingIndicator: React.FC<{ isVisible: boolean }> = ({ isVisible }) => {
  const { theme } = useTheme();
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      const createDotAnimation = (animatedValue: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(animatedValue, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(animatedValue, {
              toValue: 0.3,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        );
      };

      Animated.parallel([
        createDotAnimation(dot1Anim, 0),
        createDotAnimation(dot2Anim, 200),
        createDotAnimation(dot3Anim, 400),
      ]).start();
    } else {
      dot1Anim.setValue(0.3);
      dot2Anim.setValue(0.3);
      dot3Anim.setValue(0.3);
    }
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  const dotStyle = {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.textSecondary,
    marginHorizontal: 1,
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }}>
      <Animated.View style={[dotStyle, { opacity: dot1Anim }]} />
      <Animated.View style={[dotStyle, { opacity: dot2Anim }]} />
      <Animated.View style={[dotStyle, { opacity: dot3Anim }]} />
    </View>
  );
};

const createStyles = (theme: ColorScheme) => StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'flex-start',
  },
  bubble: {
    backgroundColor: theme.surface,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '80%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  typingText: {
    fontSize: 12,
    color: theme.textSecondary,
    fontStyle: 'italic',
    marginRight: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.primary,
    marginHorizontal: 1,
  },
});