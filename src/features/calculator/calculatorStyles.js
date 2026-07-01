import { StyleSheet } from "react-native";
import { COLORS } from "shared/constants/colors";
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from "shared/constants/styles";

export const styles = StyleSheet.create({
  /* ================= MAIN SCREEN ================= */
  container: { flexGrow: 1, paddingTop: SPACING.xxxl, paddingHorizontal: SPACING.xl, paddingBottom: SPACING.screenBottom, backgroundColor: COLORS.surfaceBase },
  mainTitle: { fontSize: FONT_SIZE.title, fontWeight: FONT_WEIGHT.bold, marginBottom: SPACING.lg },

  /* ================= CARDS ================= */
  card: { marginBottom: SPACING.lg },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, marginBottom: SPACING.md },
  cardIconBadge: { width: 32, height: 32, borderRadius: BORDER_RADIUS.pill, backgroundColor: COLORS.surface2, justifyContent: "center", alignItems: "center" },
  cardTitle: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold, color: COLORS.textDark },

  /* ================= CONVERTER ROW ================= */
  fieldRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  fieldFlex: { flex: 1 },
  swapIcon: { marginTop: SPACING.lg },

  /* ================= HEIGHT ================= */
  heightFtInRow: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.md },

  /* ================= 1RM ================= */
  ormResultBox: { marginTop: SPACING.md, alignItems: "center", backgroundColor: COLORS.primarySurface, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.md },
  ormResultLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginBottom: SPACING.xs },
  ormResultValue: { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold, color: COLORS.primaryDark },
  ormCaption: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: SPACING.sm, textAlign: "center" },
  ormCaptionWarn: { color: COLORS.dangerDark },
});
