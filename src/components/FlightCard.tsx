import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated, LayoutAnimation, Platform } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { BentoCard } from "./BentoCard";
import { splitRoute } from "../utils/helpers";
import { Plane, Clock, ChevronDown, ChevronUp, Edit2, Trash2, Calendar, User, Users, Cloud, Monitor } from "lucide-react-native";

export interface Flight {
  id: string;
  aircraft_id: string;
  date: string;
  route: string;
  duration: number;
  landings: number;
  takeoff: string;
  landing: string;
  pic_day_loc?: number | null;
  pic_day_tra?: number | null;
  pic_night_loc?: number | null;
  pic_night_tra?: number | null;
  sic_day_loc?: number | null;
  sic_day_tra?: number | null;
  sic_night_loc?: number | null;
  sic_night_tra?: number | null;
  "IMC Pil"?: number | null;
  "IMC Cop"?: number | null;
  "Capota"?: number | null;
  "Sim Instructor"?: number | null;
  "Sim Pil en Inst"?: number | null;
}

export interface Aircraft {
  id: string;
  registration: string;
  icao: string;
  type: string;
  type_acft: string;
}

interface FlightCardProps {
  flight: Flight;
  aircraft: Aircraft | undefined;
  onEdit: (flight: Flight) => void;
  onDelete: (id: string) => Promise<void>;
}

export const FlightCard: React.FC<FlightCardProps> = React.memo(({
  flight,
  aircraft,
  onEdit,
  onDelete,
}) => {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [origin, dest] = splitRoute(flight.route);

  const toggleOpen = () => {
    if (Platform.OS !== "web") {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setIsOpen(!isOpen);
  };

  const handleDelete = () => {
    Alert.alert(
      "Eliminar Registro",
      "¿Estás seguro de que deseas eliminar este vuelo de tu bitácora?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => onDelete(flight.id),
        },
      ]
    );
  };

  const logs = [
    { label: "PIC Día Loc", value: flight.pic_day_loc, icon: <User size={12} color={colors.textSecondary} /> },
    { label: "PIC Día Trav", value: flight.pic_day_tra, icon: <User size={12} color={colors.textSecondary} /> },
    { label: "PIC Noc Loc", value: flight.pic_night_loc, icon: <User size={12} color={colors.textSecondary} /> },
    { label: "PIC Noc Trav", value: flight.pic_night_tra, icon: <User size={12} color={colors.textSecondary} /> },
    { label: "SIC Día Loc", value: flight.sic_day_loc, icon: <Users size={12} color={colors.textSecondary} /> },
    { label: "SIC Día Trav", value: flight.sic_day_tra, icon: <Users size={12} color={colors.textSecondary} /> },
    { label: "SIC Noc Loc", value: flight.sic_night_loc, icon: <Users size={12} color={colors.textSecondary} /> },
    { label: "SIC Noc Trav", value: flight.sic_night_tra, icon: <Users size={12} color={colors.textSecondary} /> },
    { label: "IMC Piloto", value: flight["IMC Pil"], icon: <Cloud size={12} color={colors.textSecondary} /> },
    { label: "IMC Copiloto", value: flight["IMC Cop"], icon: <Cloud size={12} color={colors.textSecondary} /> },
    { label: "Capota", value: flight["Capota"], icon: <Monitor size={12} color={colors.textSecondary} /> },
    { label: "Sim. Inst.", value: flight["Sim Instructor"], icon: <Monitor size={12} color={colors.textSecondary} /> },
    { label: "Sim. Piloto", value: flight["Sim Pil en Inst"], icon: <Monitor size={12} color={colors.textSecondary} /> },
  ].filter((log) => log.value && log.value > 0);

  // Format UTC dates to HH:MM times
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const hours = date.getUTCHours().toString().padStart(2, "0");
      const minutes = date.getUTCMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    } catch {
      return "--:--";
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr + "T00:00:00Z");
      return date.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <BentoCard style={[styles.card, { borderColor: isOpen ? colors.border : "transparent" }]}>
      <TouchableOpacity onPress={toggleOpen} activeOpacity={0.8} style={styles.mainClickable}>
        <View style={styles.topRow}>
          {/* Routes */}
          <View style={styles.routes}>
            <View style={styles.routeCol}>
              <Text style={[styles.routeLabel, { color: colors.textSecondary }]}>DEP</Text>
              <Text style={[styles.routeText, { color: colors.text }]}>{origin}</Text>
            </View>
            <View style={[styles.routeLine, { backgroundColor: colors.border }]} />
            <View style={styles.routeCol}>
              <Text style={[styles.routeLabel, { color: colors.textSecondary }]}>ARR</Text>
              <Text style={[styles.routeText, { color: colors.text }]}>{dest}</Text>
            </View>
          </View>

          {/* Duration */}
          <View style={styles.durationWrapper}>
            <Text style={[styles.durationText, { color: colors.text }]}>
              {flight.duration.toFixed(1)}
              <Text style={[styles.durationUnit, { color: colors.textSecondary }]}>H</Text>
            </Text>
            <Text style={[styles.durationLabel, { color: colors.textSecondary }]}>Block Time</Text>
          </View>
        </View>

        {/* Lower Row */}
        <View style={styles.bottomRow}>
          <View style={styles.aircraftMeta}>
            <Text style={[styles.aircraftText, { color: colors.text }]}>
              {aircraft?.registration || "Matrícula"}
              <Text style={{ color: colors.border }}> • </Text>
              {aircraft?.type || "Aeronave"}
            </Text>
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>
              {formatDate(flight.date)}
            </Text>
          </View>
          
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => onEdit(flight)} style={[styles.actionButton, { backgroundColor: colors.background }]} activeOpacity={0.7}>
              <Edit2 size={12} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={[styles.actionButton, { backgroundColor: colors.background }]} activeOpacity={0.7}>
              <Trash2 size={12} color={colors.red} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      {/* Expanded Content */}
      {isOpen && (
        <View style={[styles.expandedArea, { borderTopColor: colors.border }]}>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Despegue (UTC)</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{formatTime(flight.takeoff)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Aterrizaje (UTC)</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{formatTime(flight.landing)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Ciclos / Aterr.</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{flight.landings} Aterr.</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Tipo ICAO</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{aircraft?.icao || "---"}</Text>
            </View>
          </View>

          {/* Breakdown log lists */}
          {logs.length > 0 && (
            <View style={styles.logsBreakdown}>
              <Text style={[styles.breakdownTitle, { color: colors.textSecondary }]}>Desglose Log</Text>
              <View style={styles.logsList}>
                {logs.map((log, i) => (
                  <View key={i} style={[styles.logBadge, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    {log.icon}
                    <Text style={[styles.logBadgeLabel, { color: colors.text }]}>
                      {log.label}:
                    </Text>
                    <Text style={[styles.logBadgeValue, { color: colors.blue }]}>
                      {" "}{log.value?.toFixed(1)}H
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </BentoCard>
  );
});

const styles = StyleSheet.create({
  card: {
    marginVertical: 4,
    borderWidth: 1,
    padding: 0,
    borderRadius: 20,
  },
  mainClickable: {
    padding: 16,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  routes: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  routeCol: {
    flexDirection: "column",
  },
  routeLabel: {
    fontSize: 8,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },
  routeText: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginTop: 2,
  },
  routeLine: {
    width: 24,
    height: 1,
  },
  durationWrapper: {
    alignItems: "flex-end",
  },
  durationText: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -1,
  },
  durationUnit: {
    fontSize: 12,
    fontWeight: "800",
  },
  durationLabel: {
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  aircraftMeta: {
    flexDirection: "column",
    gap: 2,
  },
  aircraftText: {
    fontSize: 12,
    fontWeight: "700",
  },
  dateText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  expandedArea: {
    borderTopWidth: 1,
    padding: 16,
    gap: 16,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 12,
  },
  detailItem: {
    width: "50%",
  },
  detailLabel: {
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },
  logsBreakdown: {
    gap: 8,
  },
  breakdownTitle: {
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  logsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  logBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  logBadgeLabel: {
    fontSize: 9,
    fontWeight: "bold",
    marginLeft: 4,
  },
  logBadgeValue: {
    fontSize: 9,
    fontWeight: "bold",
  },
});
