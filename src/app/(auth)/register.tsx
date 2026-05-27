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
import { Compass, User, Mail, Lock, AlertCircle, ArrowRight, Check } from "lucide-react-native";

export default function RegisterScreen() {
  const { register } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password) {
      setError("Todos los campos son obligatorios");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setError(null);
    setLoading(true);

    const result = await register(
      email.trim(),
      password,
      firstName.trim(),
      lastName.trim()
    );

    setLoading(false);
    if (!result.success) {
      setError(result.error || "Error al crear la cuenta");
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <View style={styles.successContainer}>
          <View style={[styles.successIconWrapper, { backgroundColor: colors.green }]}>
            <Check size={32} color="#ffffff" />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>¡Cuenta Creada!</Text>
          <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
            Hemos enviado un correo de confirmación. Por favor, verifica tu casilla de correo antes de ingresar.
          </Text>
          <CustomButton
            title="Ir al Ingreso"
            onPress={() => router.replace("/(auth)/login")}
            style={styles.successButton}
          />
        </View>
      </SafeAreaView>
    );
  }

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

          {/* Title */}
          <View style={styles.heroSection}>
            <Text style={[styles.heroTitle, { color: colors.text }]}>
              Empezar.
            </Text>
            <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
              Crea tu bitácora digital en menos de un minuto.
            </Text>
          </View>

          {/* Error Banner */}
          {error && (
            <View style={[styles.errorBanner, { backgroundColor: colors.red + "15", borderColor: colors.red + "30" }]}>
              <AlertCircle size={18} color={colors.red} style={styles.errorIcon} />
              <Text style={[styles.errorText, { color: colors.red }]}>{error}</Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.formSection}>
            <View style={styles.nameRow}>
              <View style={styles.flex1}>
                <CustomInput
                  label="Nombre"
                  placeholder="John"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCorrect={false}
                  icon={<User size={18} color={colors.textSecondary} />}
                />
              </View>
              <View style={[styles.flex1, { marginLeft: 12 }]}>
                <CustomInput
                  label="Apellido"
                  placeholder="Doe"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCorrect={false}
                  icon={<User size={18} color={colors.textSecondary} />}
                />
              </View>
            </View>

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
              placeholder="Min. 6 caracteres"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              icon={<Lock size={18} color={colors.textSecondary} />}
            />

            <CustomButton
              title="Registrar Cuenta"
              onPress={handleRegister}
              loading={loading}
              icon={<ArrowRight size={16} color={colors.accentText} />}
              style={styles.submitButton}
            />
          </View>

          {/* Back Redirect */}
          <View style={styles.footerSection}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              ¿Ya tienes cuenta?
            </Text>
            <TouchableOpacity onPress={() => router.replace("/(auth)/login")} activeOpacity={0.7}>
              <Text style={[styles.registerLink, { color: colors.text }]}>
                {" "}Ingresar
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
    marginBottom: 36,
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
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
    lineHeight: 36,
    marginBottom: 8,
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
    marginBottom: 20,
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
  nameRow: {
    flexDirection: "row",
    width: "100%",
  },
  flex1: {
    flex: 1,
  },
  submitButton: {
    marginTop: 16,
  },
  footerSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
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
  successContainer: {
    paddingHorizontal: 32,
    alignItems: "center",
    textAlign: "center",
  },
  successIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  successButton: {
    width: "100%",
  },
});
