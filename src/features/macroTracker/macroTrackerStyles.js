import { StyleSheet } from "react-native";
import { COLORS } from "shared/constants/colors";
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from "shared/constants/styles";

const hexToRgba = (hex, alpha) => {
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const createThemedStyles = (colors) => StyleSheet.create({
  /* ================= MAIN SCREEN ================= */
  container: { flexGrow: 1, paddingTop: SPACING.xxxl, paddingHorizontal: SPACING.xl, paddingBottom: SPACING.screenBottom, backgroundColor: colors.background },
  mainTitle: { fontSize: FONT_SIZE.title, fontWeight: FONT_WEIGHT.bold, marginBottom: SPACING.lg, color: colors.textPrimary },
  badgeRow: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.lg },

  /* ================= DATE NAVIGATION ================= */
  dateCard: { marginBottom: SPACING.xl, borderRadius: BORDER_RADIUS.pill, overflow: "hidden", backgroundColor: colors.surfaceRaised },
  dateRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md },
  dateTextTouchable: { flex: 1, alignItems: "center" },
  dateText: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold, color: colors.textDark },
  dateTextToday: { color: colors.success },

  /* ================= TOTALS / MACROS ================= */
  totalsContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.lg },
  totalsColumn: { justifyContent: "space-between", flex: 1, marginRight: SPACING.lg },
  macroBox: { marginBottom: SPACING.xs },
  macroRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.xs },
  macroLabel: { fontWeight: FONT_WEIGHT.medium, fontSize: FONT_SIZE.sm, color: colors.textMedium },
  macroValue: { fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.sm, color: colors.textDark },
  macroProgressTrack: { height: 5, borderRadius: BORDER_RADIUS.pill, backgroundColor: colors.border, overflow: "hidden", position: "relative" },
  macroProgressFill: { height: "100%", borderRadius: BORDER_RADIUS.pill },
  macroSafeZone: { height: "100%", position: "absolute", backgroundColor: hexToRgba(colors.success, 0.2), borderRadius: BORDER_RADIUS.pill },
  wheelContainer: { justifyContent: "center", alignItems: "center", width: 160, height: 160 },
  wheelCenterOverlay: { position: "absolute", justifyContent: "center", alignItems: "center" },
  wheelCenterValue: { fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.lg, color: colors.textPrimary },
  wheelCenterLabel: { fontSize: FONT_SIZE.xs, color: colors.textMuted, marginTop: 2 },

  /* ================= SEARCH ================= */
  inputContainer: { width: "100%", marginBottom: SPACING.sm },
  searchButtonRow: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.sm },
  suggestionsContainer: { marginBottom: SPACING.sm, backgroundColor: colors.surface1, borderRadius: BORDER_RADIUS.md },
  suggestionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: SPACING.md, backgroundColor: colors.surface1 },
  suggestionDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  suggestionTouchable: { flex: 1 },
  suggestionText: { fontSize: FONT_SIZE.sm, color: colors.textDark },
  manualTag: { backgroundColor: colors.primarySurface, borderRadius: BORDER_RADIUS.pill, paddingHorizontal: SPACING.sm, paddingVertical: 2, marginRight: SPACING.xs },
  manualTagText: { fontSize: FONT_SIZE.xs, color: colors.primary, fontWeight: FONT_WEIGHT.semibold },
  scanTag: { backgroundColor: colors.successSurface, borderRadius: BORDER_RADIUS.pill, paddingHorizontal: SPACING.sm, paddingVertical: 2, marginRight: SPACING.xs },
  scanTagText: { fontSize: FONT_SIZE.xs, color: colors.success, fontWeight: FONT_WEIGHT.semibold },
  customFoodTag: { backgroundColor: colors.neutralSurface, borderRadius: BORDER_RADIUS.pill, paddingHorizontal: SPACING.sm, paddingVertical: 2 },
  customFoodTagText: { fontSize: FONT_SIZE.xs, color: colors.neutralDark, fontWeight: FONT_WEIGHT.semibold },

  /* ================= HISTORY / DAILY LOG ================= */
  historyBlock: {},
  itemBlock: {},
  itemHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemName: { fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.lg, marginBottom: SPACING.xs, color: colors.textDark },
  gramsRow: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.xs },
  macros: { fontSize: FONT_SIZE.sm, color: colors.textMedium, marginBottom: SPACING.xs },
  addedText: { marginTop: SPACING.xs, fontSize: FONT_SIZE.xs, color: colors.success },
  assumption: { fontStyle: "italic", fontSize: FONT_SIZE.xs, color: colors.textMuted },

  /* ================= MEALS ================= */
  mealGroupHeader: { flexDirection: "row", alignItems: "center", gap: SPACING.xs, marginTop: SPACING.sm, paddingHorizontal: SPACING.xs },
  mealGroupTitle: { flex: 1, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, color: colors.primary },
  selectionHint: { fontSize: FONT_SIZE.xs, color: colors.textMuted, textAlign: "center", marginBottom: SPACING.xs },
  itemBlockSelected: { borderWidth: 2, borderColor: colors.primary },
  mealCardHeader: { flexDirection: "row", alignItems: "center", gap: SPACING.xs, marginBottom: SPACING.xs },
  mealCardTitle: { flex: 1, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold, color: colors.textDark },
  mealCardMacros: { fontSize: FONT_SIZE.sm, color: colors.textMedium },
  mealCardFoods: { fontSize: FONT_SIZE.xs, color: colors.textMuted, marginTop: 2 },
  mealsEmptyText: { fontSize: FONT_SIZE.sm, color: colors.textMuted, textAlign: "center", marginVertical: SPACING.lg },
  mealEditorTotals: { fontSize: FONT_SIZE.sm, color: colors.textMedium, marginBottom: SPACING.md },
  mealEditorItemTitle: { flex: 1, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, color: colors.textDark },

  /* ================= BUTTON ROW ================= */
  buttonRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: SPACING.xs, gap: SPACING.xs },
  leftButtons: { flexDirection: "row", gap: SPACING.xs },
  logActionButton: { minWidth: 84 },

  /* ================= SUPPLEMENTS ================= */
  supplementsCard: { marginTop: SPACING.lg },
  supplementsHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  supplementsTitle: { fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.lg, color: colors.textDark },
  supplementsCount: { fontSize: FONT_SIZE.xs, color: colors.textMuted, marginTop: 2 },
  supplementRow: { flexDirection: "row", alignItems: "center", paddingVertical: SPACING.sm, gap: SPACING.md },
  supplementRowDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  supplementName: { flex: 1, fontSize: FONT_SIZE.md, color: colors.textDark },
  supplementNameTaken: { color: colors.textMuted, textDecorationLine: "line-through" },
  supplementsEmpty: { fontSize: FONT_SIZE.sm, color: colors.textMuted, marginTop: SPACING.sm, marginBottom: SPACING.md },
  supplementEditRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, marginBottom: SPACING.sm },
  supplementAddRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },

  /* ================= FOOD DATABASE ================= */
  sectionTitle: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold, marginTop: SPACING.lg, marginBottom: SPACING.sm, color: colors.textPrimary },
  foodActionsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  foodActionsLeft: { flexDirection: "row", gap: SPACING.sm },
});

export const styles = createThemedStyles(COLORS);
