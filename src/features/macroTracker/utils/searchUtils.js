// Ranking for the food search suggestions.
//
// Relevance always wins: results are bucketed into match tiers (exact →
// whole-string prefix → word prefix → substring → all query words present),
// and only foods sitting in the same tier are compared against each other.
// Inside a tier the food the user logs most often comes first.

const normalize = (s) => String(s || "").toLowerCase().trim().replace(/\s+/g, " ");

const WORD_BOUNDARY = /[^a-z0-9]/;

// Lower is more relevant; -1 means "no match".
const relevanceTier = (key, query) => {
  if (key === query) return 0;
  if (key.startsWith(query)) return 1;

  const idx = key.indexOf(query);
  if (idx > 0 && WORD_BOUNDARY.test(key[idx - 1])) return 2;
  if (idx !== -1) return 3;

  // Multi-word queries also match when every word appears as the start of some
  // word in the name, in any order ("oat milk" → "milk, oat barista").
  const tokens = query.split(" ").filter(Boolean);
  if (tokens.length > 1) {
    const words = key.split(/[^a-z0-9]+/).filter(Boolean);
    if (tokens.every((t) => words.some((w) => w.startsWith(t)))) return 4;
  }

  return -1;
};

// How many times each cached food has been logged, across every day. History
// entries keep the search key they were logged under, so tracking this needs
// no extra state.
export const countFoodUsage = (historyByDate) => {
  const counts = {};
  Object.values(historyByDate || {}).forEach((entries) => {
    (entries || []).forEach((entry) => {
      if (!entry?.key) return;
      const k = normalize(entry.key);
      counts[k] = (counts[k] || 0) + 1;
    });
  });
  return counts;
};

export const rankFoodSuggestions = (keys, rawQuery, usageCounts = {}, limit = 5) => {
  const query = normalize(rawQuery);
  if (!query) return [];

  const scored = [];
  (keys || []).forEach((key) => {
    const normalized = normalize(key);
    const tier = relevanceTier(normalized, query);
    if (tier === -1) return;
    scored.push({
      key,
      tier,
      uses: usageCounts[normalized] || 0,
      length: normalized.length,
    });
  });

  scored.sort(
    (a, b) =>
      a.tier - b.tier ||
      b.uses - a.uses ||
      a.length - b.length ||
      a.key.localeCompare(b.key)
  );

  return scored.slice(0, limit).map((s) => s.key);
};
