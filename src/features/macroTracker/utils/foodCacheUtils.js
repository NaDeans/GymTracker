// Saved foods hold exactly one food each, and a food's name IS its search key:
// `gptCache[foodKey(item.name)] = { searchKey, foodId, items: [item], ... }`.
// That invariant is what keeps the edit modal down to a single "Name" field —
// there is no separate search term that can drift away from the display name.

// Free-text searches can still name several foods at once. Each one becomes its
// own saved food, and the raw search string is recorded on every entry it
// produced (`aliases`) so retyping that same string is served from cache
// instead of costing another API call.

// One shared key function, so the spelling the cache is keyed by is the same
// spelling names are stored under. formatFoodName is idempotent, which is what
// keeps `foodKey(storedName) === key` true after a reload.
export { foodKey } from "shared/utils/textUtils";
import { foodKey } from "shared/utils/textUtils";

export const newFoodId = () => Date.now().toString() + Math.random().toString(36).slice(2);

// Separators people actually type between foods. Only used as a fallback lookup,
// where every fragment must match a saved food exactly — so a bad split simply
// falls through to the API rather than logging the wrong thing.
const TERM_SPLIT = /\s*(?:,|;|\+|&|\band\b|\n)\s*/i;

export const splitSearchTerms = (term) =>
  term.split(TERM_SPLIT).map(foodKey).filter(Boolean);

const dedupeEntries = (entries) => {
  const seen = new Set();
  return entries.filter((e) => e && !seen.has(e.foodId) && seen.add(e.foodId));
};

// Returns the saved foods a search resolves to, or null when the API is needed.
export const resolveFromCache = (term, cache) => {
  if (!term) return null;

  if (cache[term]) return [cache[term]];

  // A previous multi-food search of this exact string. `n` is how many foods it
  // produced, so a since-deleted food makes the alias miss instead of silently
  // logging a partial meal.
  const aliasHits = Object.values(cache)
    .filter((e) => e.aliases?.[term])
    .sort((a, b) => a.aliases[term].i - b.aliases[term].i);
  if (aliasHits.length && aliasHits.length === aliasHits[0].aliases[term].n) return aliasHits;

  const parts = splitSearchTerms(term);
  if (parts.length > 1 && parts.every((p) => cache[p])) {
    return dedupeEntries(parts.map((p) => cache[p]));
  }

  return null;
};

// Records `term` as an alias for the i-th of n foods it produced, keeping only
// the most recent few so a long-lived food doesn't hoard every phrase ever
// typed. Dropping one only costs an API call on the next identical search.
const MAX_ALIASES = 12;

export const withAlias = (entry, term, i, n) => {
  const aliases = { ...(entry.aliases || {}) };
  delete aliases[term]; // re-insert last: object key order is the recency order
  aliases[term] = { i, n };
  Object.keys(aliases)
    .slice(0, -MAX_ALIASES)
    .forEach((k) => delete aliases[k]);
  return { ...entry, aliases };
};

// Names must stay unique because the name is the key. Collisions get a numeric
// suffix on the name itself, so `foodKey(name) === key` still holds.
const uniqueName = (name, taken) => {
  if (!taken.has(foodKey(name))) return name;
  for (let n = 2; ; n++) {
    const candidate = `${name} (${n})`;
    if (!taken.has(foodKey(candidate))) return candidate;
  }
};

// Rebuilds legacy data — entries keyed by the raw search string and holding
// several foods — into one food per entry, keyed by its own name. Idempotent:
// already-migrated data maps to itself.
export const migrateFoodData = (gptCache, historyByDate) => {
  const cache = {};
  const taken = new Set();

  Object.entries(gptCache || {}).forEach(([oldKey, entry]) => {
    const items = entry?.items || [];
    items.forEach((item, i) => {
      const name = uniqueName(item.name?.trim() || oldKey, taken);
      const key = foodKey(name);
      taken.add(key);
      cache[key] = {
        searchKey: key,
        foodId: i === 0 ? entry.foodId || newFoodId() : newFoodId(),
        items: [{ ...item, name }],
        ...(entry.source ? { source: entry.source } : {}),
        // Keep the old raw search term working as a lookup for this food.
        aliases: key === oldKey ? entry.aliases || {} : withAlias(entry, oldKey, i, items.length).aliases,
      };
    });
  });

  const history = {};
  Object.entries(historyByDate || {}).forEach(([date, entries]) => {
    history[date] = (entries || []).flatMap((entry) => {
      const items = entry?.items || [];
      // A logged meal is deliberately several foods under one header — splitting
      // it would scatter the meal across the day's log, so it passes through.
      if (entry?.mealName !== undefined) return [entry];
      if (items.length <= 1) {
        return items.length ? [{ ...entry, key: foodKey(items[0].name) || entry.key }] : [];
      }
      return items.map((item, i) => ({
        ...entry,
        // Custom-food entries have no foodId and must keep it that way.
        foodId: entry.foodId ? (i === 0 ? entry.foodId : newFoodId()) : undefined,
        key: foodKey(item.name),
        items: [item],
      }));
    });
  });

  return { gptCache: cache, historyByDate: history };
};
