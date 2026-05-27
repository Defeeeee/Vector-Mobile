import React, { useEffect, useState, useRef } from "react";
import { Tabs, Redirect } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  ActivityIndicator,
  View,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Text,
  Keyboard,
  Animated,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Compass, History as HistoryIcon, PlusCircle, Settings as SettingsIcon } from "lucide-react-native";

// Custom Floating Tab Bar Component
function FloatingTabBar({ state, descriptors, navigation }: any) {
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current; // 0 = visible, 1 = hidden

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setKeyboardVisible(false);
      });
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  if (isKeyboardVisible && Platform.OS !== "ios") {
    // Completely unmount on Android when keyboard is active to avoid space allocation bugs
    return null;
  }

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 120],
  });

  const opacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  return (
    <Animated.View
      style={[
        styles.barContainer,
        {
          transform: [{ translateY }],
          opacity,
          backgroundColor: colors.card === "#ffffff" ? "rgba(255,255,255,0.96)" : "rgba(17,17,17,0.96)",
          borderColor: colors.border,
          bottom: Math.max(insets.bottom, 16),
          shadowColor: "#000",
          shadowOpacity: theme === "dark" ? 0.35 : 0.08,
          shadowRadius: 16,
        },
      ]}
    >
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch (e) {}

          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Select the icon based on the route name
        let IconComponent = Compass;
        let label = "Inicio";

        if (route.name === "index") {
          IconComponent = Compass;
          label = "Inicio";
        } else if (route.name === "history") {
          IconComponent = HistoryIcon;
          label = "Bitácora";
        } else if (route.name === "log-flight") {
          IconComponent = PlusCircle;
          label = "Registrar";
        } else if (route.name === "settings") {
          IconComponent = SettingsIcon;
          label = "Ajustes";
        }

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.8}
            style={styles.tabButton}
          >
            <View
              style={[
                styles.iconContainer,
                isFocused && {
                  backgroundColor: colors.accent,
                },
              ]}
            >
              <IconComponent
                size={20}
                color={isFocused ? colors.accentText : colors.textSecondary}
                strokeWidth={isFocused ? 2.5 : 2}
              />
            </View>
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isFocused ? colors.text : colors.textSecondary,
                  fontWeight: isFocused ? "800" : "500",
                },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </Animated.View>
  );
}

export default function DashboardLayout() {
  const { isAuthenticated, loading } = useAuth();
  const { colors } = useTheme();

  // If auth is loading, show loading spinner
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  // If not authenticated, redirect to login page immediately
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="history" />
      <Tabs.Screen name="log-flight" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  barContainer: {
    position: "absolute",
    left: 20,
    right: 20,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
    elevation: 8,
    shadowOffset: { width: 0, height: 6 },
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    paddingVertical: 8,
  },
  iconContainer: {
    width: 44,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 3,
  },
  tabLabel: {
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
