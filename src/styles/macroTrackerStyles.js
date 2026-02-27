// macroTrackerStyles.js
import { StyleSheet } from "react-native";
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from "../constants/styles";

export const styles = StyleSheet.create({
  container: { paddingTop: SPACING.lg, paddingHorizontal: SPACING.md, paddingBottom: SPACING.xl, backgroundColor: COLORS.background },
  titleMain: { fontSize: FONT_SIZE.xxl, fontWeight: "700", color: COLORS.textPrimary, marginBottom: SPACING.md },
  rowDate: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.lg },
  buttonNav: { padding: SPACING.sm, borderRadius: BORDER_RADIUS.sm, backgroundColor: COLORS.grayButton, marginRight: SPACING.sm },
  buttonNavPressed: { backgroundColor: COLORS.grayButtonPressed },
  textButton: { color: COLORS.textPrimary, fontSize: FONT_SIZE.md },
  textDate: { fontSize: FONT_SIZE.md, fontWeight: "600", flex: 1, textAlign: "center", color: COLORS.textPrimary },
  textDateToday: { color: COLORS.blue },
  buttonToday: { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.sm, borderRadius: BORDER_RADIUS.sm, backgroundColor: COLORS.grayButton, marginLeft: SPACING.sm },
  buttonTodayPressed: { backgroundColor: COLORS.grayButtonPressed },
  containerTotals: { flexDirection: "row", justifyContent: "space-between", marginBottom: SPACING.lg },
  columnTotals: { flex: 1, justifyContent: "space-around" },
  boxMacro: { padding: SPACING.sm, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.surface, marginBottom: SPACING.sm },
  textMacro: { fontSize: FONT_SIZE.sm, fontWeight: "600", color: COLORS.textPrimary },
  containerWheel: { width: 150, height: 150, justifyContent: "center", alignItems: "center" },
  overlayPerc: { position: "absolute", alignItems: "center" },
  textPerc: { fontSize: FONT_SIZE.sm },
  colorProtein: { color: COLORS.red },
  colorCarbs: { color: COLORS.yellow },
  colorFats: { color: COLORS.blue },
});