import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { FadeInView } from "../../components/FadeInView";
import { apiFetch } from "../../utils/api";
import { splitRoute } from "../../utils/helpers";
import { BentoCard } from "../../components/BentoCard";
import { PCATracker } from "../../components/PCATracker";
import { FlightPackWidget, FlightPack } from "../../components/FlightPackWidget";
import { DashboardCharts } from "../../components/DashboardCharts";
import { useRouter } from "expo-router";
import {
  Compass,
  Award,
  TrendingUp,
  MapPin,
  Clock,
  Activity,
  Zap,
  Plane,
  Navigation2,
  ChevronRight,
} from "lucide-react-native";

export default function DashboardScreen() {
  const { user } = useAuth();
  const { colors, theme } = useTheme();
  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    flights: any[];
    aircraft: any[];
    packs: FlightPack[];
    session: {
      active: boolean;
      session?: {
        aircraft_id: string;
        route: string;
        start_time: string;
      };
    };
  }>({
    flights: [],
    aircraft: [],
    packs: [],
    session: { active: false },
  });

  const fetchDashboardData = async () => {
    try {
      const response = await apiFetch("/dashboard");
      if (response.ok) {
        const json = await response.json();
        setData({
          flights: json.flights || [],
          aircraft: json.aircraft || [],
          packs: json.packs || [],
          session: json.session || { active: false },
        });
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, []);

  // Recalculate stats from flights list
  const flights = data.flights;
  const aircraft = data.aircraft;
  const packs = data.packs;
  const session = data.session;

  // Memoize all dashboard stats and charts calculations to avoid recalculating on every re-render
  const stats = React.useMemo(() => {
    const totalFlightsCount = flights.length;
    const totalHoursVal = flights.reduce((acc, f) => acc + (f.duration || 0), 0);
    const totalLandingsVal = flights.reduce((acc, f) => acc + (f.landings || 0), 0);

    // Stats for last 30 days
    const thirtyDaysAgoVal = new Date();
    thirtyDaysAgoVal.setDate(thirtyDaysAgoVal.getDate() - 30);
    const lastMonthFlights = flights.filter(
      (f) => new Date(f.date + "T00:00:00") >= thirtyDaysAgoVal
    );
    const lastMonthHoursVal = lastMonthFlights.reduce((acc, f) => acc + (f.duration || 0), 0);

    // Group by months (last 6 months) for chart
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const monthlyMap = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = `${monthNames[d.getMonth()]}`;
      monthlyMap.set(label, 0);
    }
    flights.forEach((f) => {
      const d = new Date(f.date + "T00:00:00");
      const label = `${monthNames[d.getMonth()]}`;
      if (monthlyMap.has(label)) {
        monthlyMap.set(label, (monthlyMap.get(label) || 0) + (f.duration || 0));
      }
    });
    const chartDataVal = Array.from(monthlyMap.entries()).map(([name, hours]) => ({
      name,
      hours: Number(hours.toFixed(1)),
    }));

    // Group by aircraft for chart
    const aircraftMapVal = new Map(aircraft.map((a) => [a.id, a]));
    const regMap = new Map<string, number>();
    flights.forEach((f) => {
      const ac = f.aircraft_id ? aircraftMapVal.get(f.aircraft_id) : undefined;
      const reg = ac?.registration || "Desconocido";
      regMap.set(reg, (regMap.get(reg) || 0) + (f.duration || 0));
    });
    const aircraftChartDataVal = Array.from(regMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({
        name,
        value: Number(value.toFixed(1)),
        color: ["#18181b", "#71717a", "#e4e4e7", "#f4f4f5"][i % 4],
      }));

    // Airports logic
    const airportFreq = new Map<string, number>();
    flights.forEach((f) => {
      const [origin, dest] = splitRoute(f.route);
      if (origin !== "???") {
        const o = origin.toUpperCase();
        airportFreq.set(o, (airportFreq.get(o) || 0) + 1);
      }
      if (dest !== "???") {
        const d = dest.toUpperCase();
        airportFreq.set(d, (airportFreq.get(d) || 0) + 1);
      }
    });
    const airportsCountVal = airportFreq.size;
    const sortedAirports = Array.from(airportFreq.entries()).sort((a, b) => b[1] - a[1]);
    const mostVisitedVal = sortedAirports[0]?.[0] || "---";

    const longestFlightVal = flights.length > 0 ? Math.max(...flights.map((f) => f.duration || 0)) : 0;
    const avgFlightTimeVal = totalFlightsCount > 0 ? totalHoursVal / totalFlightsCount : 0;

    return {
      totalFlights: totalFlightsCount,
      totalHours: totalHoursVal,
      totalLandings: totalLandingsVal,
      lastMonthFlightsCount: lastMonthFlights.length,
      lastMonthHours: lastMonthHoursVal,
      chartData: chartDataVal,
      aircraftChartData: aircraftChartDataVal,
      airportsCount: airportsCountVal,
      mostVisited: mostVisitedVal,
      longestFlight: longestFlightVal,
      avgFlightTime: avgFlightTimeVal,
      aircraftMap: aircraftMapVal,
    };
  }, [flights, aircraft]);

  const {
    totalFlights,
    totalHours,
    totalLandings,
    lastMonthFlightsCount,
    lastMonthHours,
    chartData,
    aircraftChartData,
    airportsCount,
    mostVisited,
    longestFlight,
    avgFlightTime,
    aircraftMap,
  } = stats;

  // Show spinner on initial load
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const showTracker =
    (user?.license_type?.toUpperCase().includes("PPA") ||
      user?.license_type?.toUpperCase().includes("PRIVADO")) &&
    !user?.license_type?.toUpperCase().includes("PCA");

  const liveAircraftReg = session.active && session.session
    ? aircraftMap.get(session.session.aircraft_id)?.registration || "Desconocida"
    : "";

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Dynamic Header */}
        <FadeInView delay={50} duration={400} style={styles.header}>
          <View style={styles.headerMeta}>
            <Activity size={12} color={colors.textSecondary} />
            <Text style={[styles.headerMetaText, { color: colors.textSecondary }]}>
              Centro de Operaciones
            </Text>
          </View>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.first_name || "Comandante"}
          </Text>
        </FadeInView>

        {/* Live Session Banner */}
        {session.active && session.session && (
          <FadeInView delay={80} duration={400}>
            <BentoCard style={[styles.liveBanner, { backgroundColor: colors.green }]}>
              <View style={styles.liveLeft}>
                <View style={styles.liveIconWrapper}>
                  <Compass size={22} color={colors.green} style={styles.pulseIcon} />
                </View>
                <View>
                  <Text style={styles.liveMeta}>Vuelo en Progreso</Text>
                  <Text style={styles.liveReg}>{liveAircraftReg}</Text>
                </View>
              </View>
              <View style={styles.liveRight}>
                <Text style={styles.liveLabel}>LIVE</Text>
                <Text style={styles.liveTime}>
                  Desde{" "}
                  {new Date(session.session.start_time).toLocaleTimeString("es-AR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  UTC
                </Text>
              </View>
            </BentoCard>
          </FadeInView>
        )}

        {/* Core Stats Bento Cards */}
        <FadeInView delay={120} duration={500} style={styles.statsLayout}>
          {/* Main Experience Card - High Contrast Accent Card */}
          <BentoCard style={[styles.mainHoursCard, { backgroundColor: colors.accent, borderColor: "transparent" }]}>
            <View style={styles.mainHoursHeader}>
              <View style={styles.awardWrapper}>
                <Award size={20} color={colors.accentText} />
              </View>
              <Text style={[styles.mainHoursLabel, { color: colors.accentText + "80" }]}>
                Experiencia Total
              </Text>
            </View>

            <View style={styles.hoursValueRow}>
              <Text style={[styles.hoursValueText, { color: colors.accentText }]}>
                {totalHours.toFixed(1)}
              </Text>
              <Text style={[styles.hoursValueUnit, { color: colors.accentText + "60" }]}>
                Hs
              </Text>
            </View>

            <View style={[styles.mainCardFooter, { borderTopColor: colors.accentText + "15" }]}>
              <View>
                <Text style={[styles.footerVal, { color: colors.accentText }]}>
                  {totalFlights}
                </Text>
                <Text style={[styles.footerLbl, { color: colors.accentText + "60" }]}>
                  Vuelos
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push("/(dashboard)/history")}
                style={[styles.navigationButton, { backgroundColor: colors.accentText + "15" }]}
                activeOpacity={0.8}
              >
                <Navigation2 size={16} color={colors.accentText} style={styles.navIcon} />
              </TouchableOpacity>
            </View>
          </BentoCard>

          {/* Recent Activity Card */}
          <View style={styles.subStatsRow}>
            <BentoCard style={styles.flex1}>
              <View style={[styles.subIconWrapper, { backgroundColor: colors.background }]}>
                <TrendingUp size={18} color={colors.text} />
              </View>
              <Text style={[styles.subLabel, { color: colors.textSecondary }]}>Últimos 30 Días</Text>
              <Text style={[styles.subVal, { color: colors.text }]}>
                {lastMonthHours.toFixed(1)}
              </Text>
              <View style={[styles.recordsNotification, { backgroundColor: colors.background }]}>
                <View style={styles.dotIndicator} />
                <Text style={[styles.recordsText, { color: colors.textSecondary }]}>
                  +{lastMonthFlightsCount} REGISTROS
                </Text>
              </View>
            </BentoCard>

            {/* Combined Mini details */}
            <View style={styles.miniStatsColumn}>
              <BentoCard style={styles.miniCard}>
                <View style={styles.miniIconBg}>
                  <MapPin size={14} color={colors.text} />
                </View>
                <Text style={[styles.miniVal, { color: colors.text }]}>{airportsCount}</Text>
                <Text style={[styles.miniLbl, { color: colors.textSecondary }]}>Aeródromos</Text>
              </BentoCard>

              <BentoCard style={styles.miniCard}>
                <View style={styles.miniIconBg}>
                  <Clock size={14} color={colors.text} />
                </View>
                <Text style={[styles.miniVal, { color: colors.text }]}>
                  {longestFlight.toFixed(1)}h
                </Text>
                <Text style={[styles.miniLbl, { color: colors.textSecondary }]}>Récord</Text>
              </BentoCard>
            </View>
          </View>
        </FadeInView>

        {/* Row of Metrics */}
        <FadeInView delay={180} duration={500} style={styles.metricsRow}>
          <MetricItem
            label="Prom. Vuelo"
            value={`${avgFlightTime.toFixed(1)}h`}
            icon={<Zap size={14} color={colors.textSecondary} />}
          />
          <MetricItem
            label="Aterrizajes"
            value={totalLandings.toString()}
            icon={<Compass size={14} color={colors.textSecondary} />}
          />
          <MetricItem
            label="Destino"
            value={mostVisited}
            icon={<MapPin size={14} color={colors.textSecondary} />}
          />
          <MetricItem
            label="Aeronaves"
            value={aircraft.length.toString()}
            icon={<Plane size={14} color={colors.textSecondary} />}
          />
        </FadeInView>

        {/* Hour Packages Widget */}
        <FadeInView delay={240} duration={500}>
          <FlightPackWidget packs={packs} />
        </FadeInView>

        {/* PCA Tracker Widget */}
        {showTracker && (
          <FadeInView delay={280} duration={500}>
            <PCATracker flights={flights} />
          </FadeInView>
        )}

        {/* Analytics Charts */}
        <FadeInView delay={320} duration={500} style={styles.chartsContainer}>
          <DashboardCharts monthlyData={chartData} aircraftData={aircraftChartData} />
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricItem({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  const { colors } = useTheme();

  return (
    <BentoCard style={styles.metricCard}>
      <View style={[styles.metricIconBg, { backgroundColor: colors.background, borderColor: colors.border }]}>
        {icon}
      </View>
      <Text style={[styles.metricVal, { color: colors.text }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.metricLbl, { color: colors.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
    </BentoCard>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 120,
    gap: 24,
  },
  header: {
    paddingHorizontal: 8,
    marginTop: 8,
  },
  headerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerMetaText: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 3,
  },
  userName: {
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: -1.5,
    marginTop: 6,
  },
  liveBanner: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  liveLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  liveIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  pulseIcon: {
    transform: [{ scale: 1.1 }],
  },
  liveMeta: {
    fontSize: 8,
    fontWeight: "bold",
    color: "rgba(255, 255, 255, 0.8)",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  liveReg: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.5,
    marginTop: 2,
  },
  liveRight: {
    alignItems: "flex-end",
  },
  liveLabel: {
    fontSize: 16,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  liveTime: {
    fontSize: 9,
    fontWeight: "bold",
    color: "rgba(255, 255, 255, 0.8)",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginTop: 4,
  },
  statsLayout: {
    gap: 16,
  },
  mainHoursCard: {
    padding: 24,
    borderRadius: 28,
  },
  mainHoursHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  awardWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  mainHoursLabel: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  hoursValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 16,
    gap: 4,
  },
  hoursValueText: {
    fontSize: 64,
    fontWeight: "800",
    letterSpacing: -2,
    lineHeight: 64,
  },
  hoursValueUnit: {
    fontSize: 16,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  mainCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    marginTop: 20,
    paddingTop: 16,
  },
  footerVal: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  footerLbl: {
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginTop: 2,
  },
  navigationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  navIcon: {
    transform: [{ rotate: "45deg" }],
  },
  subStatsRow: {
    flexDirection: "row",
    gap: 16,
  },
  flex1: {
    flex: 1,
  },
  subIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  subLabel: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  subVal: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
    marginTop: 4,
    lineHeight: 36,
  },
  recordsNotification: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginTop: 12,
    alignSelf: "flex-start",
  },
  dotIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#22c55e",
  },
  recordsText: {
    fontSize: 8,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  miniStatsColumn: {
    flex: 1,
    gap: 12,
  },
  miniCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  miniIconBg: {
    marginBottom: 4,
  },
  miniVal: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  miniLbl: {
    fontSize: 7,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 1,
  },
  metricsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    width: "100%",
  },
  metricCard: {
    flex: 1,
    minWidth: "45%",
    padding: 16,
    borderRadius: 20,
  },
  metricIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    marginBottom: 12,
  },
  metricVal: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  metricLbl: {
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginTop: 4,
  },
  chartsContainer: {
    width: "100%",
  },
});
