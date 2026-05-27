import React, { useState } from "react";
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { BentoCard } from "./BentoCard";
import Svg, { Rect, Line, Text as SvgText } from "react-native-svg";

interface ChartData {
  name: string;
  hours: number;
}

interface PieData {
  name: string;
  value: number;
  color: string;
}

interface DashboardChartsProps {
  monthlyData: ChartData[];
  aircraftData: PieData[];
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  monthlyData = [],
  aircraftData = [],
}) => {
  const { colors } = useTheme();
  const [selectedBar, setSelectedBar] = useState<number | null>(null);

  // SVG dimensions for the bar chart
  const containerWidth = Dimensions.get("window").width - 80; // Padding adjustments
  const chartHeight = 160;
  const paddingBottom = 24;
  const paddingTop = 12;
  const paddingLeft = 32;
  const paddingRight = 16;

  const graphHeight = chartHeight - paddingTop - paddingBottom;
  const graphWidth = containerWidth - paddingLeft - paddingRight;

  // Max value calculation for Y-Axis scale
  const maxHours = Math.max(...monthlyData.map((d) => d.hours), 5);
  const yTicks = [0, Math.round(maxHours / 2), Math.round(maxHours)];

  return (
    <View style={styles.container}>
      {/* 1. Monthly Hours Bar Chart */}
      <BentoCard style={styles.chartCard}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Horas por Mes</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Tendencia Temporal</Text>
        </View>

        {monthlyData.length > 0 ? (
          <View style={styles.chartWrapper}>
            {selectedBar !== null && (
              <View style={[styles.bubble, { backgroundColor: colors.accent, left: paddingLeft + (selectedBar * (graphWidth / monthlyData.length)) }]}>
                <Text style={[styles.bubbleText, { color: colors.accentText }]}>
                  {monthlyData[selectedBar].hours.toFixed(1)}h
                </Text>
              </View>
            )}

            <Svg width={containerWidth} height={chartHeight}>
              {/* Grid Lines & Y Ticks */}
              {yTicks.map((tick, i) => {
                const y = chartHeight - paddingBottom - (tick / maxHours) * graphHeight;
                return (
                  <React.Fragment key={i}>
                    <Line
                      x1={paddingLeft}
                      y1={y}
                      x2={containerWidth - paddingRight}
                      y2={y}
                      stroke={colors.border}
                      strokeWidth={1}
                      strokeDasharray="4 4"
                    />
                    <SvgText
                      x={paddingLeft - 8}
                      y={y + 4}
                      fill={colors.textSecondary}
                      fontSize={9}
                      fontWeight="bold"
                      textAnchor="end"
                    >
                      {tick}
                    </SvgText>
                  </React.Fragment>
                );
              })}

              {/* Bars and X Labels */}
              {monthlyData.map((data, index) => {
                const barWidth = Math.min(24, (graphWidth / monthlyData.length) * 0.6);
                const barHeight = (data.hours / maxHours) * graphHeight;
                const x =
                  paddingLeft +
                  index * (graphWidth / monthlyData.length) +
                  (graphWidth / monthlyData.length) / 2 -
                  barWidth / 2;
                const y = chartHeight - paddingBottom - barHeight;

                const isSelected = selectedBar === index;

                return (
                  <React.Fragment key={index}>
                    {/* Bar */}
                    <Rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={Math.max(barHeight, 2)} // Minimal height to show a pixel even if 0
                      rx={4}
                      ry={4}
                      fill={isSelected ? colors.accent : colors.textSecondary + "40"}
                      onPress={() => setSelectedBar(isSelected ? null : index)}
                    />
                    
                    {/* X Tick Label */}
                    <SvgText
                      x={x + barWidth / 2}
                      y={chartHeight - 6}
                      fill={colors.textSecondary}
                      fontSize={9}
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {data.name}
                    </SvgText>
                  </React.Fragment>
                );
              })}
            </Svg>
          </View>
        ) : (
          <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Sin datos mensuales</Text>
          </View>
        )}
      </BentoCard>

      {/* 2. Aircraft Hours Horizontal Distribution */}
      <BentoCard style={styles.chartCard}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Horas por Aeronave</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Distribución de Flota</Text>
        </View>

        {aircraftData.length > 0 ? (
          <View style={styles.listWrapper}>
            {aircraftData.map((aircraft, i) => {
              const totalVal = aircraftData.reduce((sum, item) => sum + item.value, 0);
              const percentage = totalVal > 0 ? (aircraft.value / totalVal) * 100 : 0;

              return (
                <View key={i} style={styles.listItem}>
                  <View style={styles.listHeaderRow}>
                    <View style={styles.dotLabelRow}>
                      <View style={[styles.dot, { backgroundColor: colors.accent }]} />
                      <Text style={[styles.aircraftName, { color: colors.text }]}>
                        {aircraft.name}
                      </Text>
                    </View>
                    <Text style={[styles.aircraftValue, { color: colors.text }]}>
                      {aircraft.value.toFixed(1)}h{" "}
                      <Text style={[styles.aircraftPercent, { color: colors.textSecondary }]}>
                        ({Math.round(percentage)}%)
                      </Text>
                    </Text>
                  </View>

                  {/* Horizontal Bar indicator */}
                  <View style={[styles.barBg, { backgroundColor: colors.background }]}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${percentage}%`,
                          backgroundColor: colors.accent,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Sin registros de aeronaves</Text>
          </View>
        )}
      </BentoCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 16,
  },
  chartCard: {
    width: "100%",
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2.0,
    textTransform: "uppercase",
    marginTop: 2,
  },
  chartWrapper: {
    position: "relative",
    alignItems: "center",
  },
  bubble: {
    position: "absolute",
    top: -24,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateX: -16 }],
  },
  bubbleText: {
    fontSize: 9,
    fontWeight: "bold",
  },
  listWrapper: {
    gap: 14,
  },
  listItem: {
    width: "100%",
  },
  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  dotLabelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  aircraftName: {
    fontSize: 12,
    fontWeight: "700",
  },
  aircraftValue: {
    fontSize: 12,
    fontWeight: "700",
  },
  aircraftPercent: {
    fontSize: 9,
    fontWeight: "bold",
  },
  barBg: {
    height: 5,
    borderRadius: 2.5,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 2.5,
  },
  emptyContainer: {
    height: 100,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
});
