import { todayString, shiftDmy } from "shared/utils/dateUtils";

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
