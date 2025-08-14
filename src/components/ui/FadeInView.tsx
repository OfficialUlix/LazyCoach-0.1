import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface FadeInViewProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  style?: ViewStyle;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
}

export const FadeInView: React.FC<FadeInViewProps> = ({
  children,
  duration = 500,
  delay = 0,
  style,
  direction = 'none',
  distance = 20,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    const animations = [
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }),
    ];

    if (direction !== 'none') {
      animations.push(
        Animated.timing(translateAnim, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        })
      );
    }

    const animation = Animated.parallel(animations);

    if (delay > 0) {
      setTimeout(() => animation.start(), delay);
    } else {
      animation.start();
    }
  }, [fadeAnim, translateAnim, duration, delay, direction]);

  const getTransform = () => {
    if (direction === 'none') return [];

    switch (direction) {
      case 'up':
        return [{ translateY: translateAnim }];
      case 'down':
        return [{ translateY: Animated.multiply(translateAnim, -1) }];
      case 'left':
        return [{ translateX: translateAnim }];
      case 'right':
        return [{ translateX: Animated.multiply(translateAnim, -1) }];
      default:
        return [];
    }
  };

  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: getTransform(),
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

// Stagger multiple FadeInViews
export const StaggeredFadeInView: React.FC<{
  children: React.ReactNode[];
  duration?: number;
  staggerDelay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}> = ({ 
  children, 
  duration = 500, 
  staggerDelay = 100, 
  direction = 'up' 
}) => {
  return (
    <>
      {children.map((child, index) => (
        <FadeInView
          key={index}
          duration={duration}
          delay={index * staggerDelay}
          direction={direction}
        >
          {child}
        </FadeInView>
      ))}
    </>
  );
};