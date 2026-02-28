// macroTrackerStyles.js
import { StyleSheet } from "react-native";
import { COLORS } from "constants/colors";
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOW } from "../constants/styles";

export const styles = StyleSheet.create({

  //==================== UNIVERSAL LAYOUT ====================//
  container: { flexGrow: 1, paddingTop: SPACING.xxxl, paddingHorizontal: SPACING.xl, paddingBottom: SPACING.screenBottom, backgroundColor: COLORS.background },
  pageTitle: { fontSize: FONT_SIZE.title, fontWeight: FONT_WEIGHT.bold, paddingBottom: SPACING.lg },
  buttonText: { color: COLORS.textWhite, fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.md },

  //==================== NAVIGATION BUTTONS ====================//
  backButton: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg, borderRadius: BORDER_RADIUS.lg, backgroundColor: COLORS.blue, alignItems: "center", marginBottom: SPACING.md, alignSelf: "flex-start" },

  //==================== CARD COMPONENTS ====================//
  card: { padding: SPACING.lg, borderRadius: BORDER_RADIUS.lg, backgroundColor: COLORS.card, marginBottom: SPACING.md, ...SHADOW.sm },
  cardText: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.medium },

  //==================== ADD BUTTONS ====================//
  addButton: { marginTop: SPACING.xs, marginBottom: SPACING.md },
  addText: { fontSize: FONT_SIZE.md, color: COLORS.blue, fontWeight: FONT_WEIGHT.semibold },

  //==================== MODALS (ADD GROUP / EXERCISE) ====================//
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlayLight, justifyContent: "center", alignItems: "center" },
  modal: { backgroundColor: COLORS.white, padding: SPACING.lg, borderRadius: BORDER_RADIUS.lg, width: "80%", ...SHADOW.md },
  input: { borderWidth: 1, borderColor: COLORS.border, padding: SPACING.sm, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.md, fontSize: FONT_SIZE.sm },
  saveAdditionButton: { marginTop: SPACING.md, padding: SPACING.lg, borderRadius: BORDER_RADIUS.lg, backgroundColor: COLORS.blue, alignItems: "center" },

  //==================== LOG / HISTORY MODAL ====================//
  historyDayCard: { marginTop: SPACING.md, padding: SPACING.lg, borderRadius: BORDER_RADIUS.lg, backgroundColor: COLORS.card, ...SHADOW.sm },
  historyDateText: { fontWeight: FONT_WEIGHT.semibold, marginBottom: SPACING.xs },
  historyText: { fontSize: FONT_SIZE.xs, color: COLORS.textLight },
  notesInput: { color: COLORS.blue, fontSize: FONT_SIZE.md, marginVertical: SPACING.xs },

  //==================== CATEGORY SCREEN ====================//
  viewLogButton: { marginBottom: SPACING.xl, padding: SPACING.sm, borderRadius: BORDER_RADIUS.lg, backgroundColor: COLORS.card, alignItems: "center", ...SHADOW.sm },
  viewLogText: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold, color: COLORS.blue },

  //==================== EDITABLE TITLES ====================//
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: SPACING.lg },
  titleInput: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, flex: 1, paddingVertical: SPACING.xs, paddingHorizontal: SPACING.sm, backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md, color: COLORS.textDark },
  deleteTitleButton: { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.lg, borderRadius: BORDER_RADIUS.lg, backgroundColor: COLORS.red, alignItems: "center", marginLeft: SPACING.sm },
  cancelTitleButton: { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.lg, borderRadius: BORDER_RADIUS.lg, backgroundColor: COLORS.red, alignItems: "center", marginLeft: SPACING.sm },
  saveTitleButton: { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.lg, borderRadius: BORDER_RADIUS.lg, backgroundColor: COLORS.blue, alignItems: "center", marginLeft: SPACING.sm },

  //==================== EXERCISE SCREEN ====================//
  exercisePreviewText: { fontSize: FONT_SIZE.lg, color: COLORS.textDark },
  historySubtitle: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.semibold, marginTop: SPACING.lg },

  //==================== SET ROW COMPONENT ====================//
  setRow: { flexDirection: "row", alignItems: "center", gap: SPACING.xs, marginBottom: SPACING.md },
  setLabel: { fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.md },
  setInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.sm, padding: 2, fontSize: FONT_SIZE.md, minWidth: 50, textAlign: "center", backgroundColor: COLORS.white },
  setText: { fontSize: FONT_SIZE.lg, color: COLORS.textDark },
  deleteSetBtn: { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.sm, borderRadius: BORDER_RADIUS.sm, backgroundColor: COLORS.red, alignItems: "center", justifyContent: "center", marginLeft: "auto" },

  //==================== EXERCISE INPUT SECTION ====================//
  inputRow: { flexDirection: "row", justifyContent: "space-between" },
  inputCard: { width: "48%", padding: SPACING.lg, borderRadius: BORDER_RADIUS.lg, backgroundColor: COLORS.card, ...SHADOW.sm },
  inputLabel: { fontSize: FONT_SIZE.sm, marginBottom: SPACING.xs, fontWeight: FONT_WEIGHT.medium },
  bigInput: { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold, textAlign: "left", color: COLORS.textDark },
});