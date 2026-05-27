import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { CustomInput } from "../../components/CustomInput";
import { CustomButton } from "../../components/CustomButton";
import { Compass, Mail, Lock, AlertCircle, ArrowRight } from "lucide-react-native";

export default function LoginScreen() {
  const { login } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Por favor completa todos los campos");
      return;
    }

    setError(null);
    setLoading(true);

    const result = await login(email.trim(), password);

    setLoading(false);
    if (!result.success) {
      setError(result.error || "Error de inicio de sesión");
    } else {
      router.replace("/(dashboard)");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand Header */}
          <View style={styles.brandHeader}>
            <View style={[styles.iconContainer, { backgroundColor: colors.accent }]}>
              <Compass size={24} color={colors.accentText} />
            </View>
            <Text style={[styles.brandText, { color: colors.text }]}>VECTOR</Text>
          </View>

          {/* Hero text */}
          <View style={styles.heroSection}>
            <Text style={[styles.heroTitle, { color: colors.text }]}>
              Registros precisos.{"\n"}Cero fricción.
            </Text>
            <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
              Bitácora de grado aeronáutico digital de alto contraste.
            </Text>
          </View>

          {/* Error Banner */}
          {error && (
            <View style={[styles.errorBanner, { backgroundColor: colors.red + "15", borderColor: colors.red + "30" }]}>
              <AlertCircle size={18} color={colors.red} style={styles.errorIcon} />
              <Text style={[styles.errorText, { color: colors.red }]}>{error}</Text>
            </View>
          )}

          {/* Inputs Section */}
          <View style={styles.formSection}>
            <CustomInput
              label="Correo Electrónico"
              placeholder="piloto@vector.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              icon={<Mail size={18} color={colors.textSecondary} />}
            />

            <CustomInput
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              icon={<Lock size={18} color={colors.textSecondary} />}
            />

            <TouchableOpacity
              onPress={() => router.push("/(auth)/recover")}
              style={styles.forgotButton}
              activeOpacity={0.7}
            >
              <Text style={[styles.forgotText, { color: colors.blue }]}>
                ¿Olvidaste tu contraseña?
              </Text>
            </TouchableOpacity>

            <CustomButton
              title="Ingresar"
              onPress={handleLogin}
              loading={loading}
              icon={<ArrowRight size={16} color={colors.accentText} />}
              style={styles.submitButton}
            />
          </View>

          {/* Registration Redirect */}
          <View style={styles.footerSection}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              ¿No tienes cuenta?
            </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/register")} activeOpacity={0.7}>
              <Text style={[styles.registerLink, { color: colors.text }]}>
                {" "}Empezar
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 40 : 60,
    paddingBottom: 40,
    justifyContent: "center",
  },
  brandHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 48,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  brandText: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2,
  },
  heroSection: {
    marginBottom: 32,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
    lineHeight: 36,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  errorIcon: {
    marginRight: 10,
  },
  errorText: {
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  formSection: {
    width: "100%",
  },
  forgotButton: {
    alignSelf: "flex-end",
    marginTop: -8,
    marginBottom: 28,
    paddingVertical: 4,
  },
  forgotText: {
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  submitButton: {
    marginTop: 8,
  },
  footerSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
  footerText: {
    fontSize: 12,
    fontWeight: "600",
  },
  registerLink: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
