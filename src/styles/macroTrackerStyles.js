// macroTrackerStyles.js
import { StyleSheet } from "react-native";
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOW } from "../constants/styles";

export const macroStyles = StyleSheet.create({

  /* ================== UNIVERSAL ================= */
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", alignItems: "center", padding: 12 },
  modalContainer: { backgroundColor: "#fff", borderRadius: 12, padding: 20, maxHeight: "80%", width: "100%", marginHorizontal: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 14, letterSpacing: 0.5 },
  input: { color: "#000", backgroundColor: "#fff", borderWidth: 1, borderColor: "#ccc", borderRadius: 10, paddingHorizontal: 12, height: 40, marginBottom: 10, width: "100%" },
  modalTitle: { fontWeight: "700", marginBottom: 8, fontSize: 17 },

  /* ================= MAIN SCREEN ================= */
  container: { flexGrow: 1, paddingTop: 40, paddingHorizontal: 20, paddingBottom: 60, backgroundColor: "#fdfdfd" },
  mainTitle: { fontSize: 26, fontWeight: "700" },

  /* ================= DATE NAVIGATION / CALANDAR MODEL ================= */
  dateRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 10 },
  dateText: { fontSize: 16, fontWeight: "600" },
  dateTextToday: { color: "#27ae60", fontSize: 16, fontWeight: "600" },
  navButton: { backgroundColor: "#3490dc", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" },
  navButtonPressed: { backgroundColor: "#3490dc88" },
  todayButton: { backgroundColor: "#2ecc71", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, alignItems: "center", justifyContent: "center", minWidth: 60, marginHorizontal: 4 },
  todayButtonPressed: { backgroundColor: "#27ae6088" },

  /* ================= TOTALS / MACROS ================= */
  totalsContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  totalsColumn: { justifyContent: "space-between" },
  macroBox: { padding: 6, backgroundColor: "#f7f7f7", borderRadius: 8, marginBottom: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 2 },
  macroText: { fontWeight: "700", fontSize: 16 },
  wheelContainer: { justifyContent: "center", alignItems: "center", width: 160, height: 160 },
  percOverlay: { position: "absolute", justifyContent: "center", alignItems: "center" },
  percText: { fontWeight: "700", marginVertical: 2, color: "#000" },
  proteinColor: { color: "#eb5a5a" },
  carbsColor: { color: "#f4d03f" },
  fatsColor: { color: "#5dade2" },

  /* ================= SEARCH / SUGGESTIONS ================= */
  inputContainer: { width: "100%", marginBottom: 10 },
  suggestionsContainer: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#ddd", borderRadius: 8, overflow: "hidden", position: "relative", zIndex: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  suggestionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 10, backgroundColor: "#fff", marginBottom: 2, borderRadius: 8 },
  suggestionEditButton: { marginLeft: 10, paddingVertical: 5, paddingHorizontal: 10, backgroundColor: "#ddd", borderRadius: 6 },

  /* ================= HISTORY / FOOD LOG ================= */
  historyBlock: { backgroundColor: "#f0f0f0", padding: 6, marginBottom: 10, borderRadius: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 },
  itemBlock: { padding: 6, backgroundColor: "#f9f9f9", borderRadius: 10, marginBottom: 4, marginTop: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 },
  itemName: { fontWeight: "700", fontSize: 17, marginBottom: 6 },
  gramsRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  gramsInput: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 6, width: 60, marginRight: 6 },
  macros: { fontSize: 14, color: "#333", marginBottom: 6 },
  addedText: { marginTop: 4, fontSize: 13, color: "#27ae6088" },
  assumption: { fontStyle: "italic", fontSize: 12, color: "#777" },

  /* ================= BUTTON ROW FOR HISTORY ITEMS ================= */
  buttonRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 6 },
  leftButtons: { flexDirection: "row", gap: 6 },
  addButton: { backgroundColor: "#2ecc71", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  addButtonPressed: { backgroundColor: "#27ae60" },
  removeButton: { backgroundColor: "#eb5a5a", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  removeButtonPressed: { backgroundColor: "#c0392b" },
  clearButton: { backgroundColor: "#3490dc", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  clearButtonPressed: { backgroundColor: "#2980b9" },

  /* ================= SUBMIT / CUSTOM / RESET ================= */
  submitButton: { backgroundColor: "#3490dc", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20, alignItems: "center", marginBottom: 10 },
  submitButtonPressed: { backgroundColor: "#3490dc88" },
  customButton: { backgroundColor: "#2ecc71", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20, alignItems: "center", marginBottom: 20 },
  customButtonPressed: { backgroundColor: "#2ecc7188" },
  resetButton: { backgroundColor: "#eb5a5a", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, alignItems: "center", marginTop: 20, marginBottom: 40 },
  resetButtonPressed: { backgroundColor: "#c0392b" },

  /* ================= MACRO GOAL MODAL ================= */   
  saveGoalButton: { backgroundColor: "#3490dc", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, alignItems: "center" },
  saveGoalButtonPressed: { backgroundColor: "#3490dc88" },

  /* ================= FOOD DATABASE ================= */
  foodCard: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 8, marginBottom: 14, backgroundColor: "#f9f9f9", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 2 },
  foodName: { fontWeight: "600", fontSize: 16, marginBottom: 8 },
  foodMacros: { fontSize: 14, color: "#555", marginBottom: 6 },
  foodActionsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  foodActionsLeft: { flexDirection: "row", gap: 8 },
  customAdd: { backgroundColor: "#2ecc71", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  customAddPressed: { backgroundColor: "#e6f0ff" },
  customEdit: { backgroundColor: "#3490dc", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  customEditPressed: { backgroundColor: "#e6f0ff" },
  customDelete: { backgroundColor: "#eb5a5a", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  customDeletePressed: { backgroundColor: "#e6f0ff" },

  /* ================= EDIT MODAL ================= */
  searchTermLabel: { fontSize: 15, fontWeight: "500", marginBottom: 4 },
  editItemCard: { backgroundColor: "#f9f9f9", borderRadius: 10, marginBottom: 12, padding: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  editItemNumber: { fontWeight: "600", marginBottom: 4 },
  editButtonsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10, gap: 10 },
  editModalSave: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: "#3783ff", alignItems: "center" },
  editModalSavePressed: { backgroundColor: "#e6f0ff" },
  editModalDelete: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: "#ff2b2b", alignItems: "center" },
  editModalDeletePressed: { backgroundColor: "#ffdddd" },
});