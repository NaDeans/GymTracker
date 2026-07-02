export function createThemedStyles(light, dark, isDarkMode) {
  return isDarkMode ? dark : light;
}

export function getThemedValue(lightValue, darkValue, isDarkMode) {
  return isDarkMode ? darkValue : lightValue;
}
