import { StyleSheet } from "react-native";
import { COLORS } from "shared/constants/colors";
import { SPACING, FONT_SIZE, FONT_WEIGHT } from "shared/constants/styles";

export const createThemedStyles = (colors) => StyleSheet.create({
  /* ================= LIST SCREEN ================= */
  screen: { flex: 1, backgroundColor: colors.surfaceBase },
  listContent: { flexGrow: 1, paddingTop: SPACING.xxxl, paddingHorizontal: SPACING.xl, paddingBottom: SPACING.screenBottom },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: SPACING.lg },
  mainTitle: { fontSize: FONT_SIZE.title, fontWeight: FONT_WEIGHT.bold, color: colors.textPrimary },
  searchField: { marginBottom: SPACING.lg },

  /* ================= RECIPE CARD ================= */
  card: { marginBottom: SPACING.md },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  cardTitle: { flex: 1, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold, color: colors.textDark },
  cardPreview: { fontSize: FONT_SIZE.sm, color: colors.textLight, lineHeight: 20, marginTop: SPACING.xs },
  cardMeta: { fontSize: FONT_SIZE.xs, color: colors.textMuted, marginTop: SPACING.sm },

  /* ================= EMPTY STATE ================= */
  empty: { alignItems: "center", paddingTop: SPACING.xxxl },
  emptyTitle: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.semibold, color: colors.textDark, marginTop: SPACING.lg, marginBottom: SPACING.xs },
  emptyText: { fontSize: FONT_SIZE.sm, color: colors.textMuted, textAlign: "center", lineHeight: 20, marginBottom: SPACING.xl },

  /* ================= EDITOR ================= */
  editorRoot: { flex: 1, backgroundColor: colors.surfaceBase, paddingTop: SPACING.xxxl },
  editorHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SPACING.md, paddingBottom: SPACING.xs },
  editorHint: { fontSize: FONT_SIZE.xs, color: colors.textMuted },
  editorHeaderSpacer: { width: 40 },
  editorTitleInput: { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold, color: colors.textPrimary, paddingHorizontal: SPACING.xl, paddingTop: SPACING.sm, paddingBottom: SPACING.md },
  editorDivider: { height: 1, backgroundColor: colors.border, marginHorizontal: SPACING.xl },
  editorBodyInput: { flex: 1, fontSize: FONT_SIZE.md, lineHeight: 24, color: colors.textMedium, paddingHorizontal: SPACING.xl, paddingTop: SPACING.md, paddingBottom: SPACING.xl },
});

export const styles = createThemedStyles(COLORS);
