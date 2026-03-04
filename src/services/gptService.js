import { safeParseJSON, normalizeAndValidateItem } from "../utils/gptUtils";

/**
 * Call OpenAI GPT to get nutrition data for a food input.
 * Returns a normalized array of items ready to use.
 * Throws an error if GPT fails or returns invalid data.
 */
export const fetchNutritionFromGPT = async (input, apiKey) => {
  const systemPrompt = `
    You are a nutrition calculation engine.
    Return ONLY valid JSON.
    Do not include markdown, code fences, commentary.

    Rules:
    - Calculate calories, protein, carbs, fats.
    - Percentages (e.g., "10%") mean fat unless stated.
    - "Lean X%" means fat = 100 - X.
    - Always estimate a realistic weight in grams based on common household units and the macros you provide
    - Always provide a weight in grams for each item that matches the macros you are returning.
    - For vague descriptors (e.g., "small", "medium", "large"), use typical weight for that food.
    - Multiple foods? Split into separate items.
    - Make reasonable assumptions if needed; else assumption: null.
    - Never return empty or negative values.
    - Always return at least one item.
    - Calories MUST match macros: calories ≈ protein*4 + carbs*4 + fat*9. Correct if mismatch >10%.
    - Beef mince references per 100g raw: 
        5% fat: 21p/5f/130kcal
        10% fat: 20p/10f/176kcal
        15% fat: 18p/15f/215kcal
    - Scale all values linearly by weight.

    JSON schema:
    {
    "items": [
        {
        "name": string,
        "amount_g": number,
        "calories_kcal": number,
        "protein_g": number,
        "carbs_g": number,
        "fat_g": number,
        "assumption": string | null
        }
    ]
    }`;

  // Call GPT API
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: input },
      ],
    }),
  });

  const gptData = await res.json();
  const rawText = gptData.output_text || gptData.output?.[0]?.content?.[0]?.text;
  if (!rawText) throw new Error("No response from GPT");

  // Parse and normalize
  const parsed = safeParseJSON(rawText);
  if (!parsed?.items || !Array.isArray(parsed.items)) throw new Error("Invalid GPT output");

  const items = parsed.items.map(normalizeAndValidateItem);

  return items;
};