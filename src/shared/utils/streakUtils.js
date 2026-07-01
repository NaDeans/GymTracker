import { todayString, dmyToIso } from "shared/utils/dateUtils";

const shiftDmy = (dmy, deltaDays) => {
  const dateObj = new Date(dmyToIso(dmy));
  dateObj.setDate(dateObj.getDate() + deltaDays);
  const d = String(dateObj.getDate()).padStart(2, "0");
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const y = String(dateObj.getFullYear()).slice(-2);
  return `${d}/${m}/${y}`;
};

export const dayHasLog = (dailyLog, dmy) => {
  const day = dailyLog[dmy];
  return !!day && !!day.items && Object.keys(day.items).length > 0;
};

export const calcCurrentStreak = (dailyLog, today = todayString()) => {
  let streak = 0;
  let cursor = today;
  while (dayHasLog(dailyLog, cursor)) {
    streak += 1;
    cursor = shiftDmy(cursor, -1);
  }
  return streak;
};
