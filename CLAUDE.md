# CLAUDE.md

No test suite or linter is configured.

## Environment Setup

A `.env` file is required at the project root:

```
ANTHROPIC_API_KEY=your_key_here
```

This is loaded via `react-native-dotenv` and imported as `import { ANTHROPIC_API_KEY } from '@env'`.

## Architecture

Persistence is `AsyncStorage` only — there is no backend or database.

`App.js` runs `purgeRemovedFeatureData()` (`src/shared/utils/legacyCleanup.js`) on mount, which clears the `REP_COUNTER_DATA` / `DAY_NOTES` keys left on devices by the removed rep-counter feature.

`ThemeProvider` (`src/shared/context/ThemeContext.js`) supplies the app's single light color palette via `useTheme()` — there is no dark theme.

### Macro Tracker

Food lookup flow: user types → check `gptCache` → if miss, call the Claude API (`claude-haiku-4-5`, structured outputs, via raw `fetch` — the `@anthropic-ai/sdk` package is deliberately NOT used because it imports `node:fs`, which Metro cannot bundle for native) from `services/gptService.js` → normalize via `utils/gptUtils.js` → store in cache and add to `historyByDate`. (File/state names keep the legacy "gpt" prefix.) There is also a scan-label flow: photo → `utils/imageUtils.js` (resize/compress via expo-image-manipulator) → `fetchNutritionFromImage`.

`dailyLog` and `historyByDate` serve different purposes: `dailyLog` tracks item counts and running totals for display; `historyByDate` preserves the original GPT entries (used by `DailyControls` to render each meal entry with +/- controls).

`lookupFood(query)` in the hook resolves a search to nutrition items (cache, else API) without logging anything; `submit` wraps it with the logging, alerts and dedupe. The meal-prep builder uses `lookupFood` directly so it never writes to `historyByDate`.

### Meal Preps

A bulk cook saved as a reusable recipe: `recipes` (`RECIPES` key) holds `{ id, name, servings, ingredients }` with the ingredients at FULL batch amounts. Macros are divided by `servings` rather than tracked by weight, so the per-serving gram figure is a raw-ingredient sum — label it "raw", never "serving weight" (`utils/recipeUtils.js`).

Logging a serving writes ONE synthetic item (`buildRecipeLogItem`) whose `raw` is the per-serving macros and which carries an immutable `recipe` snapshot, so `calcTotals`/`updateGrams`/`clearItem`/export all work unchanged, fractional servings fall out of `amount_g / raw.amount_g`, and editing a recipe never rewrites already-logged days. `DailyControls` renders these via `RecipeLogItem` (branching on `item.recipe`) instead of `DailyLogItem`.

### Module Aliases

`jsconfig.json` sets `baseUrl: "src"`, so all imports resolve from `src/` (e.g. `import { useTheme } from "shared/hooks/useTheme"`).

### Date Formats

- `DD/MM/YY` — display format and primary key for macro tracker state (`todayString()`, `selectedDate`)
- `YYYY-MM-DD` — ISO format required by the calendar library; convert with `dmyToIso` / `isoToDmy` from `src/shared/utils/dateUtils.js`

### Styling

Components get colors via `useTheme()` and per-feature `createThemedStyles(colors)` factories (e.g. `src/features/macroTracker/macroTrackerStyles.js`) — never import `COLORS` from `src/shared/constants/colors.js` directly in new UI. Layout tokens (`SPACING`, `FONT_SIZE`, `FONT_WEIGHT`, `BORDER_RADIUS`, `SHADOW`, `CONTROL_HEIGHT`) live in `src/shared/constants/styles.js`.
