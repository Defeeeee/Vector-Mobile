import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import * as Haptics from "expo-haptics";

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const CustomButton: React.FC<CustomButtonProps> = React.memo(({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  icon,
  style,
}) => {
  const { colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getButtonStyles = (): ViewStyle => {
    switch (variant) {
      case "secondary":
        return {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1,
        };
      case "danger":
        return {
          backgroundColor: colors.red + "20",
          borderColor: colors.red + "40",
          borderWidth: 1,
        };
      case "primary":
      default:
        return {
          backgroundColor: colors.accent,
          borderColor: "transparent",
        };
    }
  };

  const getTextStyles = (): TextStyle => {
    switch (variant) {
      case "secondary":
        return { color: colors.text };
      case "danger":
        return { color: colors.red };
      case "primary":
      default:
        return { color: colors.accentText };
    }
  };

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }], width: "100%" }}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled || loading}
        style={[
          styles.button,
          getButtonStyles(),
          (disabled || loading) && styles.disabled,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={getTextStyles().color} />
        ) : (
          <>
            <Text style={[styles.text, getTextStyles()]}>{title}</Text>
            {icon && <Animated.View style={styles.iconWrapper}>{icon}</Animated.View>}
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  button: {
    height: 54,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    width: "100%",
  },
  text: {
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 2,
    textAlign: "center",
  },
  disabled: {
    opacity: 0.5,
  },
  iconWrapper: {
    marginLeft: 8,
  },
});
