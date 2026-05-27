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
import { Compass, Mail, AlertCircle, ArrowRight, ChevronLeft, Check } from "lucide-react-native";

export default function RecoverScreen() {
  const { recoverPassword } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRecover = async () => {
    if (!email) {
      setError("Por favor ingresa tu correo electrónico");
      return;
    }

    setError(null);
    setLoading(true);

    const result = await recoverPassword(email.trim());

    setLoading(false);
    if (!result.success) {
      setError(result.error || "Error al enviar el correo de recuperación");
    } else {
      setSuccess(true);
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
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { borderColor: colors.border }]}
            activeOpacity={0.7}
          >
            <ChevronLeft size={20} color={colors.text} />
          </TouchableOpacity>

          {/* Brand Header */}
          <View style={styles.brandHeader}>
            <View style={[styles.iconContainer, { backgroundColor: colors.accent }]}>
              <Compass size={24} color={colors.accentText} />
            </View>
            <Text style={[styles.brandText, { color: colors.text }]}>VECTOR</Text>
          </View>

          {/* Title */}
          <View style={styles.heroSection}>
            <Text style={[styles.heroTitle, { color: colors.text }]}>
              Recuperar.
            </Text>
            <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
              Ingresa tu correo para recibir un enlace de restablecimiento de contraseña.
            </Text>
          </View>

          {/* Success Banner */}
          {success ? (
            <View style={[styles.successBanner, { backgroundColor: colors.green + "15", borderColor: colors.green + "30" }]}>
              <Check size={18} color={colors.green} style={styles.errorIcon} />
              <Text style={[styles.successText, { color: colors.green }]}>
                Correo enviado con éxito. Revisa tu bandeja de entrada.
              </Text>
            </View>
          ) : (
            <>
              {/* Error Banner */}
              {error && (
                <View style={[styles.errorBanner, { backgroundColor: colors.red + "15", borderColor: colors.red + "30" }]}>
                  <AlertCircle size={18} color={colors.red} style={styles.errorIcon} />
                  <Text style={[styles.errorText, { color: colors.red }]}>{error}</Text>
                </View>
              )}

              {/* Form */}
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

                <CustomButton
                  title="Enviar Enlace"
                  onPress={handleRecover}
                  loading={loading}
                  icon={<ArrowRight size={16} color={colors.accentText} />}
                  style={styles.submitButton}
                />
              </View>
            </>
          )}

          {/* Bottom Redirect */}
          <View style={styles.footerSection}>
            <TouchableOpacity onPress={() => router.replace("/(auth)/login")} activeOpacity={0.7}>
              <Text style={[styles.registerLink, { color: colors.text }]}>
                Volver al Ingreso
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
    paddingTop: Platform.OS === "ios" ? 20 : 40,
    paddingBottom: 40,
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 40 : 20,
    left: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  brandHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 36,
    marginTop: 60,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
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
  successBanner: {
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
  successText: {
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    lineHeight: 18,
  },
  formSection: {
    width: "100%",
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
  registerLink: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
