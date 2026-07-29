import Svg, { G, Circle } from "react-native-svg";

// Draws N concentric "wedge rings", outermost first. Each ring is fully
// partitioned by its own wedges (e.g. protein/carbs/fats), which always sum
// to a full circle — there's no empty remainder, so no background track is
// drawn. Rings are meant to be overlaid at different opacities (e.g. a solid
// outer ring showing an actual composition next to a faint inner ring
// showing a target composition), so drift between the two shapes is visible
// where their wedge boundaries don't line up.
export const Donut = ({ rings, size = 160, ringWidth = 14, gap = 3 }) => {
  if (!rings || rings.length === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const baseRadius = (size - ringWidth) / 2;

  return (
    <Svg width={size} height={size}>
      <G transform={`rotate(-90 ${cx} ${cy})`}>
        {rings.map((ring, i) => {
          const total = ring.wedges.reduce((sum, w) => sum + Math.max(0, w.value), 0);
          if (total === 0) return null;

          const r = baseRadius - i * (ringWidth + gap);
          const c = 2 * Math.PI * r;
          const base = { cx, cy, r, strokeWidth: ringWidth, fill: "none" };
          let cumulative = 0;

          return (
            <G key={i} opacity={ring.opacity ?? 1}>
              {ring.wedges.map((w, j) => {
                if (w.value <= 0) return null;
                const perc = w.value / total;
                const dashOffset = -c * cumulative;
                cumulative += perc;
                return (
                  <Circle
                    key={j}
                    {...base}
                    stroke={w.color}
                    strokeDasharray={`${c * perc} ${c}`}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                  />
                );
              })}
            </G>
          );
        })}
      </G>
    </Svg>
  );
};
