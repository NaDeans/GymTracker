export const KG_PER_LB = 0.45359237;
export const LB_PER_KG = 1 / KG_PER_LB;
export const KCAL_TO_KJ = 4.184;
export const CM_PER_INCH = 2.54;
export const L_TO_FLOZ_US = 33.814022702;

export const kgToLb = (kg) => kg * LB_PER_KG;
export const lbToKg = (lb) => lb * KG_PER_LB;

export const kcalToKj = (kcal) => kcal * KCAL_TO_KJ;
export const kjToKcal = (kj) => kj / KCAL_TO_KJ;

export const litersToFlOz = (l) => l * L_TO_FLOZ_US;
export const flOzToLiters = (flOz) => flOz / L_TO_FLOZ_US;

export const cmToFtIn = (cm) => {
  const totalInches = cm / CM_PER_INCH;
  const ft = Math.floor(totalInches / 12);
  const inch = totalInches - ft * 12;
  return { ft, inch };
};

export const ftInToCm = (ft, inch) => (ft * 12 + inch) * CM_PER_INCH;

export const calculateEpley1RM = (weight, reps) => weight * (1 + reps / 30);

export const parseInput = (text) => {
  if (text === null || text === undefined) return null;
  const trimmed = String(text).trim();
  if (trimmed === "") return null;
  const n = parseFloat(trimmed);
  return Number.isFinite(n) ? n : null;
};
