import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme as useDeviceColorScheme } from "react-native";
import { storage } from "../utils/storage";

export type ThemeType = "light" | "dark";
export type ThemeMode = "light" | "dark" | "system";

export interface ThemeColors {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  accent: string;
  accentText: string;
  blue: string;
  green: string;
  gray: string;
  red: string;
}

const themeColors: Record<ThemeType, ThemeColors> = {
  light: {
    background: "#f4f4f5", // Zinc-100 / Zinc-50 look
    card: "#ffffff",
    text: "#242424", // Charcoal
    textSecondary: "#898989", // Mid-gray
    border: "rgba(34, 42, 53, 0.08)",
    accent: "#242424",
    accentText: "#ffffff",
    blue: "#0099ff",
    green: "#22c55e",
    gray: "#e4e4e7",
    red: "#ef4444",
  },
  dark: {
    background: "#000000",
    card: "#111111", // Midnight
    text: "#ffffff",
    textSecondary: "#a0a0a0",
    border: "rgba(255, 255, 255, 0.1)",
    accent: "#ffffff",
    accentText: "#111111",
    blue: "#0099ff",
    green: "#22c55e",
    gray: "#27272a",
    red: "#ef4444",
  },
};

interface ThemeContextData {
  theme: ThemeType;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const deviceColorScheme = useDeviceColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [theme, setTheme] = useState<ThemeType>("dark"); // Default dark mode as preferred by the premium brand

  useEffect(() => {
    // Load stored theme preference
    storage.getItem("theme_mode").then((storedMode) => {
      if (storedMode) {
        setThemeModeState(storedMode as ThemeMode);
      }
    });
  }, []);

  useEffect(() => {
    const resolvedTheme =
      themeMode === "system" ? (deviceColorScheme === "light" ? "light" : "dark") : themeMode;
    setTheme(resolvedTheme);
  }, [themeMode, deviceColorScheme]);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await storage.setItem("theme_mode", mode);
  };

  const colors = themeColors[theme];

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
