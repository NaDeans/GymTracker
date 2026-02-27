// dateUtils.js
// Utility functions for formatting dates in DD/MM/YY or ISO (YYYY-MM-DD) formats

/**
 * Returns today's date in DD/MM/YY format (local time)
 * @returns {string} e.g. "26/02/26"
 */
export const getTodayDDMMYY = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const yearShort = String(now.getFullYear()).slice(-2);
  return `${day}/${month}/${yearShort}`;
};

/**
 * Converts a date from DD/MM/YY format to ISO format YYYY-MM-DD
 * Useful for storage or calendar input
 * @param {string} dateDDMMYY - date string in DD/MM/YY
 * @returns {string} date in YYYY-MM-DD
 */
export const convertDDMMYYtoISO = (dateDDMMYY) => {
  const [day, month, yearShort] = dateDDMMYY.split("/");
  return `20${yearShort}-${month}-${day}`;
};

/**
 * Converts a date from ISO format YYYY-MM-DD to DD/MM/YY
 * Useful for displaying dates to users
 * @param {string} dateISO - date string in YYYY-MM-DD
 * @returns {string} date in DD/MM/YY
 */
export const convertISOtoDDMMYY = (dateISO) => {
  const [yearFull, month, day] = dateISO.split("-");
  const yearShort = yearFull.slice(-2);
  return `${day}/${month}/${yearShort}`;
};