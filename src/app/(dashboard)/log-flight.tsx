import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CustomSelect } from "../../components/CustomSelect";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../context/ThemeContext";
import { apiFetch } from "../../utils/api";
import { calculateFlightDuration, isLocalFlight } from "../../utils/helpers";
import { BentoCard } from "../../components/BentoCard";
import { CustomInput } from "../../components/CustomInput";
import { CustomButton } from "../../components/CustomButton";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Compass,
  Play,
  Square,
  ArrowRight,
  ChevronLeft,
  Clock,
  Calendar as CalendarIcon,
  Route,
  MapPin,
  User,
  Users,
  Cloud,
  Monitor,
  AlertCircle,
} from "lucide-react-native";

interface Aircraft {
  id: string;
  registration: string;
  icao: string;
  type: string;
  type_acft: string;
}

export default function LogFlightScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const editId = params.editId as string;

  // Form States
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const aircraftOptions = aircraft.map((ac) => ({
    label: `${ac.registration} — ${ac.type}`,
    value: ac.id,
  }));
  const [aircraftId, setAircraftId] = useState("");
  const [route, setRoute] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [takeoff, setTakeoff] = useState("");
  const [landing, setLanding] = useState("");
  const [duration, setDuration] = useState("");
  const [landings, setLandings] = useState("1");

  // Time Breakdown States
  const [picDayLoc, setPicDayLoc] = useState("");
  const [picDayTra, setPicDayTra] = useState("");
  const [picNightLoc, setPicNightLoc] = useState("");
  const [picNightTra, setPicNightTra] = useState("");
  const [sicDayLoc, setSicDayLoc] = useState("");
  const [sicDayTra, setSicDayTra] = useState("");
  const [sicNightLoc, setSicNightLoc] = useState("");
  const [sicNightTra, setSicNightTra] = useState("");

  // Conditions & Sim States
  const [imcPil, setImcPil] = useState("");
  const [imcCop, setImcCop] = useState("");
  const [capota, setCapota] = useState("");
  const [simInst, setSimInst] = useState("");
  const [simPil, setSimPil] = useState("");

  // UI States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live Timer States
  const [liveActive, setLiveActive] = useState(false);
  const [liveAircraft, setLiveAircraft] = useState("");
  const [liveRoute, setLiveRoute] = useState("");
  const [liveStartTime, setLiveStartTime] = useState<string | null>(null);
  const [liveDurationString, setLiveDurationString] = useState("00:00:00");
  const [liveSubmitting, setLiveSubmitting] = useState(false);

  // Load aircraft list and session on focus
  useEffect(() => {
    async function loadData() {
      try {
        const [acRes, sessionRes] = await Promise.all([
          apiFetch("/aircraft"),
          apiFetch("/flight-helper/session"),
        ]);

        if (acRes.ok) {
          const acData = await acRes.json();
          setAircraft(acData || []);
        }

        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          setLiveActive(sessionData.active || false);
          if (sessionData.active && sessionData.session) {
            setLiveAircraft(sessionData.session.aircraft_id || "");
            setLiveRoute(sessionData.session.route || "");
            setLiveStartTime(sessionData.session.start_time || null);
          }
        }

        // If editing an existing flight
        if (editId) {
          const flightRes = await apiFetch(`/flights/${editId}`);
          if (flightRes.ok) {
            const flight = await flightRes.json();
            
            // Format UTC ISO takeoff/landing strings to HH:mm
            const formatIsoToTime = (isoStr: string) => {
              const d = new Date(isoStr);
              return `${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}`;
            };

            setAircraftId(flight.aircraft_id || "");
            setRoute(flight.route || "");
            setDate(flight.date || "");
            setTakeoff(formatIsoToTime(flight.takeoff));
            setLanding(formatIsoToTime(flight.landing));
            setDuration(flight.duration?.toString() || "");
            setLandings(flight.landings?.toString() || "1");

            setPicDayLoc(flight.pic_day_loc?.toString() || "");
            setPicDayTra(flight.pic_day_tra?.toString() || "");
            setPicNightLoc(flight.pic_night_loc?.toString() || "");
            setPicNightTra(flight.pic_night_tra?.toString() || "");
            setSicDayLoc(flight.sic_day_loc?.toString() || "");
            setSicDayTra(flight.sic_day_tra?.toString() || "");
            setSicNightLoc(flight.sic_night_loc?.toString() || "");
            setSicNightTra(flight.sic_night_tra?.toString() || "");

            setImcPil(flight["IMC Pil"]?.toString() || "");
            setImcCop(flight["IMC Cop"]?.toString() || "");
            setCapota(flight["Capota"]?.toString() || "");
            setSimInst(flight["Sim Instructor"]?.toString() || "");
            setSimPil(flight["Sim Pil en Inst"]?.toString() || "");
          }
        }
      } catch (err) {
        console.error("Load log-flight data failed:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [editId]);

  // Live Timer tick
  useEffect(() => {
    let interval: any;
    if (liveActive && liveStartTime) {
      interval = setInterval(() => {
        const start = new Date(liveStartTime).getTime();
        const now = new Date().getTime();
        const diff = Math.max(0, now - start);

        const hours = Math.floor(diff / 3600000).toString().padStart(2, "0");
        const minutes = Math.floor((diff % 3600000) / 60000).toString().padStart(2, "0");
        const seconds = Math.floor((diff % 60000) / 1000).toString().padStart(2, "0");

        setLiveDurationString(`${hours}:${minutes}:${seconds}`);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [liveActive, liveStartTime]);

  // Duration auto-calculation when takeoff and landing times are entered
  useEffect(() => {
    if (takeoff && landing) {
      const calculated = calculateFlightDuration(takeoff, landing);
      setDuration(calculated.toFixed(1));
    }
  }, [takeoff, landing]);

  // Autofill PIC hours based on route and duration
  useEffect(() => {
    if (duration && route) {
      const total = parseFloat(duration) || 0;
      const isLoc = isLocalFlight(route);
      if (isLoc) {
        setPicDayLoc(total.toFixed(1));
        setPicDayTra("");
      } else {
        setPicDayLoc("");
        setPicDayTra(total.toFixed(1));
      }
    }
  }, [duration, route]);

  const handleStartLiveSession = async () => {
    if (!liveAircraft) {
      Alert.alert("Seleccionar Aeronave", "Por favor selecciona una aeronave para iniciar.");
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}

    setLiveSubmitting(true);
    try {
      const response = await apiFetch("/flight-helper/session", {
        method: "POST",
        body: {
          aircraft_id: liveAircraft,
          route: liveRoute,
          landings: 0,
        },
      });

      if (response.ok) {
        const sessionData = await response.json();
        setLiveActive(true);
        setLiveStartTime(sessionData.session.start_time || new Date().toISOString());
      } else {
        const err = await response.json();
        Alert.alert("Error", err.detail || "No se pudo iniciar la sesión.");
      }
    } catch (err) {
      Alert.alert("Error", "Error de conexión al iniciar el cronómetro.");
    } finally {
      setLiveSubmitting(false);
    }
  };

  const handleStopLiveSession = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    setLiveSubmitting(true);
    try {
      const response = await apiFetch("/flight-helper/session", {
        method: "POST",
      });

      if (response.ok) {
        const sessionData = await response.json();
        const session = sessionData.session || sessionData;

        // Extract HH:mm UTC times from start/end times
        const takeoffTime = new Date(session.start_time).toISOString().split("T")[1].substring(0, 5);
        const landingTime = new Date(session.end_time || new Date()).toISOString().split("T")[1].substring(0, 5);
        const flightDate = new Date(session.start_time).toISOString().split("T")[0];

        // Autofill form
        setAircraftId(session.aircraft_id || "");
        setRoute(session.route || "");
        setDate(flightDate);
        setTakeoff(takeoffTime);
        setLanding(landingTime);
        setLandings("1");
        
        if (session.flight_time) {
          setDuration(parseFloat(session.flight_time.replace("hs", "")).toFixed(1));
        }

        setLiveActive(false);
        setLiveStartTime(null);
        setLiveAircraft("");
        setLiveRoute("");
        Alert.alert(
          "Vuelo Finalizado",
          "Los tiempos de vuelo se han precargado en el formulario inferior. Por favor revísalos y guarda el registro."
        );
      } else {
        const err = await response.json();
        Alert.alert("Error", err.detail || "No se pudo detener la sesión.");
      }
    } catch (err) {
      Alert.alert("Error", "Error de conexión al detener el cronómetro.");
    } finally {
      setLiveSubmitting(false);
    }
  };

  const getNumber = (val: string): number | null => {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? null : parsed;
  };

  const handleSubmit = async () => {
    if (!aircraftId || !route || !date || !takeoff || !landing || !duration) {
      setError("Por favor, completa todos los campos generales obligatorios.");
      return;
    }

    setError(null);
    setSubmitting(true);

    const total = parseFloat(duration) || 0;
    const sumLogs = [
      picDayLoc,
      picDayTra,
      picNightLoc,
      picNightTra,
      sicDayLoc,
      sicDayTra,
      sicNightLoc,
      sicNightTra,
    ].reduce((acc, val) => acc + (parseFloat(val) || 0), 0);

    if (sumLogs > total + 0.01) {
      setError(
        `La suma de tiempos PIC/SIC (${sumLogs.toFixed(1)}h) no puede superar el total de block (${total.toFixed(1)}h)`
      );
      setSubmitting(false);
      return;
    }

    // Construct takeoff/landing ISO datetimes
    const takeoffDt = new Date(`${date}T${takeoff}:00Z`).toISOString().split(".")[0] + "Z";
    const landingDt = new Date(`${date}T${landing}:00Z`).toISOString().split(".")[0] + "Z";

    const payload = {
      aircraft_id: aircraftId,
      date,
      route: route.toUpperCase().trim(),
      landings: parseInt(landings, 10) || 1,
      duration: total,
      takeoff: takeoffDt,
      landing: landingDt,
      pic_day_loc: getNumber(picDayLoc),
      pic_day_tra: getNumber(picDayTra),
      pic_night_loc: getNumber(picNightLoc),
      pic_night_tra: getNumber(picNightTra),
      sic_day_loc: getNumber(sicDayLoc),
      sic_day_tra: getNumber(sicDayTra),
      sic_night_loc: getNumber(sicNightLoc),
      sic_night_tra: getNumber(sicNightTra),
      "IMC Pil": getNumber(imcPil),
      "IMC Cop": getNumber(imcCop),
      "Capota": getNumber(capota),
      "Sim Instructor": getNumber(simInst),
      "Sim Pil en Inst": getNumber(simPil),
    };

    try {
      let response;
      if (editId) {
        response = await apiFetch(`/flights/${editId}`, {
          method: "PATCH",
          body: payload,
        });
      } else {
        response = await apiFetch("/flights", {
          method: "POST",
          body: payload,
        });
      }

      if (response.ok) {
        // Clear forms
        setAircraftId("");
        setRoute("");
        setTakeoff("");
        setLanding("");
        setDuration("");
        setLandings("1");
        
        setPicDayLoc("");
        setPicDayTra("");
        setPicNightLoc("");
        setPicNightTra("");
        setSicDayLoc("");
        setSicDayTra("");
        setSicNightLoc("");
        setSicNightTra("");
        
        setImcPil("");
        setImcCop("");
        setCapota("");
        setSimInst("");
        setSimPil("");

        router.replace("/(dashboard)/history");
      } else {
        const err = await response.json();
        setError(err.detail || "Error al registrar el vuelo");
      }
    } catch (err) {
      setError("Error de conexión con el servidor");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex1}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleArea}>
              <View style={[styles.accentBar, { backgroundColor: colors.border }]} />
              <View style={styles.headerTitleRow}>
                {editId && (
                  <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                  >
                    <ChevronLeft size={24} color={colors.text} />
                  </TouchableOpacity>
                )}
                <Text style={[styles.title, { color: colors.text }]}>
                  {editId ? "Editar" : "Registrar"}
                </Text>
              </View>
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                Operaciones de Vuelo
              </Text>
            </View>
          </View>

          {/* Live Flight Controller Widget (Only when creating a new flight, not editing) */}
          {!editId && (
            <BentoCard>
              <View style={styles.liveWidgetHeader}>
                <View>
                  <Text style={[styles.liveMetaText, { color: colors.textSecondary }]}>
                    Modo Operativo
                  </Text>
                  <Text style={[styles.liveWidgetTitle, { color: colors.text }]}>
                    Vuelo en Vivo
                  </Text>
                </View>
                <View
                  style={[
                    styles.liveDot,
                    { backgroundColor: liveActive ? colors.green : colors.border },
                  ]}
                />
              </View>

              {!liveActive ? (
                <View style={styles.liveForm}>
                  {/* Select aircraft */}
                  <CustomSelect
                    placeholder="Seleccionar Aeronave..."
                    value={liveAircraft}
                    onValueChange={setLiveAircraft}
                    options={aircraftOptions}
                    icon={<Compass size={16} color={colors.textSecondary} />}
                  />

                  <CustomInput
                    placeholder="Ruta (ej. SAEZ SACO)"
                    value={liveRoute}
                    onChangeText={setLiveRoute}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    icon={<Route size={16} color={colors.textSecondary} />}
                    style={{ height: 48 }}
                  />

                  <CustomButton
                    title="Iniciar Cronómetro"
                    onPress={handleStartLiveSession}
                    loading={liveSubmitting}
                    icon={<Play size={14} color={colors.accentText} fill={colors.accentText} />}
                  />
                </View>
              ) : (
                <View style={styles.liveRunningContainer}>
                  <View style={[styles.liveSummaryBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <View>
                      <Text style={[styles.summaryBoxLabel, { color: colors.textSecondary }]}>
                        Matrícula Activa
                      </Text>
                      <Text style={[styles.summaryBoxVal, { color: colors.text }]}>
                        {aircraft.find((a) => a.id === liveAircraft)?.registration || "Desconocida"}
                      </Text>
                    </View>
                    <View style={styles.alignRight}>
                      <Text style={[styles.summaryBoxLabel, { color: colors.textSecondary }]}>
                        Inicio (UTC)
                      </Text>
                      <Text style={[styles.summaryBoxVal, { color: colors.green }]}>
                        {liveStartTime
                          ? new Date(liveStartTime).toLocaleTimeString("es-AR", {
                              hour: "2-digit",
                              minute: "2-digit",
                              timeZone: "UTC",
                            })
                          : "--:--"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.timerDisplay}>
                    <Clock size={20} color={colors.green} style={styles.timerIcon} />
                    <Text style={[styles.timerText, { color: colors.text }]}>
                      {liveDurationString}
                    </Text>
                  </View>

                  <CustomButton
                    title="Finalizar y Registrar"
                    onPress={handleStopLiveSession}
                    loading={liveSubmitting}
                    variant="danger"
                    icon={<Square size={14} color="#ffffff" fill="#ffffff" />}
                  />
                </View>
              )}
            </BentoCard>
          )}

          {/* Form Error Message */}
          {error && (
            <View style={[styles.errorBanner, { backgroundColor: colors.red + "15", borderColor: colors.red + "30" }]}>
              <AlertCircle size={18} color={colors.red} style={styles.errorIcon} />
              <Text style={[styles.errorText, { color: colors.red }]}>{error}</Text>
            </View>
          )}

          {/* Manual Entry Form */}
          <BentoCard>
            <View style={styles.formHeader}>
              <Text style={[styles.formTitle, { color: colors.text }]}>
                {editId ? "Editar Registro" : "Nueva Entrada"}
              </Text>
              <Text style={[styles.formMeta, { color: colors.textSecondary }]}>
                Bitácora Electrónica
              </Text>
            </View>

            {/* Section 1: General Info */}
            <View style={styles.formSection}>
              <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                01. Información General
              </Text>

              {/* Select aircraft */}
              <CustomSelect
                placeholder="Seleccionar Aeronave..."
                value={aircraftId}
                onValueChange={setAircraftId}
                options={aircraftOptions}
                icon={<Compass size={16} color={colors.textSecondary} />}
              />

              <CustomInput
                label="Ruta (ej. SAEZ SACO)"
                placeholder="Ruta"
                value={route}
                onChangeText={setRoute}
                autoCapitalize="characters"
                autoCorrect={false}
                icon={<Route size={16} color={colors.textSecondary} />}
              />

              <CustomInput
                label="Fecha (YYYY-MM-DD)"
                placeholder="AAAA-MM-DD"
                value={date}
                onChangeText={setDate}
                icon={<CalendarIcon size={16} color={colors.textSecondary} />}
              />

              <View style={styles.row}>
                <View style={styles.flex1}>
                  <CustomInput
                    label="Despegue (HH:MM)"
                    placeholder="12:00"
                    value={takeoff}
                    onChangeText={setTakeoff}
                    icon={<Clock size={16} color={colors.textSecondary} />}
                  />
                </View>
                <View style={[styles.flex1, { marginLeft: 12 }]}>
                  <CustomInput
                    label="Aterrizaje (HH:MM)"
                    placeholder="14:30"
                    value={landing}
                    onChangeText={setLanding}
                    icon={<Clock size={16} color={colors.textSecondary} />}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.flex1}>
                  <CustomInput
                    label="Tiempo Total (H)"
                    placeholder="0.0"
                    value={duration}
                    onChangeText={setDuration}
                    keyboardType="numeric"
                    icon={<Clock size={16} color={colors.textSecondary} />}
                  />
                </View>
                <View style={[styles.flex1, { marginLeft: 12 }]}>
                  <CustomInput
                    label="Aterrizajes"
                    placeholder="1"
                    value={landings}
                    onChangeText={setLandings}
                    keyboardType="numeric"
                    icon={<MapPin size={16} color={colors.textSecondary} />}
                  />
                </View>
              </View>
            </View>

            {/* Section 2: Breakdown */}
            <View style={[styles.formSection, styles.sectionBorder, { borderTopColor: colors.border }]}>
              <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                02. Desglose de Tiempos
              </Text>

              <View style={styles.gridFields}>
                <MiniField label="PIC Día Loc" value={picDayLoc} onChange={setPicDayLoc} />
                <MiniField label="PIC Día Tra" value={picDayTra} onChange={setPicDayTra} />
                <MiniField label="PIC Noc Loc" value={picNightLoc} onChange={setPicNightLoc} />
                <MiniField label="PIC Noc Tra" value={picNightTra} onChange={setPicNightTra} />
                <MiniField label="SIC Día Loc" value={sicDayLoc} onChange={setSicDayLoc} />
                <MiniField label="SIC Día Tra" value={sicDayTra} onChange={setSicDayTra} />
                <MiniField label="SIC Noc Loc" value={sicNightLoc} onChange={setSicNightLoc} />
                <MiniField label="SIC Noc Tra" value={sicNightTra} onChange={setSicNightTra} />
              </View>
            </View>

            {/* Section 3: Conditions */}
            <View style={[styles.formSection, styles.sectionBorder, { borderTopColor: colors.border }]}>
              <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                03. Condiciones y Sim
              </Text>

              <View style={styles.gridFields}>
                <MiniField label="IMC Piloto" value={imcPil} onChange={setImcPil} />
                <MiniField label="IMC Copiloto" value={imcCop} onChange={setImcCop} />
                <MiniField label="Capota" value={capota} onChange={setCapota} />
                <MiniField label="Sim Inst." value={simInst} onChange={setSimInst} />
                <MiniField label="Sim Piloto" value={simPil} onChange={setSimPil} />
              </View>
            </View>

            {/* Submit Button */}
            <View style={styles.submitWrapper}>
              <CustomButton
                title={editId ? "Confirmar Cambios" : "Registrar Vuelo"}
                onPress={handleSubmit}
                loading={submitting}
                icon={<ArrowRight size={14} color={colors.accentText} />}
              />
            </View>
          </BentoCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MiniField({ label, value, onChange }: { label: string; value: string; onChange: (val: string) => void }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.miniFieldWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <Text style={[styles.miniFieldLabel, { color: colors.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
      <TextInput
        placeholder="0.0"
        placeholderTextColor={colors.textSecondary + "50"}
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        style={[styles.miniFieldInput, { color: colors.text }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  safeArea: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 120,
    gap: 20,
  },
  header: {
    paddingHorizontal: 8,
    marginTop: 8,
  },
  headerTitleArea: {
    gap: 4,
  },
  accentBar: {
    height: 1,
    width: 32,
    marginBottom: 4,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  title: {
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: -1.5,
  },
  metaText: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 3,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  errorIcon: {
    marginRight: 10,
  },
  errorText: {
    fontSize: 11,
    fontWeight: "700",
    flex: 1,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    lineHeight: 16,
  },
  liveWidgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  liveMetaText: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  liveWidgetTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  liveForm: {
    gap: 12,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderRadius: 16,
    height: 52,
    position: "relative",
    justifyContent: "center",
    marginBottom: 12,
  },
  dropdownIcon: {
    position: "absolute",
    left: 16,
    zIndex: 10,
  },
  liveRunningContainer: {
    gap: 20,
  },
  liveSummaryBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryBoxLabel: {
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  summaryBoxVal: {
    fontSize: 16,
    fontWeight: "800",
    marginTop: 4,
  },
  alignRight: {
    alignItems: "flex-end",
  },
  timerDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  timerIcon: {
    marginRight: 8,
  },
  timerText: {
    fontSize: 32,
    fontWeight: "800",
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
  },
  formHeader: {
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  formMeta: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginTop: 2,
  },
  formSection: {
    gap: 12,
  },
  sectionBorder: {
    borderTopWidth: 1,
    marginTop: 24,
    paddingTop: 20,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    width: "100%",
  },
  gridFields: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  miniFieldWrapper: {
    width: "48%",
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
  },
  miniFieldLabel: {
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  miniFieldInput: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    height: 28,
    width: "100%",
    padding: 0,
    marginTop: 4,
  },
  submitWrapper: {
    marginTop: 32,
  },
});
