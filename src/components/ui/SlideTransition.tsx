import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, ViewStyle } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface SlideTransitionProps {
  children: React.ReactNode;
  visible: boolean;
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: number;
  style?: ViewStyle;
  onAnimationComplete?: () => void;
}

export const SlideTransition: React.FC<SlideTransitionProps> = ({
  children,
  visible,
  direction = 'right',
  duration = 300,
  style,
  onAnimationComplete,
}) => {
  const slideAnim = useRef(new Animated.Value(getInitialValue(direction))).current;

  function getInitialValue(dir: string): number {
    switch (dir) {
      case 'left':
        return -screenWidth;
      case 'right':
        return screenWidth;
      case 'up':
        return -screenHeight;
      case 'down':
        return screenHeight;
      default:
        return screenWidth;
    }
  }

  function getTransform() {
    switch (direction) {
      case 'left':
      case 'right':
        return [{ translateX: slideAnim }];
      case 'up':
      case 'down':
        return [{ translateY: slideAnim }];
      default:
        return [{ translateX: slideAnim }];
    }
  }

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : getInitialValue(direction),
      duration,
      useNativeDriver: true,
    }).start(() => {
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    });
  }, [visible, direction, duration]);

  return (
    <Animated.View
      style={[
        {
          transform: getTransform(),
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

// Modal slide transition
export const ModalSlideTransition: React.FC<{
  children: React.ReactNode;
  visible: boolean;
  onClose?: () => void;
}> = ({ children, visible, onClose }) => {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible && slideAnim._value === screenHeight) {
    return null;
  }

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        opacity: opacityAnim,
        justifyContent: 'flex-end',
      }}
    >
      <Animated.View
        style={{
          transform: [{ translateY: slideAnim }],
          backgroundColor: 'white',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: screenHeight * 0.9,
        }}
      >
        {children}
      </Animated.View>
    </Animated.View>
  );
};