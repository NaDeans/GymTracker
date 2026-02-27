// Donut.js
// A circular macro chart showing protein, carbs, and fats proportionally
import React from "react";
import { Svg, G, Circle } from "react-native-svg";

/**
 * Donut component for visualizing macro breakdown.
 *
 * @param {object} macros - Object containing protein, carbs, fats
 * @param {number} size - Diameter of the chart in pixels
 * @param {number} strokeWidth - Width of the donut strokes
 * @param {object} colors - Colors for the chart segments: { background, protein, carbs, fats }
 */
const Donut = ({ macros, size = 140, strokeWidth = 18, colors }) => {
  const { protein = 0, carbs = 0, fats = 0 } = macros; // default to 0
  const total = protein + carbs + fats;

  // If no macros logged, render nothing
  if (total === 0) return null;

  // Circle radius and circumference calculations
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate percentage of each macro
  const protPerc = protein / total;
  const carbPerc = carbs / total;
  const fatPerc = fats / total;

  // Base circle props shared across all segments
  const baseCircleProps = {
    cx: size / 2,
    cy: size / 2,
    r: radius,
    strokeWidth,
    fill: "none",
  };

  return (
    <Svg width={size} height={size}>
      {/* Rotate -90° to start chart from top */}
      <G transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {/* Background circle */}
        <Circle {...baseCircleProps} stroke={colors.background} />

        {/* Protein segment */}
        <Circle
          {...baseCircleProps}
          stroke={colors.protein}
          strokeDasharray={`${circumference * protPerc} ${circumference}`}
          strokeLinecap="round"
        />

        {/* Carbs segment */}
        <Circle
          {...baseCircleProps}
          stroke={colors.carbs}
          strokeDasharray={`${circumference * carbPerc} ${circumference}`}
          strokeDashoffset={-circumference * protPerc}
          strokeLinecap="round"
        />

        {/* Fats segment */}
        <Circle
          {...baseCircleProps}
          stroke={colors.fats}
          strokeDasharray={`${circumference * fatPerc} ${circumference}`}
          strokeDashoffset={-(circumference * (protPerc + carbPerc))}
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
};

export default Donut;