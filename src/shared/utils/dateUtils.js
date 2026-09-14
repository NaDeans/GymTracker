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

// Shifts a DD/MM/YY string by `deltaDays` (may be negative).
//
// Built from explicit components rather than `new Date("YYYY-MM-DD")`: that
// form parses as UTC midnight while getDate()/getMonth() read local parts, so
// west of Greenwich it silently lands a day early. The Date constructor still
// does the month/year rollover for us.
export const shiftDmy = (dmy, deltaDays) => {
  const [d, m, y] = dmy.split("/").map(Number);
  const dateObj = new Date(2000 + y, m - 1, d + deltaDays);
  const dd = String(dateObj.getDate()).padStart(2, "0");
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const yy = String(dateObj.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
};
