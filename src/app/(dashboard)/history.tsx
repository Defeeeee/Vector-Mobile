import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { apiFetch } from "../../utils/api";
import { FlightCard, Flight, Aircraft } from "../../components/FlightCard";
import { Search, Plus, Plane } from "lucide-react-native";
import { useRouter } from "expo-router";
import { FadeInView } from "../../components/FadeInView";

export default function HistoryScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    try {
      const [flightsRes, aircraftRes] = await Promise.all([
        apiFetch("/flights"),
        apiFetch("/aircraft"),
      ]);

      if (flightsRes.ok) {
        const flightsData = await flightsRes.json();
        setFlights(flightsData || []);
      }
      if (aircraftRes.ok) {
        const aircraftData = await aircraftRes.json();
        setAircraft(aircraftData || []);
      }
    } catch (error) {
      console.error("Error loading history data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const handleDeleteFlight = useCallback(async (id: string) => {
    try {
      const response = await apiFetch(`/flights/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remove locally
        setFlights((prev) => prev.filter((f) => f.id !== id));
      } else {
        const err = await response.json();
        alert(err.detail || "Error al eliminar el vuelo");
      }
    } catch (error) {
      console.error("Delete flight failed:", error);
      alert("Error de conexión al eliminar el vuelo");
    }
  }, []);

  const handleEditFlight = useCallback((flight: Flight) => {
    // Navigate to log-flight tab and pass the flight ID as a query param for editing
    router.push({
      pathname: "/(dashboard)/log-flight",
      params: { editId: flight.id },
    });
  }, [router]);

  // Maps aircraft by ID for quick access
  const aircraftMap = useMemo(() => new Map(aircraft.map((a) => [a.id, a])), [aircraft]);

  // Sorting: newest flights first
  const sortedFlights = useMemo(() => {
    return [...flights].sort(
      (a, b) => new Date(b.takeoff).getTime() - new Date(a.takeoff).getTime()
    );
  }, [flights]);

  // Filter in-memory based on search query
  const filteredFlights = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return sortedFlights;

    return sortedFlights.filter((flight) => {
      const routeMatch = flight.route.toLowerCase().includes(q);
      
      const ac = flight.aircraft_id ? aircraftMap.get(flight.aircraft_id) : undefined;
      const acMatch = ac
        ? ac.registration.toLowerCase().includes(q) || ac.type.toLowerCase().includes(q)
        : false;

      const dateMatch = flight.date.toLowerCase().includes(q);

      return routeMatch || acMatch || dateMatch;
    });
  }, [sortedFlights, searchQuery, aircraftMap]);

  // Render item memoized callback
  const renderItem = useCallback(({ item, index }: { item: Flight; index: number }) => {
    const ac = item.aircraft_id ? aircraftMap.get(item.aircraft_id) : undefined;
    return (
      <FadeInView delay={Math.min(index * 40, 240)} duration={350}>
        <FlightCard
          flight={item}
          aircraft={ac}
          onEdit={handleEditFlight}
          onDelete={handleDeleteFlight}
        />
      </FadeInView>
    );
  }, [aircraftMap, handleEditFlight, handleDeleteFlight]);

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleArea}>
            <View style={[styles.accentBar, { backgroundColor: colors.border }]} />
            <Text style={[styles.title, { color: colors.text }]}>Bitácora</Text>
            <View style={styles.headerMeta}>
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {flights.length} Vuelos Registrados
              </Text>
              <Text style={{ color: colors.border }}> • </Text>
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                Historial Completo
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/(dashboard)/log-flight")}
            style={[styles.addButton, { backgroundColor: colors.accent }]}
            activeOpacity={0.8}
          >
            <Text style={[styles.addButtonText, { color: colors.accentText }]}>Nuevo Registro</Text>
            <Plus size={16} color={colors.accentText} />
          </TouchableOpacity>
        </View>

        {/* Search Input Box */}
        <View style={styles.searchContainer}>
          <Search size={16} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            placeholder="BUSCAR VUELO, RUTA O MATRÍCULA..."
            placeholderTextColor={colors.textSecondary + "80"}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="characters"
            style={[
              styles.searchInput,
              {
                color: colors.text,
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          />
        </View>

        {/* List content */}
        <FlatList
          data={filteredFlights}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={[styles.emptyContainer, { borderColor: colors.border }]}>
              <View style={[styles.emptyIconBg, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Plane size={24} color={colors.textSecondary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin registros</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Inicia tu carrera registrando tu primer vuelo
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(dashboard)/log-flight")}
                style={[styles.emptyButton, { borderBottomColor: colors.border }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.emptyButtonText, { color: colors.text }]}>Registrar Ahora</Text>
                <Plus size={12} color={colors.text} />
              </TouchableOpacity>
            </View>
          }
        />
      </View>
    </SafeAreaView>
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
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 20,
    marginTop: 8,
  },
  headerTitleArea: {
    flex: 1,
    gap: 4,
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
  headerMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 8,
    alignSelf: "flex-end",
  },
  addButtonText: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  searchContainer: {
    position: "relative",
    width: "100%",
    marginBottom: 16,
  },
  searchIcon: {
    position: "absolute",
    left: 16,
    top: 18,
    zIndex: 10,
  },
  searchInput: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingLeft: 44,
    paddingRight: 16,
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },
  listContent: {
    paddingBottom: 120,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 24,
    marginTop: 10,
  },
  emptyIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.5,
    textTransform: "uppercase",
  },
  emptySubtitle: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginTop: 6,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    paddingBottom: 4,
    marginTop: 24,
    gap: 6,
  },
  emptyButtonText: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
});
