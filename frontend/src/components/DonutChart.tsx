import React from "react";
import Svg, { Circle, G } from "react-native-svg";
import { View, Text, StyleSheet } from "react-native";

interface Slice { value: number; color: string; label?: string }

export const DonutChart: React.FC<{ data: Slice[]; size?: number; strokeWidth?: number; centerLabel?: string; centerValue?: string; theme: any }>
  = ({ data, size = 180, strokeWidth = 24, centerLabel, centerValue, theme }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let offset = 0;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <G rotation={-90} originX={cx} originY={cy}>
          <Circle cx={cx} cy={cy} r={radius} stroke={theme.border} strokeWidth={strokeWidth} fill="none" />
          {data.map((d, i) => {
            const ratio = d.value / total;
            const length = ratio * circumference;
            const dasharray = `${length} ${circumference - length}`;
            const el = (
              <Circle
                key={i}
                cx={cx}
                cy={cy}
                r={radius}
                stroke={d.color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={dasharray}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += length;
            return el;
          })}
        </G>
      </Svg>
      {(centerValue || centerLabel) && (
        <View style={[styles.center, { pointerEvents: "none" }]}>
          {centerValue ? <Text style={[styles.value, { color: theme.text }]}>{centerValue}</Text> : null}
          {centerLabel ? <Text style={[styles.label, { color: theme.textMuted }]}>{centerLabel}</Text> : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  center: { position: "absolute", alignItems: "center", justifyContent: "center" },
  value: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  label: { fontSize: 11, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", marginTop: 4 },
});
