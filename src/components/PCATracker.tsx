import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { BentoCard } from "./BentoCard";
import Svg, { Circle as SvgCircle } from "react-native-svg";
import { Target, Compass, Navigation, Moon, Award, Clock, Check } from "lucide-react-native";

interface Flight {
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

interface PCATrackerProps {
  flights: Flight[];
}

export const PCATracker: React.FC<PCATrackerProps> = ({ flights }) => {
  const { colors } = useTheme();

  const totalHours = flights.reduce((acc, f) => acc + (f.duration || 0), 0);
  
  const picHours = flights.reduce((acc, f) => {
    return acc + (f.pic_day_loc || 0) + (f.pic_day_tra || 0) + (f.pic_night_loc || 0) + (f.pic_night_tra || 0);
  }, 0);

  const picTravesia = flights.reduce((acc, f) => {
    return acc + (f.pic_day_tra || 0) + (f.pic_night_tra || 0);
  }, 0);

  const realInstrument = flights.reduce((acc, f) => acc + (f["IMC Pil"] || 0) + (f["Capota"] || 0), 0);
  const simInstrumentRaw = flights.reduce((acc, f) => acc + (f["Sim Pil en Inst"] || 0), 0);
  const instrumentHours = realInstrument + Math.min(simInstrumentRaw, 5);

  const nightHours = flights.reduce((acc, f) => {
    return acc + (f.pic_night_loc || 0) + (f.pic_night_tra || 0);
  }, 0);

  const nightLandings = flights.reduce((acc, f) => {
    if ((f.pic_night_loc || 0) > 0 || (f.pic_night_tra || 0) > 0) {
      return acc + (f.landings || 0);
    }
    return acc;
  }, 0);

  const requirements = [
    { label: "PIC", current: picHours, target: 100, subTarget: 70, unit: "hs", icon: <Target size={16} color={colors.textSecondary} /> },
    { label: "PIC Travesía", current: picTravesia, target: 20, unit: "hs", icon: <Compass size={16} color={colors.textSecondary} /> },
    { label: "Instrumentos", current: instrumentHours, target: 10, unit: "hs", icon: <Navigation size={16} color={colors.textSecondary} /> },
    { label: "PIC Nocturno", current: nightHours, target: 5, unit: "hs", icon: <Moon size={16} color={colors.textSecondary} /> },
    { label: "Aterrizajes Noct.", current: nightLandings, target: 5, unit: "atrr", icon: <Award size={16} color={colors.textSecondary} /> }
  ];

  const totalProgress = Math.min((totalHours / 200) * 100, 100);

  // SVG parameters for circular gauge
  const radius = 55;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (totalProgress / 100) * circumference;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Tracker PCA</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Reg. 61.620</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.accent }]}>
          <View style={styles.badgeDot} />
          <Text style={[styles.badgeText, { color: colors.accentText }]}>En Progreso</Text>
        </View>
      </View>

      {/* Bento Layout Card */}
      <BentoCard style={styles.cardContainer}>
        {/* Circle Gauge Container */}
        <View style={[styles.gaugeContainer, { borderColor: colors.border }]}>
          <View style={styles.svgWrapper}>
            <Svg width={140} height={140} viewBox="0 0 140 140">
              {/* Background circle */}
              <SvgCircle
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={colors.border}
                strokeWidth={strokeWidth}
              />
              {/* Foreground circle */}
              <SvgCircle
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={colors.accent}
                strokeWidth={strokeWidth}
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 70 70)"
              />
            </Svg>
            <View style={styles.gaugeInner}>
              <Clock size={16} color={colors.textSecondary} style={styles.gaugeIcon} />
              <Text style={[styles.gaugeValue, { color: colors.text }]}>{totalHours.toFixed(1)}</Text>
              <Text style={[styles.gaugeTarget, { color: colors.textSecondary }]}>/ 200 HS</Text>
            </View>
          </View>
          <View style={styles.gaugeTextWrapper}>
            <Text style={[styles.gaugeTitle, { color: colors.text }]}>Experiencia Total</Text>
            <Text style={[styles.gaugeInfo, { color: colors.textSecondary }]}>
              Progreso hacia la meta{"\n"}(Reducido: 150hs)
            </Text>
          </View>
        </View>

        {/* Detailed Requirements List */}
        <View style={styles.reqList}>
          {requirements.map((req, i) => {
            const progress = Math.min((req.current / req.target) * 100, 100);
            const isComplete = req.current >= req.target;
            const isSubComplete = req.subTarget ? req.current >= req.subTarget : false;

            return (
              <View key={i} style={styles.reqItem}>
                <View
                  style={[
                    styles.reqIconWrapper,
                    {
                      backgroundColor: isComplete ? colors.green + "15" : colors.background,
                    },
                  ]}
                >
                  {isComplete ? (
                    <Check size={14} color={colors.green} />
                  ) : (
                    req.icon
                  )}
                </View>

                <View style={styles.reqProgressWrapper}>
                  <View style={styles.reqHeaderRow}>
                    <Text style={[styles.reqLabel, { color: colors.text }]}>{req.label}</Text>
                    <Text style={[styles.reqStats, { color: colors.text }]}>
                      {req.current.toFixed(1)}{" "}
                      <Text style={[styles.reqUnit, { color: colors.textSecondary }]}>
                        {req.unit}
                      </Text>
                    </Text>
                  </View>

                  {/* Progress Bar background */}
                  <View style={[styles.progressBarBg, { backgroundColor: colors.background }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${progress}%`,
                          backgroundColor: isComplete
                            ? colors.green
                            : isSubComplete
                            ? "#f59e0b" // amber-500
                            : colors.accent,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </BentoCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
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
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4ade80",
    marginRight: 6,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  cardContainer: {
    padding: 0,
  },
  gaugeContainer: {
    alignItems: "center",
    paddingVertical: 24,
    borderBottomWidth: 1,
  },
  svgWrapper: {
    width: 140,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
  },
  gaugeInner: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  gaugeIcon: {
    marginBottom: 2,
  },
  gaugeValue: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -1,
  },
  gaugeTarget: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 2,
  },
  gaugeTextWrapper: {
    alignItems: "center",
    marginTop: 12,
  },
  gaugeTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  gaugeInfo: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    textAlign: "center",
    lineHeight: 14,
    marginTop: 4,
  },
  reqList: {
    padding: 20,
    gap: 16,
  },
  reqItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  reqIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  reqProgressWrapper: {
    flex: 1,
  },
  reqHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 6,
  },
  reqLabel: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  reqStats: {
    fontSize: 12,
    fontWeight: "bold",
  },
  reqUnit: {
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
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
