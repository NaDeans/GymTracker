import React, { createContext } from 'react';
import { COLORS } from 'shared/constants/colors';

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  return <ThemeContext.Provider value={{ colors: COLORS }}>{children}</ThemeContext.Provider>;
}
