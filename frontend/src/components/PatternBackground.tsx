import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";

interface Props {
  color?: string;
  opacity?: number;
  paws?: boolean;
}

// A subtle decorative background pattern: scattered dots, soft circles, paw
// prints and DNA-helix-ish curves. Renders behind the splash content.
export const PatternBackground: React.FC<Props> = ({ color = "#ffffff", opacity = 0.06, paws = true }) => {
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}>
      <Svg width="100%" height="100%" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
        {/* large soft blobs */}
        <Circle cx="-40" cy="80" r="160" fill={color} opacity={opacity * 1.4} />
        <Circle cx="440" cy="200" r="190" fill={color} opacity={opacity * 1.2} />
        <Circle cx="-60" cy="640" r="200" fill={color} opacity={opacity * 1.2} />
        <Circle cx="430" cy="720" r="150" fill={color} opacity={opacity * 1.4} />

        {/* scattered dots */}
        <G fill={color} opacity={opacity * 2.2}>
          <Circle cx="40" cy="160" r="2" />
          <Circle cx="78" cy="120" r="1.4" />
          <Circle cx="110" cy="190" r="2.2" />
          <Circle cx="360" cy="100" r="2" />
          <Circle cx="330" cy="170" r="1.6" />
          <Circle cx="380" cy="280" r="2.4" />
          <Circle cx="22" cy="300" r="1.8" />
          <Circle cx="60" cy="460" r="2" />
          <Circle cx="370" cy="510" r="1.8" />
          <Circle cx="340" cy="600" r="2.2" />
          <Circle cx="36" cy="680" r="1.6" />
          <Circle cx="200" cy="40" r="1.4" />
          <Circle cx="170" cy="60" r="1" />
          <Circle cx="240" cy="50" r="1.2" />
        </G>

        {/* DNA helix-ish curves (left) */}
        <G stroke={color} strokeWidth="1.4" fill="none" opacity={opacity * 2.4}>
          <Path d="M30 40 Q60 80 30 120 Q0 160 30 200 Q60 240 30 280 Q0 320 30 360" />
          <Path d="M50 40 Q20 80 50 120 Q80 160 50 200 Q20 240 50 280 Q80 320 50 360" />
        </G>

        {/* hex molecule (right) */}
        <G stroke={color} strokeWidth="1.2" fill="none" opacity={opacity * 2.2}>
          <Path d="M330 380 l20 -12 l20 12 l0 24 l-20 12 l-20 -12 z" />
          <Path d="M350 416 l0 24" />
          <Path d="M370 404 l20 12" />
          <Path d="M330 404 l-20 12" />
        </G>

        {/* Paw prints */}
        {paws && (
          <G fill={color} opacity={opacity * 2}>
            <Paw cx={350} cy={70} />
            <Paw cx={30} cy={420} s={0.8} />
            <Paw cx={360} cy={460} s={0.9} />
            <Paw cx={70} cy={720} s={1.1} />
          </G>
        )}
      </Svg>
    </View>
  );
};

const Paw: React.FC<{ cx: number; cy: number; s?: number }> = ({ cx, cy, s = 1 }) => (
  <G transform={`translate(${cx}, ${cy}) scale(${s})`}>
    <Circle cx="-8" cy="-6" r="3" />
    <Circle cx="0" cy="-9" r="3" />
    <Circle cx="8" cy="-6" r="3" />
    <Circle cx="-10" cy="2" r="2.4" />
    <Circle cx="10" cy="2" r="2.4" />
    <Path d="M-7 6 Q0 -2 7 6 Q10 12 0 14 Q-10 12 -7 6 Z" />
  </G>
);
