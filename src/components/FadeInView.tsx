import React, { useEffect, useRef } from "react";
import { Animated, ViewStyle } from "react-native";

interface FadeInViewProps {
  delay?: number;
  duration?: number;
  style?: ViewStyle | ViewStyle[];
  children: React.ReactNode;
}

/**
 * A simple fade + slide-up entrance animation using core React Native Animated.
 * Compatible with Expo Go (no native modules required).
 */
export const FadeInView: React.FC<FadeInViewProps> = ({
  delay = 0,
  duration = 400,
  style,
  children,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay,
        useNativeDriver: true,
        speed: 14,
        bounciness: 4,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        { opacity, transform: [{ translateY }] },
        ...(Array.isArray(style) ? style : style ? [style] : []),
      ]}
    >
      {children}
    </Animated.View>
  );
};
