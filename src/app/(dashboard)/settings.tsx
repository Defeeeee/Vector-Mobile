import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CustomSelect } from "../../components/CustomSelect";
import { useAuth } from "../../context/AuthContext";
import { useTheme, ThemeMode } from "../../context/ThemeContext";
import { apiFetch } from "../../utils/api";
import { BentoCard } from "../../components/BentoCard";
import { CustomInput } from "../../components/CustomInput";
import { CustomButton } from "../../components/CustomButton";
import {
  User,
  Sliders,
  Plane,
  Clock,
  LogOut,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Check,
  Moon,
  Sun,
  Monitor,
} from "lucide-react-native";

interface Aircraft {
  id: string;
  registration: string;
  icao: string;
  type: string;
  type_acft: string;
}

interface FlightPack {
  id: string;
  name: string;
  total_hours: number;
  remaining_hours: number;
  is_active: boolean;
  start_date?: string | null;
  aircraft_ids: string[];
}

export default function SettingsScreen() {
  const { user, logout, refreshProfile } = useAuth();
  const { colors, themeMode, setThemeMode } = useTheme();

  // Collapsible Section states
  const [profileOpen, setProfileOpen] = useState(true);
  const [themeOpen, setThemeOpen] = useState(false);
  const [aircraftOpen, setAircraftOpen] = useState(false);
  const [packsOpen, setPacksOpen] = useState(false);

  // Profile Form States
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [licenseType, setLicenseType] = useState(user?.license_type || "");
  const [cmaExpiry, setCmaExpiry] = useState(user?.cma_expiry || "");
  const [profileSaving, setProfileSaving] = useState(false);

  // Lists from server
  const [aircraftList, setAircraftList] = useState<Aircraft[]>([]);
  const [packsList, setPacksList] = useState<FlightPack[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);

  // Add Aircraft Form States
  const [showAddAircraft, setShowAddAircraft] = useState(false);
  const [acReg, setAcReg] = useState("");
  const [acIcao, setAcIcao] = useState("");
  const [acType, setAcType] = useState("");
  const [acClass, setAcClass] = useState("MONT-T"); // Monomotor Terrestre
  const [acSaving, setAcSaving] = useState(false);

  // Add Pack Form States
  const [showAddPack, setShowAddPack] = useState(false);
  const [packName, setPackName] = useState("");
  const [packHours, setPackHours] = useState("");
  const [packAcId, setPackAcId] = useState("");
  const [packSaving, setPackSaving] = useState(false);

  const packAircraftOptions = [
    { label: "Cualquiera / Todas", value: "" },
    ...aircraftList.map((ac) => ({
      label: `${ac.registration} — ${ac.type}`,
      value: ac.id,
    })),
  ];

  // Sync profile values when user context loads
  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setLicenseType(user.license_type || "");
      setCmaExpiry(user.cma_expiry || "");
    }
  }, [user]);

  // Load lists on mount
  const fetchLists = async () => {
    try {
      const [acRes, packsRes] = await Promise.all([
        apiFetch("/aircraft"),
        apiFetch("/flight-packs"),
      ]);

      if (acRes.ok) {
        const acData = await acRes.json();
        setAircraftList(acData || []);
      }
      if (packsRes.ok) {
        const packsData = await packsRes.json();
        setPacksList(packsData || []);
      }
    } catch (err) {
      console.error("Failed to load settings lists:", err);
    } finally {
      setLoadingLists(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  const handleSaveProfile = async () => {
    if (!firstName || !lastName || !user?.id) {
      Alert.alert("Campos obligatorios", "Nombre y Apellido son requeridos.");
      return;
    }

    setProfileSaving(true);
    try {
      const response = await apiFetch(`/profiles/${user.id}`, {
        method: "PATCH",
        body: {
          first_name: firstName,
          last_name: lastName,
          license_type: licenseType,
          cma_expiry: cmaExpiry || null,
        },
      });

      if (response.ok) {
        await refreshProfile();
        Alert.alert("Perfil Actualizado", "Los detalles de tu perfil fueron guardados con éxito.");
      } else {
        const err = await response.json();
        Alert.alert("Error", err.detail || "No se pudo actualizar el perfil.");
      }
    } catch (err) {
      Alert.alert("Error", "Error de conexión al actualizar el perfil.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAddAircraft = async () => {
    if (!acReg || !acIcao || !acType) {
      Alert.alert("Campos obligatorios", "Completa la matrícula, código ICAO y descripción.");
      return;
    }

    setAcSaving(true);
    try {
      const response = await apiFetch("/aircraft", {
        method: "POST",
        body: {
          registration: acReg.toUpperCase().trim(),
          icao: acIcao.toUpperCase().trim(),
          type: acType.trim(),
          type_acft: acClass,
        },
      });

      if (response.ok) {
        const newAc = await response.json();
        setAircraftList((prev) => [...prev, newAc]);
        setAcReg("");
        setAcIcao("");
        setAcType("");
        setShowAddAircraft(false);
        Alert.alert("Aeronave Registrada", "La aeronave ha sido agregada con éxito.");
      } else {
        const err = await response.json();
        Alert.alert("Error", err.detail || "No se pudo guardar la aeronave.");
      }
    } catch (err) {
      Alert.alert("Error", "Error de conexión al agregar la aeronave.");
    } finally {
      setAcSaving(false);
    }
  };

  const handleDeleteAircraft = async (id: string) => {
    Alert.alert(
      "Eliminar Aeronave",
      "¿Estás seguro de que deseas eliminar esta aeronave? Esto fallará si tiene vuelos registrados.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await apiFetch(`/aircraft/${id}`, {
                method: "DELETE",
              });

              if (response.ok) {
                setAircraftList((prev) => prev.filter((ac) => ac.id !== id));
                Alert.alert("Eliminada", "La aeronave fue eliminada.");
              } else {
                const err = await response.json();
                Alert.alert("Error", err.detail || "No se pudo eliminar la aeronave.");
              }
            } catch (err) {
              Alert.alert("Error", "Error de conexión.");
            }
          },
        },
      ]
    );
  };

  const handleAddPack = async () => {
    if (!packName || !packHours) {
      Alert.alert("Campos obligatorios", "Completa el nombre y total de horas.");
      return;
    }

    setPackSaving(true);
    try {
      const response = await apiFetch("/flight-packs", {
        method: "POST",
        body: {
          name: packName.trim(),
          total_hours: parseFloat(packHours),
          aircraft_ids: packAcId ? [packAcId] : [],
          start_date: new Date().toISOString(),
        },
      });

      if (response.ok) {
        const newPack = await response.json();
        setPacksList((prev) => [...prev, newPack]);
        setPackName("");
        setPackHours("");
        setPackAcId("");
        setShowAddPack(false);
        Alert.alert("Pack Creado", "El paquete de horas ha sido creado.");
      } else {
        const err = await response.json();
        Alert.alert("Error", err.detail || "No se pudo crear el pack.");
      }
    } catch (err) {
      Alert.alert("Error", "Error de conexión.");
    } finally {
      setPackSaving(false);
    }
  };

  const handleTogglePack = async (pack: FlightPack) => {
    try {
      const response = await apiFetch(`/flight-packs/${pack.id}`, {
        method: "PATCH",
        body: {
          is_active: !pack.is_active,
        },
      });

      if (response.ok) {
        const updated = await response.json();
        setPacksList((prev) => prev.map((p) => (p.id === pack.id ? updated : p)));
      }
    } catch (err) {
      console.error("Failed to toggle pack:", err);
    }
  };

  const handleDeletePack = async (id: string) => {
    Alert.alert("Eliminar Pack", "¿Estás seguro de que deseas eliminar este paquete?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await apiFetch(`/flight-packs/${id}`, {
              method: "DELETE",
            });

            if (response.ok) {
              setPacksList((prev) => prev.filter((p) => p.id !== id));
            }
          } catch (err) {
            console.error("Failed to delete pack:", err);
          }
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert("Cerrar Sesión", "¿Estás seguro de que deseas salir de tu cuenta?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Salir", style: "destructive", onPress: () => logout() },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.accentBar, { backgroundColor: colors.border }]} />
          <Text style={[styles.title, { color: colors.text }]}>Ajustes</Text>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            Configuración del Sistema
          </Text>
        </View>

        {/* 1. Profile section */}
        <BentoCard style={styles.settingCard}>
          <TouchableOpacity
            style={styles.cardHeader}
            onPress={() => setProfileOpen(!profileOpen)}
            activeOpacity={0.7}
          >
            <View style={styles.titleRow}>
              <User size={18} color={colors.text} style={styles.headerIcon} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Detalles de Perfil</Text>
            </View>
            {profileOpen ? (
              <ChevronUp size={18} color={colors.textSecondary} />
            ) : (
              <ChevronDown size={18} color={colors.textSecondary} />
            )}
          </TouchableOpacity>

          {profileOpen && (
            <View style={styles.cardBody}>
              <CustomInput
                label="Nombre"
                placeholder="Nombre"
                value={firstName}
                onChangeText={setFirstName}
                autoCorrect={false}
              />
              <CustomInput
                label="Apellido"
                placeholder="Apellido"
                value={lastName}
                onChangeText={setLastName}
                autoCorrect={false}
              />
              <CustomInput
                label="Tipo de Licencia"
                placeholder="PPA, PCA, TLA..."
                value={licenseType}
                onChangeText={setLicenseType}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <CustomInput
                label="Vencimiento CMA (YYYY-MM-DD)"
                placeholder="AAAA-MM-DD"
                value={cmaExpiry}
                onChangeText={setCmaExpiry}
              />
              <CustomButton
                title="Guardar Perfil"
                onPress={handleSaveProfile}
                loading={profileSaving}
                icon={<Check size={14} color={colors.accentText} />}
              />
            </View>
          )}
        </BentoCard>

        {/* 2. Theme section */}
        <BentoCard style={styles.settingCard}>
          <TouchableOpacity
            style={styles.cardHeader}
            onPress={() => setThemeOpen(!themeOpen)}
            activeOpacity={0.7}
          >
            <View style={styles.titleRow}>
              <Sliders size={18} color={colors.text} style={styles.headerIcon} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Tema del Dispositivo</Text>
            </View>
            {themeOpen ? (
              <ChevronUp size={18} color={colors.textSecondary} />
            ) : (
              <ChevronDown size={18} color={colors.textSecondary} />
            )}
          </TouchableOpacity>

          {themeOpen && (
            <View style={styles.cardBody}>
              <View style={[styles.themeSelector, { borderColor: colors.border }]}>
                <ThemeButton
                  label="Claro"
                  active={themeMode === "light"}
                  icon={<Sun size={14} color={themeMode === "light" ? colors.accentText : colors.text} />}
                  onPress={() => setThemeMode("light")}
                />
                <ThemeButton
                  label="Oscuro"
                  active={themeMode === "dark"}
                  icon={<Moon size={14} color={themeMode === "dark" ? colors.accentText : colors.text} />}
                  onPress={() => setThemeMode("dark")}
                />
                <ThemeButton
                  label="Sistema"
                  active={themeMode === "system"}
                  icon={<Monitor size={14} color={themeMode === "system" ? colors.accentText : colors.text} />}
                  onPress={() => setThemeMode("system")}
                />
              </View>
            </View>
          )}
        </BentoCard>

        {/* 3. Aircraft manager */}
        <BentoCard style={styles.settingCard}>
          <TouchableOpacity
            style={styles.cardHeader}
            onPress={() => setAircraftOpen(!aircraftOpen)}
            activeOpacity={0.7}
          >
            <View style={styles.titleRow}>
              <Plane size={18} color={colors.text} style={styles.headerIcon} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Mis Aeronaves</Text>
            </View>
            {aircraftOpen ? (
              <ChevronUp size={18} color={colors.textSecondary} />
            ) : (
              <ChevronDown size={18} color={colors.textSecondary} />
            )}
          </TouchableOpacity>

          {aircraftOpen && (
            <View style={styles.cardBody}>
              {loadingLists ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <View style={styles.listContainer}>
                  {aircraftList.map((ac) => (
                    <View key={ac.id} style={[styles.listItem, { borderColor: colors.border }]}>
                      <View>
                        <Text style={[styles.itemTitle, { color: colors.text }]}>{ac.registration}</Text>
                        <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
                          {ac.type} • {ac.type_acft}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDeleteAircraft(ac.id)} style={styles.trashBtn}>
                        <Trash2 size={16} color={colors.red} />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {aircraftList.length === 0 && (
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                      Sin aeronaves registradas.
                    </Text>
                  )}

                  {!showAddAircraft ? (
                    <TouchableOpacity
                      onPress={() => setShowAddAircraft(true)}
                      style={[styles.addBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                    >
                      <Plus size={14} color={colors.text} />
                      <Text style={[styles.addBtnText, { color: colors.text }]}>Agregar Aeronave</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.addForm, { borderColor: colors.border, backgroundColor: colors.background }]}>
                      <Text style={[styles.formHeading, { color: colors.text }]}>Nueva Aeronave</Text>
                      <CustomInput
                        label="Matrícula"
                        placeholder="ej. LV-S001"
                        value={acReg}
                        onChangeText={setAcReg}
                        autoCapitalize="characters"
                      />
                      <CustomInput
                        label="Modelo / Tipo"
                        placeholder="ej. C152"
                        value={acType}
                        onChangeText={setAcType}
                      />
                      <CustomInput
                        label="Código ICAO"
                        placeholder="ej. C152"
                        value={acIcao}
                        onChangeText={setAcIcao}
                        autoCapitalize="characters"
                      />

                      <CustomSelect
                        label="Categoría / Clase"
                        value={acClass}
                        onValueChange={setAcClass}
                        options={[
                          { label: "Monomotor Terrestre (MONT-T)", value: "MONT-T" },
                          { label: "Multimotor Terrestre (MULT-T)", value: "MULT-T" },
                          { label: "Simulador (SIM)", value: "SIM" },
                        ]}
                      />

                      <View style={styles.formButtons}>
                        <TouchableOpacity
                          onPress={() => setShowAddAircraft(false)}
                          style={styles.cancelBtn}
                        >
                          <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancelar</Text>
                        </TouchableOpacity>
                        <CustomButton
                          title="Guardar"
                          onPress={handleAddAircraft}
                          loading={acSaving}
                          style={{ flex: 1, height: 44 }}
                        />
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </BentoCard>

        {/* 4. Flight Packs manager */}
        <BentoCard style={styles.settingCard}>
          <TouchableOpacity
            style={styles.cardHeader}
            onPress={() => setPacksOpen(!packsOpen)}
            activeOpacity={0.7}
          >
            <View style={styles.titleRow}>
              <Clock size={18} color={colors.text} style={styles.headerIcon} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Packs de Horas</Text>
            </View>
            {packsOpen ? (
              <ChevronUp size={18} color={colors.textSecondary} />
            ) : (
              <ChevronDown size={18} color={colors.textSecondary} />
            )}
          </TouchableOpacity>

          {packsOpen && (
            <View style={styles.cardBody}>
              {loadingLists ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <View style={styles.listContainer}>
                  {packsList.map((pack) => (
                    <View key={pack.id} style={[styles.listItem, { borderColor: colors.border }]}>
                      <View style={styles.flex1}>
                        <View style={styles.rowCentered}>
                          <Text style={[styles.itemTitle, { color: colors.text }]}>{pack.name}</Text>
                          <TouchableOpacity
                            onPress={() => handleTogglePack(pack)}
                            style={[
                              styles.statusBadge,
                              { backgroundColor: pack.is_active ? colors.green + "15" : colors.border },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusBadgeText,
                                { color: pack.is_active ? colors.green : colors.textSecondary },
                              ]}
                            >
                              {pack.is_active ? "Activo" : "Pausado"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
                          Disponible: {pack.remaining_hours.toFixed(1)}h / {pack.total_hours}h
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDeletePack(pack.id)} style={styles.trashBtn}>
                        <Trash2 size={16} color={colors.red} />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {packsList.length === 0 && (
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                      Sin packs de horas registrados.
                    </Text>
                  )}

                  {!showAddPack ? (
                    <TouchableOpacity
                      onPress={() => setShowAddPack(true)}
                      style={[styles.addBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                    >
                      <Plus size={14} color={colors.text} />
                      <Text style={[styles.addBtnText, { color: colors.text }]}>Agregar Pack</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.addForm, { borderColor: colors.border, backgroundColor: colors.background }]}>
                      <Text style={[styles.formHeading, { color: colors.text }]}>Nuevo Pack de Horas</Text>
                      <CustomInput
                        label="Nombre del Pack"
                        placeholder="ej. Pack 10h C172"
                        value={packName}
                        onChangeText={setPackName}
                      />
                      <CustomInput
                        label="Horas Compradas"
                        placeholder="10.0"
                        value={packHours}
                        onChangeText={setPackHours}
                        keyboardType="numeric"
                      />

                      <CustomSelect
                        label="Aeronave Asociada"
                        value={packAcId}
                        onValueChange={setPackAcId}
                        options={packAircraftOptions}
                      />

                      <View style={styles.formButtons}>
                        <TouchableOpacity
                          onPress={() => setShowAddPack(false)}
                          style={styles.cancelBtn}
                        >
                          <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancelar</Text>
                        </TouchableOpacity>
                        <CustomButton
                          title="Crear Pack"
                          onPress={handleAddPack}
                          loading={packSaving}
                          style={{ flex: 1, height: 44 }}
                        />
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </BentoCard>

        {/* Logout Section */}
        <CustomButton
          title="Cerrar Sesión"
          variant="danger"
          onPress={handleLogout}
          icon={<LogOut size={14} color={colors.red} />}
          style={styles.logoutBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function ThemeButton({
  label,
  active,
  icon,
  onPress,
}: {
  label: string;
  active: boolean;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.themeBtn,
        {
          backgroundColor: active ? colors.accent : "transparent",
        },
      ]}
      activeOpacity={0.8}
    >
      {icon}
      <Text
        style={[
          styles.themeBtnText,
          {
            color: active ? colors.accentText : colors.text,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 120,
    gap: 16,
  },
  header: {
    paddingHorizontal: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  accentBar: {
    height: 1,
    width: 32,
    marginBottom: 4,
  },
  title: {
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: -1,
  },
  metaText: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginTop: 2,
  },
  settingCard: {
    padding: 0,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  cardBody: {
    padding: 20,
    paddingTop: 0,
    gap: 16,
  },
  themeSelector: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
    height: 46,
    width: "100%",
  },
  themeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  themeBtnText: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  listContainer: {
    gap: 12,
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    paddingBottom: 10,
    paddingHorizontal: 4,
  },
  flex1: {
    flex: 1,
  },
  rowCentered: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  itemSub: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  trashBtn: {
    padding: 8,
  },
  emptyText: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    textAlign: "center",
    paddingVertical: 12,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 12,
    height: 44,
    gap: 6,
    marginTop: 8,
  },
  addBtnText: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  addForm: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginTop: 8,
  },
  formHeading: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  pickerLabel: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingLeft: 4,
    marginBottom: -6,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 12,
    height: 44,
    justifyContent: "center",
    marginBottom: 8,
  },
  formButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    alignItems: "center",
  },
  cancelBtn: {
    paddingHorizontal: 16,
    height: 44,
    justifyContent: "center",
  },
  cancelText: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  logoutBtn: {
    marginTop: 20,
  },
});
