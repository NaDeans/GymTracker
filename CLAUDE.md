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

React Native / Expo app with two tab screens. All state is local React hooks; persistence is `AsyncStorage` only — there is no backend or database.

### Navigation

`App.js` → React Navigation bottom tab with two screens:
- **Macros** → `src/screens/macroTrackerScreen.js`
- **Reps** → `src/screens/repCounterScreen.js`

### Macro Tracker

`macroTrackerScreen.js` owns all macro state and passes handlers down as props. Key state objects:

| State | AsyncStorage key | Description |
|---|---|---|
| `customFoods` | `CUSTOM_FOODS` | User-defined foods with known macros |
| `dailyLog` | `DAILY_LOG` | `{ [dateStr]: { items: { [id]: { item, count } }, totals } }` |
| `historyByDate` | `HISTORY_BY_DATE` | `{ [dateStr]: [{ foodId, key, items }] }` — GPT/custom food entries per day |
| `gptCache` | `GPT_CACHE` | `{ [searchKey]: { searchKey, foodId, items } }` — cached GPT responses |
| `goals` | `GOALS` | `{ calories, protein, carbs, fats }` targets |

Food lookup flow: user types → check `gptCache` → if miss, call the Claude API (`claude-sonnet-5` via `@anthropic-ai/sdk`, structured outputs) from `gptService.js` → normalize via `gptUtils.js` → store in cache and add to `historyByDate`. (File/state names keep the legacy "gpt" prefix.)

`dailyLog` and `historyByDate` serve different purposes: `dailyLog` tracks item counts and running totals for display; `historyByDate` preserves the original GPT entries (used by `DailyControls` to render each meal entry with +/- controls).

### Rep Counter

`repCounterScreen.js` owns all data in a single `data` state object stored at `REP_COUNTER_DATA`:

```
data: {
  [groupName]: {
    [exerciseName]: [
      { date: "YYYY-MM-DD", sets: [{ reps, weight }], notes: "" }
    ]
  }
}
```

Screen renders as a drill-down: Categories → Exercises → Set log. Navigated by `selectedGroup` / `selectedExercise` state (null = list view). Day notes are stored separately at `DAY_NOTES`.

### Module Aliases

`jsconfig.json` sets `baseUrl: "src"`, so all imports resolve from `src/`. Examples:

```js
import { styles } from "styles/macroTrackerStyles";
import DatePicker from "components/macroTrackerComponents/DatePicker";
```

### Date Formats

- `DD/MM/YY` — display format and primary key for macro tracker state (`todayString()`, `selectedDate`)
- `YYYY-MM-DD` — ISO format used internally in rep counter and for calendar library; convert with `dmyToIso` / `isoToDmy` from `src/utils/dateUtils.js`

### Styling

Shared design tokens live in `src/constants/colors.js` (`COLORS`) and `src/constants/styles.js` (`SPACING`, `FONT_SIZE`, `FONT_WEIGHT`, `BORDER_RADIUS`, `SHADOW`). Screen-level StyleSheets are in `src/styles/`.
