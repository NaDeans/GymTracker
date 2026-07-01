import { StyleSheet } from "react-native";
import { COLORS } from "shared/constants/colors";
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from "shared/constants/styles";

export const styles = StyleSheet.create({
  /* ================= MAIN SCREEN ================= */
  container: { flexGrow: 1, paddingTop: SPACING.xxxl, paddingHorizontal: SPACING.xl, paddingBottom: SPACING.screenBottom, backgroundColor: COLORS.background },
  mainTitle: { fontSize: FONT_SIZE.title, fontWeight: FONT_WEIGHT.bold, marginBottom: SPACING.lg },
  badgeRow: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.lg },

  /* ================= DATE NAVIGATION ================= */
  dateCard: { marginBottom: SPACING.xl, borderRadius: BORDER_RADIUS.pill, overflow: "hidden" },
  dateRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md },
  dateTextTouchable: { flex: 1, alignItems: "center" },
  dateText: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold, color: COLORS.textDark },
  dateTextToday: { color: COLORS.success },

  /* ================= TOTALS / MACROS ================= */
  totalsContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.xl },
  totalsColumn: { justifyContent: "space-between", flex: 1, marginRight: SPACING.lg },
  macroBox: { marginBottom: SPACING.sm },
  macroText: { fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.sm, color: COLORS.textDark, marginBottom: SPACING.xs },
  macroProgressTrack: { height: 6, borderRadius: BORDER_RADIUS.pill, backgroundColor: COLORS.border, overflow: "hidden" },
  macroProgressFill: { height: "100%", borderRadius: BORDER_RADIUS.pill },
  wheelContainer: { justifyContent: "center", alignItems: "center", width: 160, height: 160 },
  percOverlay: { position: "absolute", justifyContent: "center", alignItems: "flex-start" },
  percText: { fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.sm, color: COLORS.textPrimary },
  legendRow: { flexDirection: "row", alignItems: "center", marginVertical: SPACING.xs, gap: SPACING.xs },
  legendDot: { width: 8, height: 8, borderRadius: 4 },

  /* ================= SEARCH ================= */
  inputContainer: { width: "100%", marginBottom: SPACING.sm },
  searchRow: { flexDirection: "row", alignItems: "flex-start", gap: SPACING.sm, marginBottom: SPACING.sm },
  suggestionsContainer: { marginBottom: SPACING.sm },
  suggestionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: SPACING.md },
  suggestionDivider: { borderTopWidth: 1, borderTopColor: COLORS.border },
  suggestionTouchable: { flex: 1 },
  suggestionText: { fontSize: FONT_SIZE.sm, color: COLORS.textDark },
  manualTag: { backgroundColor: COLORS.primarySurface, borderRadius: BORDER_RADIUS.pill, paddingHorizontal: SPACING.sm, paddingVertical: 2, marginRight: SPACING.xs },
  manualTagText: { fontSize: FONT_SIZE.xs, color: COLORS.primary, fontWeight: FONT_WEIGHT.semibold },
  scanTag: { backgroundColor: COLORS.successSurface, borderRadius: BORDER_RADIUS.pill, paddingHorizontal: SPACING.sm, paddingVertical: 2, marginRight: SPACING.xs },
  scanTagText: { fontSize: FONT_SIZE.xs, color: COLORS.success, fontWeight: FONT_WEIGHT.semibold },

  /* ================= HISTORY / DAILY LOG ================= */
  historyBlock: { marginBottom: SPACING.sm },
  itemBlock: { marginBottom: SPACING.sm },
  itemName: { fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.lg, marginBottom: SPACING.sm, color: COLORS.textDark },
  gramsRow: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.sm },
  macros: { fontSize: FONT_SIZE.sm, color: COLORS.textMedium, marginBottom: SPACING.sm },
  addedText: { marginTop: SPACING.xs, fontSize: FONT_SIZE.xs, color: COLORS.success },
  assumption: { fontStyle: "italic", fontSize: FONT_SIZE.xs, color: COLORS.textMuted },

  /* ================= BUTTON ROW ================= */
  buttonRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: SPACING.sm, gap: SPACING.sm },
  leftButtons: { flexDirection: "row", gap: SPACING.xs },

  /* ================= FOOD DATABASE ================= */
  sectionTitle: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  foodActionsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  foodActionsLeft: { flexDirection: "row", gap: SPACING.sm },
});
