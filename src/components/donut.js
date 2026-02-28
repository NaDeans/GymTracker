import Svg, { G, Circle } from "react-native-svg";

export const Donut = ({ macros, size = 140, strokeWidth = 18, colors }) => {
  const { protein, carbs, fats } = macros;
  const total = protein + carbs + fats;
  if (total === 0) return null;

  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;

  const protPerc = protein / total;
  const carbPerc = carbs / total;
  const fatPerc = fats / total;

  const baseCircleProps = { cx: size / 2, cy: size / 2, r, strokeWidth, fill: "none" };

  return (
    <Svg width={size} height={size}>
      <G transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <Circle {...baseCircleProps} stroke={colors.background} />
        <Circle {...baseCircleProps} stroke={colors.protein} strokeDasharray={`${c * protPerc} ${c}`} strokeLinecap="round" />
        <Circle {...baseCircleProps} stroke={colors.carbs} strokeDasharray={`${c * carbPerc} ${c}`} strokeDashoffset={-c * protPerc} strokeLinecap="round" />
        <Circle {...baseCircleProps} stroke={colors.fats} strokeDasharray={`${c * fatPerc} ${c}`} strokeDashoffset={-(c * (protPerc + carbPerc))} strokeLinecap="round" />
      </G>
    </Svg>
  );
};