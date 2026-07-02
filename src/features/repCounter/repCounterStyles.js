import { StyleSheet } from "react-native";
import { COLORS } from "shared/constants/colors";
import { SPACING, FONT_SIZE, FONT_WEIGHT } from "shared/constants/styles";

export const createThemedStyles = (colors) => StyleSheet.create({
  //==================== UNIVERSAL LAYOUT ====================//
  container: { flexGrow: 1, paddingTop: SPACING.xxxl, paddingHorizontal: SPACING.xl, paddingBottom: SPACING.screenBottom, backgroundColor: colors.background },
  pageTitle: { fontSize: FONT_SIZE.title, fontWeight: FONT_WEIGHT.bold, marginBottom: SPACING.lg, color: colors.textPrimary },
  backButtonSpacing: { marginBottom: SPACING.md, alignSelf: "flex-start" },

  //==================== CATEGORY / EXERCISE CARDS ====================//
  viewLogCard: { marginBottom: SPACING.xl },
  todayNotesCard: { marginBottom: SPACING.xl },
  todayNotesLabel: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, color: colors.textMuted, marginBottom: SPACING.sm },
  viewLogRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  viewLogText: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold, color: colors.primary },
  cardText: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.medium, color: colors.textDark },
  categoryCardSpacing: { marginBottom: SPACING.md },
  exercisePreviewText: { fontSize: FONT_SIZE.sm, color: colors.textLight, marginTop: SPACING.xs },

  //==================== SET LOGGER ====================//
  heroStepperRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-around", rowGap: SPACING.md, marginBottom: SPACING.lg },
  previousSessionText: { fontSize: FONT_SIZE.sm, color: colors.textLight, marginBottom: SPACING.md, textAlign: "center" },
  historySubtitle: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.semibold, marginTop: SPACING.xl, marginBottom: SPACING.md, color: colors.textPrimary },
  dayCardSpacing: { marginBottom: SPACING.md },
  historyDateText: { fontWeight: FONT_WEIGHT.semibold, marginBottom: SPACING.sm, color: colors.textDark },
  setRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: SPACING.sm },
  setRowFields: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  setText: { fontSize: FONT_SIZE.sm, color: colors.textMuted },

  //==================== FULL LOG ====================//
  historyText: { fontSize: FONT_SIZE.xs, color: colors.textLight },
  logEntryBlock: { marginBottom: SPACING.sm },
  logEntryHeader: { fontWeight: FONT_WEIGHT.semibold, color: colors.textDark },
});

export const styles = createThemedStyles(COLORS);
