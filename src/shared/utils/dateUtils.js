// Returns today's date in DD/MM/YY (local time)
export const todayString = () => {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, "0");
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const y = String(now.getFullYear()).slice(-2);
  return `${d}/${m}/${y}`;
};

// DD/MM/YY → YYYY-MM-DD (required by react-native-calendars)
export const dmyToIso = (dmy) => {
  const [d, m, y] = dmy.split("/");
  return `20${y}-${m}-${d}`;
};

// YYYY-MM-DD → DD/MM/YY
export const isoToDmy = (iso) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y.slice(-2)}`;
};
