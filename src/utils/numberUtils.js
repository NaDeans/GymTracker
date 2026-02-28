export const fmt = n => Number.isFinite(n) ? n.toFixed(1) : "0.0";

export const safeNumber = v => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};