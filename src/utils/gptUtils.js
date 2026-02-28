// Safe parse JSON from GPT
export const safeParseJSON = (text) => {
  try {
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (!parsed.items || parsed.items.length === 0) {
      throw new Error("No nutrition items returned");
    }

    return parsed;
  } catch (err) {
    console.error("❌ JSON parse error:", err);
    throw new Error("Failed to parse GPT JSON output");
  }
};

// Normalize & validate item
export const normalizeAndValidateItem = (i) => {
  const protein = Number(i.protein_g ?? i.protein ?? 0);
  const carbs   = Number(i.carbs_g ?? i.carbs ?? 0);
  const fats    = Number(i.fat_g ?? i.fats ?? 0);

  const calories = Math.round(protein * 4 + carbs * 4 + fats * 9);
  const amount_g = i.amount_g != null ? Number(i.amount_g) : null;

  return {
    id: Date.now().toString() + Math.random(),
    name: formatName(i.name),
    amount_g,
    calories,
    protein,
    carbs,
    fats,
    assumption: i.assumption?.trim() ? i.assumption : null
  };
};
