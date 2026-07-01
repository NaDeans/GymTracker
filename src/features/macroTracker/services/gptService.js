import { safeParseJSON, normalizeAndValidateItem } from "../utils/gptUtils";

export const fetchNutritionFromGPT = async (input, apiKey) => {
  const systemPrompt = `You are a nutrition database. Return accurate macronutrient data for whatever the user describes.

Return ONLY valid JSON. No markdown, code fences, or commentary.

Rules:

1. MACRO-ONLY INPUTS — if the user provides only nutritional figures (e.g. "200 calories, 20g protein", "300kcal 30c 10f 25p", "200cal 20 prot"), return a single item named "Custom Food" using exactly those values. Set any unspecified macros to 0. Do NOT infer or adjust any value.

2. UNKNOWN / TOO VAGUE — if the input is genuine nonsense, a non-food item, or so vague that no reasonable estimate exists, return {"items": []}.

3. ASSUMPTIONS — the assumption field must describe every inference you made: preparation state (cooked vs raw), portion size guessed, brand variant chosen, recipe estimated. Be specific: "assumed cooked (grilled), skinless chicken breast" not just "cooked". If the user stated everything explicitly (weight, preparation, macros), assumption: null.

4. ACCURACY — use real database values (USDA or equivalent). Do NOT back-calculate calories from macros using the 4,4,9 rule. Real foods differ slightly from this formula due to fibre, water, and rounding.

5. EXACT WEIGHT — amount_g must match the weight the user specified. If they said "200g raw", return amount_g: 200 with raw calorie values. Never convert between raw and cooked weight.

6. MEAT/FISH DEFAULT — default to cooked values unless the user specifies raw.

7. FAT PERCENTAGE — "X% fat" or "lean X%" means fat percentage of the meat by weight (e.g. "20% fat mince" = 20g fat per 100g).

8. MULTIPLE FOODS — return one item per food when the input contains multiple foods.

Reference values per 100g (scale linearly for any weight):
  Chicken breast raw:        protein 23g, fat  1.2g, carbs  0g,  calories 110 kcal
  Chicken breast cooked:     protein 31g, fat  3.6g, carbs  0g,  calories 165 kcal
  Greek yogurt full fat:     protein  9g, fat  5.0g, carbs  3.6g, calories  97 kcal
  Greek yogurt 0% fat:       protein 10g, fat  0.0g, carbs  3.6g, calories  59 kcal
  Beef mince 5% fat raw:     protein 21g, fat  5g,  carbs  0g,  calories 130 kcal
  Beef mince 10% fat raw:    protein 20g, fat 10g,  carbs  0g,  calories 176 kcal
  Beef mince 15% fat raw:    protein 18g, fat 15g,  carbs  0g,  calories 215 kcal
  Beef mince 20% fat raw:    protein 17g, fat 20g,  carbs  0g,  calories 247 kcal

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

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      temperature: 0,
      text: { format: { type: "json_object" } },
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: input },
      ],
    }),
  });

  const gptData = await res.json();
  const rawText = gptData.output_text || gptData.output?.[0]?.content?.[0]?.text;
  if (!rawText) throw new Error("No response from GPT");

  const parsed = safeParseJSON(rawText);
  if (!parsed?.items || !Array.isArray(parsed.items)) throw new Error("Invalid GPT output");

  return parsed.items.map(normalizeAndValidateItem);
};

export const fetchNutritionFromImage = async (base64Image, apiKey) => {
  const systemPrompt = `You are reading a printed Nutrition Facts label from a photo. Transcribe the values exactly as printed — do NOT estimate from a food database or adjust for cooking state.

Return ONLY valid JSON. No markdown, code fences, or commentary.

Rules:

1. VERBATIM — use exactly the numbers printed on the label. Do not round, adjust, or infer values that aren't legible.

2. PRODUCT NAME — use the product/food name printed on the packaging (front-of-pack name if visible, otherwise a reasonable description of the label contents).

3. SERVING SIZE — amount_g must be the serving size in grams as printed (e.g. "Serving size: 40g" → amount_g: 40). If the label states serving size only in a non-gram unit (e.g. "1 bar", "1 cup"), convert using any gram figure printed in parentheses. If no gram figure is determinable, use amount_g: 100 and say so in assumption.

4. ASSUMPTIONS — the assumption field must describe anything you couldn't read clearly or had to infer: illegible/blurry values, a converted serving size, an unclear product name. If every value was clearly legible, assumption: null.

5. UNREADABLE — if the photo does not show a legible nutrition facts panel (wrong subject, too blurry, no label visible), return {"items": []}.

6. SINGLE PRODUCT — return exactly one item for the label shown, even if the package contains multiple servings.

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

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      temperature: 0,
      text: { format: { type: "json_object" } },
      input: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "input_text", text: "Read this nutrition label and extract its values." },
            { type: "input_image", image_url: `data:image/jpeg;base64,${base64Image}`, detail: "high" },
          ],
        },
      ],
    }),
  });

  const gptData = await res.json();
  const rawText = gptData.output_text || gptData.output?.[0]?.content?.[0]?.text;
  if (!rawText) throw new Error("No response from GPT");

  const parsed = safeParseJSON(rawText);
  if (!parsed?.items || !Array.isArray(parsed.items)) throw new Error("Invalid GPT output");

  return parsed.items.map(normalizeAndValidateItem);
};
