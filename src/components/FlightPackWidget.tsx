import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { BentoCard } from "./BentoCard";
import { Clock, AlertCircle } from "lucide-react-native";

export interface FlightPack {
  id: string;
  name: string;
  total_hours: number;
  remaining_hours: number;
  is_active: boolean;
  start_date?: string | null;
  aircraft_ids: string[];
}

interface FlightPackWidgetProps {
  packs: FlightPack[];
}

export const FlightPackWidget: React.FC<FlightPackWidgetProps> = ({ packs }) => {
  const { colors } = useTheme();

  if (!packs || packs.length === 0) return null;

  const activePacks = packs.filter((p) => p.is_active);
  if (activePacks.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Packs de Horas</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Estado de Saldo</Text>
      </View>

      {/* Grid List */}
      <View style={styles.grid}>
        {activePacks.map((pack) => {
          const percentage = Math.max(0, Math.min(100, (pack.remaining_hours / pack.total_hours) * 100));
          const isDebt = pack.remaining_hours < 0;
          const isLow = percentage < 20 && !isDebt;

          const themeColors = {
            iconBg: isDebt
              ? colors.red
              : isLow
              ? colors.red + "15"
              : colors.accent,
            iconColor: isDebt
              ? "#ffffff"
              : isLow
              ? colors.red
              : colors.accentText,
          };

          return (
            <BentoCard key={pack.id} style={styles.packCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconWrapper, { backgroundColor: themeColors.iconBg }]}>
                  {isDebt || isLow ? (
                    <AlertCircle size={20} color={themeColors.iconColor} />
                  ) : (
                    <Clock size={20} color={themeColors.iconColor} />
                  )}
                </View>
                <View style={styles.headerText}>
                  <Text style={[styles.cardType, { color: colors.textSecondary }]}>
                    {isDebt ? "Saldo Deudor" : "Paquete de Vuelo"}
                  </Text>
                  <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>
                    {pack.name}
                  </Text>
                </View>
              </View>

              <View style={styles.content}>
                <View style={styles.statsRow}>
                  <View>
                    <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>
                      {isDebt ? "Deuda Acumulada" : "Disponible"}
                    </Text>
                    <Text
                      style={[
                        styles.statsValue,
                        { color: isDebt ? colors.red : colors.text },
                      ]}
                    >
                      {pack.remaining_hours.toFixed(1)}
                      <Text style={[styles.statsTotal, { color: colors.textSecondary }]}>
                        {" "}/ {pack.total_hours}H
                      </Text>
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.percentageText,
                      { color: isDebt ? colors.red : isLow ? colors.red : colors.text },
                    ]}
                  >
                    {isDebt ? "DEUDA" : `${Math.round(percentage)}%`}
                  </Text>
                </View>

                {/* Progress Bar background */}
                <View style={[styles.progressBarBg, { backgroundColor: colors.background }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${isDebt ? 100 : percentage}%`,
                        backgroundColor: isDebt ? colors.red : isLow ? colors.red : colors.accent,
                      },
                    ]}
                  />
                </View>
              </View>
            </BentoCard>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginVertical: 8,
  },
  header: {
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
    textTransform: "uppercase",
  },
  subtitle: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginTop: 2,
  },
  grid: {
    gap: 16,
  },
  packCard: {
    width: "100%",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  cardType: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  cardName: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginTop: 1,
  },
  content: {
    marginTop: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 10,
  },
  statsLabel: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -1,
    lineHeight: 32,
  },
  statsTotal: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0,
  },
  percentageText: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  progressBarBg: {
    height: 6,
    width: "100%",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
});
