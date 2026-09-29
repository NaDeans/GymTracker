# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Start Expo dev server (scan QR with Expo Go)
npm run android    # Start on Android emulator/device
npm run ios        # Start on iOS simulator/device
npm run web        # Start in browser
```

No test suite or linter is configured.

## Environment Setup

A `.env` file is required at the project root:

```
ANTHROPIC_API_KEY=your_key_here
```

This is loaded via `react-native-dotenv` and imported as `import { ANTHROPIC_API_KEY } from '@env'`.

## Architecture

React Native / Expo app with four tab screens. All state is local React hooks; persistence is `AsyncStorage` only — there is no backend or database. Code is organized by feature under `src/features/`, with shared components/hooks/utils under `src/shared/`.

**Three things are named like recipes and are not the same thing.** Keep them straight:
- **Meals** (`MEALS`) — a named group of foods that logs as one block, built by ticking foods in the day's log.
- **Meal preps** (`MEAL_PREPS`) — a bulk cook whose macros divide by a serving count.
- **Recipes** (`RECIPES`) — free-form cooking notes on their own tab; nothing in them is parsed.

### Navigation

`App.js` → `src/navigation/AppNavigator.js` → React Navigation bottom tab with four screens:
- **Macros** → `src/features/macroTracker/MacroTrackerScreen.js`
- **Saved** → `src/features/macroTracker/SavedFoodsScreen.js`
- **Recipes** → `src/features/recipes/RecipesScreen.js`
- **Calculator** → `src/features/calculator/CalculatorScreen.js`

Route names double as tab labels and are kept short — four have to fit a 64px bar at `FONT_SIZE.xs`. `TAB_ICONS` must gain an entry for any new tab.

`App.js` awaits `purgeRemovedFeatureData()` (`src/shared/utils/legacyCleanup.js`) and `migrateMealPrepsOffRecipesKey()` (`src/shared/utils/migrations.js`) before rendering the navigator. The gate matters for the second one: a pre-release build stored meal preps under `RECIPES`, and `useRecipes` does no shape checking, so it would load them as blank notes and save note-shaped data back over them.

`AppNavigator` wraps everything in `ThemeProvider` (`src/shared/context/ThemeContext.js`), which supplies the app's single light color palette via `useTheme()`, and then in `MacroTrackerProvider`.

### Macro Tracker

`useMacroTracker` (`src/features/macroTracker/hooks/useMacroTracker.js`) owns all macro state. It is called **once**, by `MacroTrackerProvider` (`src/features/macroTracker/context/MacroTrackerContext.js`), above the navigator — two screens read it, and `saveMacroTrackerData` overwrites every key as one blob, so two hook instances would clobber each other last-writer-wins.

The provider exposes two contexts on purpose. The hook returns a fresh ~50-key object every render and holds high-churn state (`input`, `gramInputs`, `loading`), so one context would re-render every tab on each keystroke:
- `useMacroScreen()` — the raw hook, consumed only by `MacroTrackerScreen` (which re-renders per keystroke regardless).
- `useMacroData()` — a memoised low-churn slice for other screens. Its handlers are wrapped in a ref so they keep a stable identity without capturing a stale `selectedDate`.

Modal *visibility* is screen state, not app state: `useFoodEditor` (`hooks/useFoodEditor.js`) is held per screen so `EditCachedFoodModal` can't open on two tabs at once, while the food it edits still comes from the shared store.

Key state objects:

| State | AsyncStorage key | Description |
|---|---|---|
| `meals` | `MEALS` | `[{ id, name, items: [{ id, name, amount_g, calories, protein, carbs, fats, assumption }] }]` — saved groups of foods |
| `mealPreps` | `MEAL_PREPS` | `[{ id, name, servings, ingredients: [...], createdAt, updatedAt }]` — bulk cooks, ingredients at full batch amounts |
| `dailyLog` | `DAILY_LOG` | `{ [dateStr]: { items: { [id]: { item, count } }, totals } }` |
| `historyByDate` | `HISTORY_BY_DATE` | `{ [dateStr]: [{ foodId, key, items, mealId?, mealName? }] }` — GPT/manual/meal entries per day |
| `gptCache` | `GPT_CACHE` | `{ [searchKey]: { searchKey, foodId, items: [item], source?, aliases? } }` — saved foods, one food each |
| `goals` | `GOALS` | `{ calories, protein, carbs, fats }` targets |
| `supplements` | `SUPPLEMENTS` | `[{ id, name }]` — the user's editable supplement list |
| `supplementLog` | `SUPPLEMENT_LOG` | `{ [dateStr]: [supplementId] }` — which supplements were ticked that day |
| `dayStats` | `DAY_STATS` | `{ [dateStr]: { weight, checked: [checklistId] } }` — body weight in kg plus the ticked checklist items |
| `checklist` | `CHECKLIST` | `[{ id, name }]` — the user's editable daily checklist; defaults to Gym / Abs while the key is absent |

Food lookup flow: user types → check `gptCache` → if miss, call the Claude API (`claude-haiku-4-5`, structured outputs, via raw `fetch` — the `@anthropic-ai/sdk` package is deliberately NOT used because it imports `node:fs`, which Metro cannot bundle for native) from `services/gptService.js` → normalize via `utils/gptUtils.js` → store in cache and add to `historyByDate`. (File/state names keep the legacy "gpt" prefix.)

**One food per saved food.** A saved food holds exactly one item, and its key is that item's own name (`foodKey(item.name)` — see `utils/foodCacheUtils.js`), so there is no separate search term that can drift from the display name. A search naming several foods is split into one saved food per item; the model is asked to name each item so it stands alone, leading with the portion when the user stated one ("200g Chicken Breast"). The raw search string is recorded on every entry it produced (`aliases: { [term]: { i, n } }`) so retyping it resolves from the cache, and `resolveFromCache` also matches a comma/"and"-separated list of saved names. `migrateFoodData` rebuilds pre-split data on load and is idempotent. There is also a scan-label flow: photo → `utils/imageUtils.js` (resize/compress via expo-image-manipulator) → `fetchNutritionFromImage`.

Supplements are a separate tick-list: `SupplementsSection` renders one checkbox per supplement for the selected date, `NamedListModal` adds/renames/deletes them (the same modal edits the daily checklist). Only ids are logged per day — names resolve from `supplements` at display/export time, so a rename applies retroactively and deleting a supplement purges it from every logged day. Both exports include a `Supplements taken:` line (omitted entirely when no supplements are configured).

`dailyLog` and `historyByDate` serve different purposes: `dailyLog` tracks item counts and running totals for display; `historyByDate` preserves the original GPT entries (used by `DailyControls` to render each entry with +/- controls).

**Meals** (`MealsModal` / `MealEditorModal`, helpers in `utils/mealUtils.js`) replace the old custom-foods list — manual entry already covers one-off foods, and `loadMacroTrackerData` migrates any leftover `CUSTOM_FOODS` into one-item meals before deleting that key. A meal is built by ticking foods in the day's log ("Select foods to save as a meal", which snapshots their current grams × count) or from scratch in the editor, where every parameter of the meal and each of its foods is editable. Adding a meal writes one `historyByDate` entry carrying `mealId`/`mealName` — that name is what groups the foods into a block in the log and in exports. Item ids are minted fresh on each add, so logging the same meal twice yields two independent blocks.

**Daily stats** (`DayStatsSection`, the "Today" card) sit under the supplements
list: body weight in kg plus the user's **daily checklist**, per selected date. The
checklist is edited through the card's gear (`NamedListModal`) and works like
supplements — only ids are logged, a rename applies retroactively, deleting an
item purges it from every day. It starts as "Went to the gym" / "Hit abs" with ids
`gym` / `abs`, which are the old `DAY_STATS` flag names: `normalizeDayStat`
folds legacy `{ gym, abs }` booleans into `checked` on every load, idempotently.
`DAY_STATS` is kept sparse the same way `supplementLog` is — the date key is
deleted once weight is cleared and nothing is ticked — and `resetDay` drops it
alongside the others. The weight field commits on blur, not per keystroke, because
every write rewrites all ten storage keys. Yesterday's weight shows as the
placeholder and is never recorded on its own. Both exports carry a
`Weight: … | Went to the gym: yes | Hit abs: no | …` line (one entry per checklist
item), and the range export emits it in **both** branches, including the one for
days with no food logged — a rest day is exactly when "Went to the gym: no"
carries signal.

**Day completion** is one rule in `src/shared/utils/dayCompletion.js`, shared by
the in-app bar (`DayCompletionBar`, one thin line under the date picker) and the
reminder scheduler. Three segments: calorie + macro goals met, every supplement
ticked, every checklist item ticked. The supplements and checklist segments are
omitted when their list is empty, so the bar is 1–3 equal segments. Body weight
does not gate completion. The macros segment is the same ±10%-on-all-four test as
`isGoalMet` (the "Goal met" badge), inlined as `macroGoalsMet` — keep the two in
step so the badge and the bar never disagree.
That file is deliberately import-free: `scripts/completion-check.mjs` loads it
through a `data:` URL, as `format-name-check.mjs` does, and an aliased import
would break that loader. Run `node scripts/completion-check.mjs` after touching it.

**Reminders** (`src/shared/notifications/`) are local notifications on a fixed
schedule (`REMINDER_HOURS`, hourly 7am–9pm, rebuilt four days ahead on every
sync — the window is sized to stay under iOS's 64-pending-notification cap). Nothing runs
when a local notification fires, so the body text (`2/3 done · 1840/2400 kcal.`)
is computed at *schedule* time. Every app foreground and every change in today's
completion relays the whole window, which is what keeps that text current.
Completing the day fires one congratulation and then silence, guarded by a
`DD/MM/YY` in `REMINDER_STATE` so rollover resets it for free.

Two rules matter here. The scheduler is **read-only** against the macro keys and
uses `loadDayCompletionInputs`, never `loadMacroTrackerData` — that one runs
`migrateCustomFoodsToMeals`, which writes to `MEALS`, and `saveMacroTrackerData`
persists every key as one blob. And `expo-notifications` is resolved through a
defensive `require` in `notificationsModule.js`: Expo Go on Android dropped local
notifications in SDK 53, so an unguarded call breaks `npm start` entirely. It is
a native module with a config plugin, so **reminders need a new dev build**
(`eas build --profile development --platform android`); everything else works on
the existing one.

**Search suggestions** are ranked by `utils/searchUtils.js`, not by cache order.
Matches are bucketed into relevance tiers (exact → whole-string prefix → word
prefix → substring → all query words present in any order) and only foods in the
same tier compete; within a tier the food logged most often wins, then the
shorter name, then alphabetical. Usage counts are derived from `historyByDate`,
which already records the key each entry was logged under, so nothing extra is
persisted. Ranking runs on `foodKey(input)` — the corrected spelling — so a typo
still finds the saved food.

**Voice search** (`src/shared/hooks/useVoiceSearch.js`, `expo-speech-recognition`)
dictates into the search field. It is a native module with a config plugin, so it
only works in a development or production build, never in Expo Go.

**Meal preps** (`MealPrepModal`, helpers in `utils/mealPrepUtils.js`) are a bulk cook divided into servings. Macros divide by the serving count rather than being tracked by weight — cooking changes water, not calories — so the gram figure that falls out is a raw-ingredient sum and must be labelled "raw", never "serving weight".

A logged serving is a **single synthetic item** whose `raw` is the per-serving macros, which is what makes `amount_g / raw.amount_g` the serving count and lets `calcTotals`, `updateGrams`, `clearItem` and the exports carry fractional servings unchanged. Servings and count are independent axes: totals are `perServing × servings × count`, so two helpings of one serve and one helping of two serves weigh the same but read differently. The item carries an immutable snapshot, so editing a prep never rewrites days already logged.

Logged preps keep the legacy `recipe_` id prefix and a snapshot that may sit under either `item.mealPrep` or the older `item.recipe` — always read it through `mealPrepSnapshot(item)`. Those ids are keys into `dailyLog` and `historyByDate`, so renaming them would mean rewriting every day already logged.

### Recipes

Free-form recipe notes — deliberately unstructured, since the point is a place to write "microwave the oats 2:30, stir, 30s more". `useRecipes` (`src/features/recipes/hooks/useRecipes.js`) owns a single array stored at `RECIPES`:

```
[{ id, title, body, createdAt, updatedAt }]
```

`body` is one free-text blob; nothing in it is parsed. The list sorts by `updatedAt` descending and filters on a substring match over title + body. Tapping a card opens `RecipeEditor`, a full-screen modal with a title field and a full-height multiline input. There is no cancel: `closeEditor()` commits the draft on exit (a new recipe left entirely blank is discarded instead of saved), so text can't be lost by tapping the wrong control — deleting is the way to undo.

### Keyboard behaviour

Inputs **do not** scroll themselves into view on focus. There used to be a
`KeyboardScrollProvider` doing that, and it was removed: it called
`scrollResponderScrollNativeHandleToKeyboard` with `preventNegativeScrollOffset`,
so a field near the top of a page asking for a large offset (the search bar asked
for 220px to clear its suggestions dropdown) clamped to offset 0 and snapped the
whole page to the top. Screens rely on `KeyboardAvoidingView`, Android's
`adjustResize` and `automaticallyAdjustKeyboardInsets` instead. Don't reintroduce
a focus-scroll without solving the clamp.

### Module Aliases

`jsconfig.json` sets `baseUrl: "src"`, so all imports resolve from `src/`. Examples:

```js
import { useTheme } from "shared/hooks/useTheme";
import { Button } from "shared/components/Button";
import MacroTrackerScreen from "features/macroTracker/MacroTrackerScreen";
```

### Date Formats

- `DD/MM/YY` — display format and primary key for macro tracker state (`todayString()`, `selectedDate`)
- `YYYY-MM-DD` — ISO format required by the calendar library; convert with `dmyToIso` / `isoToDmy` from `src/shared/utils/dateUtils.js`

### Styling

The color palette lives in `src/shared/constants/colors.js` (`COLORS`, also exported as `themes.light`). Layout tokens are in `src/shared/constants/styles.js` (`SPACING`, `FONT_SIZE`, `FONT_WEIGHT`, `BORDER_RADIUS`, `SHADOW`, `CONTROL_HEIGHT`). Components get colors via `useTheme()` and per-feature `createThemedStyles(colors)` factories (e.g. `src/features/macroTracker/macroTrackerStyles.js`) — never import `COLORS` directly in new UI.

### Food Name Formatting

Every food name the user produces — a typed or dictated search, a scanned label's
name, a manual entry, an edited saved food, a food inside a meal — is passed
through `formatFoodName` from `src/shared/utils/textUtils.js` before it is stored
or displayed. `foodKey(name)` (the formatted name, lowercased) is the canonical
cache/history key, so "chiken breast" and "Chicken Breast" resolve to one entry.
`foodCacheUtils` re-exports `foodKey` rather than defining its own — there is one
key function, and its idempotence is what keeps `foodKey(storedName) === key`
true across reloads.

A meal's own name is the user's label for it, not a food name, so the formatter
is applied to the foods inside a meal but never to the meal's name.

The formatter only fixes casing, spacing and unambiguous misspellings — it never
reorders words, drops them, or changes quantities — and it is idempotent, because
stored keys are re-formatted every time they're rendered. Casing rules, brand and
acronym exceptions and the misspelling list live in that one file; extend those
tables rather than adding formatting logic at a call site.

`loadMacroTrackerData` runs the formatter over everything already in AsyncStorage
on each load, so foods saved before a rule existed get cleaned up too. It does
three idempotent passes, and the order matters: convert any leftover
`CUSTOM_FOODS` into meals → format every stored name and re-key off the corrected
spelling → `migrateFoodData` splits legacy multi-food saved foods. Migrating last
means it keys off names that are already clean. `migrateFoodData` deliberately
passes logged meals through untouched; splitting one would scatter the meal
across the day's log.

Run `node scripts/format-name-check.mjs` after touching the formatter — it checks
the cases, idempotency, and that no input's words or numbers change.
