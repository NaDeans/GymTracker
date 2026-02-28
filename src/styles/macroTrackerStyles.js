// macroTrackerStyles.js
import { StyleSheet } from "react-native";
import { COLORS } from "constants/colors";
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOW } from "../constants/styles";

export const styles = StyleSheet.create({
  /* ================== UNIVERSAL ================= */
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlayDark, justifyContent: "center", alignItems: "center", padding: SPACING.md },
  modalContainer: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md, padding: SPACING.xl, maxHeight: "80%", width: "100%", marginHorizontal: SPACING.xl, ...SHADOW.md },
  buttonText: { color: COLORS.textWhite, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.sm, letterSpacing: 0.5 },
  input: { color: COLORS.textPrimary, backgroundColor: COLORS.inputBackground, borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.md, height: 40, marginBottom: SPACING.sm, width: "100%" },
  modalTitle: { fontWeight: FONT_WEIGHT.bold, marginBottom: SPACING.sm, fontSize: FONT_SIZE.lg },

  /* ================= MAIN SCREEN ================= */
  container: { flexGrow: 1, paddingTop: SPACING.xxxl, paddingHorizontal: SPACING.xl, paddingBottom: SPACING.screenBottom, backgroundColor: COLORS.background },
  mainTitle: { fontSize: FONT_SIZE.title, fontWeight: FONT_WEIGHT.bold },

  /* ================= DATE NAVIGATION ================= */
  dateRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: SPACING.sm },
  dateText: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold },
  dateTextToday: { color: COLORS.greenDark, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold },
  navButton: { backgroundColor: COLORS.blue, borderRadius: BORDER_RADIUS.sm, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg, alignItems: "center", justifyContent: "center" },
  navButtonPressed: { backgroundColor: COLORS.blueLight },
  todayButton: { backgroundColor: COLORS.green, borderRadius: BORDER_RADIUS.sm, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg, alignItems: "center", justifyContent: "center", minWidth: 60, marginHorizontal: SPACING.xs },
  todayButtonPressed: { backgroundColor: COLORS.greenLight },

  /* ================= TOTALS / MACROS ================= */
  totalsContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.xl },
  totalsColumn: { justifyContent: "space-between" },
  macroBox: { padding: SPACING.sm, backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.sm, marginBottom: SPACING.sm, ...SHADOW.sm },
  macroText: { fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.md },
  wheelContainer: { justifyContent: "center", alignItems: "center", width: 160, height: 160 },
  percOverlay: { position: "absolute", justifyContent: "center", alignItems: "center" },
  percText: { fontWeight: FONT_WEIGHT.bold, marginVertical: SPACING.xs, color: COLORS.textPrimary },
  proteinColor: { color: COLORS.protein },
  carbsColor: { color: COLORS.carbs },
  fatsColor: { color: COLORS.fats },

  /* ================= SEARCH ================= */
  inputContainer: { width: "100%", marginBottom: SPACING.sm },
  suggestionsContainer: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.sm, overflow: "hidden", position: "relative", zIndex: 10, ...SHADOW.md },
  suggestionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: SPACING.sm, backgroundColor: COLORS.white, marginBottom: SPACING.xs, borderRadius: BORDER_RADIUS.sm },
  suggestionEditButton: { marginLeft: SPACING.sm, paddingVertical: SPACING.xs, paddingHorizontal: SPACING.sm, backgroundColor: COLORS.border, borderRadius: BORDER_RADIUS.sm },

  /* ================= HISTORY ================= */
  historyBlock: { backgroundColor: COLORS.cardLight, padding: SPACING.sm, marginBottom: SPACING.sm, borderRadius: BORDER_RADIUS.sm, ...SHADOW.sm },
  itemBlock: { padding: SPACING.sm, backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.sm, marginBottom: SPACING.xs, marginTop: SPACING.xs, ...SHADOW.sm },
  itemName: { fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.lg, marginBottom: SPACING.sm },
  gramsRow: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.sm },
  gramsInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.sm, padding: SPACING.xs, width: 60, marginRight: SPACING.sm },
  macros: { fontSize: FONT_SIZE.sm, color: COLORS.textMedium, marginBottom: SPACING.sm },
  addedText: { marginTop: SPACING.xs, fontSize: FONT_SIZE.xs, color: COLORS.green},
  assumption: { fontStyle: "italic", fontSize: FONT_SIZE.xs, color: COLORS.textMuted },

  /* ================= BUTTON ROW ================= */
  buttonRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: SPACING.sm },
  leftButtons: { flexDirection: "row", gap: SPACING.xs },
  addButton: { backgroundColor: COLORS.green, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: BORDER_RADIUS.sm },
  addButtonPressed: { backgroundColor: COLORS.greenDark },
  removeButton: { backgroundColor: COLORS.red, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: BORDER_RADIUS.sm },
  removeButtonPressed: { backgroundColor: COLORS.redDark },
  clearButton: { backgroundColor: COLORS.blue, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: BORDER_RADIUS.sm },
  clearButtonPressed: { backgroundColor: COLORS.blueDark },

  /* ================= SUBMIT / CUSTOM / RESET ================= */
  submitButton: { backgroundColor: COLORS.blue, borderRadius: BORDER_RADIUS.sm, paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl, alignItems: "center", marginBottom: SPACING.sm },
  submitButtonPressed: { backgroundColor: COLORS.blueLight },
  customButton: { backgroundColor: COLORS.green, borderRadius: BORDER_RADIUS.sm, paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl, alignItems: "center", marginBottom: SPACING.xl },
  customButtonPressed: { backgroundColor: COLORS.greenLight },
  resetButton: { backgroundColor: COLORS.red, paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl, borderRadius: BORDER_RADIUS.sm, alignItems: "center", marginTop: SPACING.xl, marginBottom: SPACING.xxxl },
  resetButtonPressed: { backgroundColor: COLORS.redDark },

  /* ================= FOOD DATABASE ================= */
  foodCard: { borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.sm, padding: SPACING.sm, marginBottom: SPACING.lg, backgroundColor: COLORS.card, ...SHADOW.sm },
  foodName: { fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.md, marginBottom: SPACING.sm },
  foodMacros: { fontSize: FONT_SIZE.sm, color: COLORS.textLight, marginBottom: SPACING.sm },
  foodActionsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  foodActionsLeft: { flexDirection: "row", gap: SPACING.sm },
  customAdd: { backgroundColor: COLORS.green, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: BORDER_RADIUS.sm },
  customAddPressed: { backgroundColor: COLORS.blueVeryLight },
  customEdit: { backgroundColor: COLORS.blue, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: BORDER_RADIUS.sm },
  customEditPressed: { backgroundColor: COLORS.blueVeryLight },
  customDelete: { backgroundColor: COLORS.red, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: BORDER_RADIUS.sm },
  customDeletePressed: { backgroundColor: COLORS.redLight },

  /* ================= EDIT MODAL ================= */
  searchTermLabel: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium, marginBottom: SPACING.xs },
  editItemCard: { backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.sm, marginBottom: SPACING.md, padding: SPACING.md, ...SHADOW.md },
  editItemNumber: { fontWeight: FONT_WEIGHT.semibold, marginBottom: SPACING.xs },
  editButtonsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: SPACING.sm, gap: SPACING.sm },
  editModalSave: { flex: 1, padding: SPACING.md, borderRadius: BORDER_RADIUS.sm, backgroundColor: COLORS.blue, alignItems: "center" },
  editModalSavePressed: { backgroundColor: COLORS.blueVeryLight },
  editModalDelete: { flex: 1, padding: SPACING.md, borderRadius: BORDER_RADIUS.sm, backgroundColor: COLORS.red, alignItems: "center" },
  editModalDeletePressed: { backgroundColor: COLORS.redLight },
});