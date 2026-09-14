import { todayString, shiftDmy } from "shared/utils/dateUtils";

export const dayHasLog = (dailyLog, dmy) => {
  const day = dailyLog[dmy];
  return !!day && !!day.items && Object.keys(day.items).length > 0;
};

// Counts back from today, or from yesterday if today hasn't been logged yet —
// otherwise a run of 30 days reads as 0 every morning until the first meal.
export const calcCurrentStreak = (dailyLog, today = todayString()) => {
  let cursor = dayHasLog(dailyLog, today) ? today : shiftDmy(today, -1);
  let streak = 0;
  while (dayHasLog(dailyLog, cursor)) {
    streak += 1;
    cursor = shiftDmy(cursor, -1);
  }
  return streak;
};
