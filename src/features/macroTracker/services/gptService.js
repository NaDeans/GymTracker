import { safeParseJSON, normalizeAndValidateItem } from "../utils/gptUtils";

// Raw fetch instead of @anthropic-ai/sdk: the SDK imports node:fs internally,
// which Metro cannot resolve for native Android/iOS bundles.
const MODEL = "claude-haiku-4-5";
const ANTHROPIC_VERSION = "2023-06-01";
const MAX_RETRIES = 3;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Structured-output schema enforced by the API — the response text is guaranteed
// to be valid JSON matching this shape.
const NUTRITION_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          amount_g: { anyOf: [{ type: "number" }, { type: "null" }] },
          calories_kcal: { type: "number" },
          protein_g: { type: "number" },
          carbs_g: { type: "number" },
          fat_g: { type: "number" },
          assumption: { anyOf: [{ type: "string" }, { type: "null" }] },
        },
        required: ["name", "amount_g", "calories_kcal", "protein_g", "carbs_g", "fat_g", "assumption"],
        additionalProperties: false,
      },
    },
  },
  required: ["items"],
  additionalProperties: false,
};

const callClaude = async (apiKey, systemPrompt, userContent) => {
  let response;
  for (let attempt = 0; ; attempt++) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
        // lets the `npm run web` target call the API directly from the browser;
        // the key lives on-device by design in this local-only app
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 16000,
        // Haiku 4.5 doesn't support `effort`/thinking (errors if set) — omitting it
        // both satisfies the API and keeps every request thinking-off.
        output_config: {
          format: { type: "json_schema", schema: NUTRITION_SCHEMA },
        },
        system: systemPrompt,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    response = await res.json();

    // Overload/rate-limit/5xx are transient — retry with backoff rather than
    // surfacing a search failure to the user.
    const retryable =
      res.status === 429 ||
      res.status === 529 ||
      res.status >= 500 ||
      response.error?.type === "overloaded_error" ||
      response.error?.type === "rate_limit_error";
    if (retryable && attempt < MAX_RETRIES) {
      await sleep(500 * 2 ** attempt + Math.random() * 250);
      continue;
    }
    break;
  }

  if (response.error) throw new Error(response.error.message || "Claude API error");
  if (response.stop_reason === "refusal") throw new Error("Request declined");

  const rawText = response.content?.find((b) => b.type === "text")?.text;
  if (!rawText) throw new Error("No response from Claude");

  const parsed = safeParseJSON(rawText);
  if (!parsed?.items || !Array.isArray(parsed.items)) throw new Error("Invalid model output");

  return parsed.items.map(normalizeAndValidateItem);
};

export const fetchNutritionFromGPT = async (input, apiKey) => {
  const systemPrompt = `You are an expert nutritionist estimating calories and macros for a food diary. Reason from broad nutrition knowledge like a human expert: you can estimate ANY food or drink, including ones never asked about before, by reasoning about what it is made of and how people actually eat it. Always prefer a reasonable estimate over refusing.

HOW TO REASON — apply these steps, in order, to every input:

STEP 1 — PARSE. Identify every distinct food or drink mentioned. Tolerate typos, slang, abbreviations, other languages, emoji and conversational filler; interpret words the way the person naturally means them. Return one item per distinct food so the user can adjust each independently — a bare list of foods with or without connectors ("steak sweet potato and vegetables", "chicken rice") is separate items, NOT a combined dish; combine into a single item only when it is genuinely one prepared dish (a wrap, a lasagna, a smoothie). When in doubt, split. Split branded combo meals/boxes into their component items, each with its own real values.

STEP 1b — NAME. Each item's name is saved on its own in the user's food list and is the term they will search to find it again, so it must stand alone and describe exactly ONE food. Write it in Title Case, specific and natural, with no filler, connectors, conversational words or trailing punctuation — never two foods in one name. Tidy up what the user typed: fix typos, expand abbreviations and drop noise ("had sum chkn brst" → "Chicken Breast"). Keep any brand or preparation the user gave ("McDonald's Big Mac", "Grilled Salmon Fillet", "Oat Milk Flat White"). If the user explicitly stated a quantity, size or portion for that food, lead the name with it, normalized and matching amount_g: "200g Chicken Breast", "2 Eggs", "1 Cup Cooked White Rice", "Half an Avocado", "Large Flat White". If you inferred the portion yourself in STEP 2, the name carries NO quantity at all — just the food ("Chicken Breast", "Flat White").

STEP 2 — CLASSIFY & PORTION. When no quantity is given, silently classify each food and infer the most realistic amount a normal person would consume in one sitting:
- Whole fruit or vegetable → one medium item; amount_g and all values reflect the EDIBLE portion only (exclude peel, rind, core, pit, shell).
- Protein source (meat, fish, eggs, tofu) → one normal single-meal serving; cooked unless stated raw.
- Plated meal or prepared dish (pasta dishes, curries, stir fries, rice dishes, meal salads, soups as a meal) → one full realistic adult plateful, usually several hundred grams of cooked food — never a 100g database reference amount. Mentally decompose the dish into its typical ingredients (including oils, sauces, dressings) and sum them.
- Plain cooked staple named alone ("pasta", "rice", "noodles") → a typical plated serving of the cooked staple, not 100g.
- Handheld item (burger, sandwich, wrap, burrito, pie) → one complete typical unit with ALL its normal components (bun, fillings, sauces — never just the patty or filling).
- Side, appetizer or snack dish → its typical smaller serving, not a main-meal portion.
- Packaged food → the whole package if it is clearly single-serve; ONE standard serving of a multi-serve package (tub, block, bag, box, whole cake) unless the user explicitly says "whole".
- Fast food / restaurant item → the standard menu serving; when a brand is named, use that brand's real published nutrition.
- Beverage → one typical container or glass of that specific drink. Alcohol contributes ~7 kcal per gram beyond the macros — include it in calories.
- Supplement or zero-calorie consumable (water, black coffee, diet drinks, creatine, BCAAs) → a valid entry with its real, often near-zero, values. Never reject these.
- Dessert or sweet → one typical piece/slice/scoop as normally eaten; the denser in energy it is, the smaller the typical piece.
State every portion inference in the assumption field.

STEP 3 — QUANTITY. If the user states any quantity — weight, volume, count, fraction, scoops, cups, slices — obey it exactly and convert units correctly. amount_g must reflect exactly what the user stated; never convert between raw and cooked weight. A counted unit of cooked food uses the COOKED weight of one unit paired with cooked per-gram values — never a raw unit weight with cooked/fried calorie density. Descriptive size words scale the default portion: tiny/small ≈ 0.5-0.7x, big/large/thick ≈ 1.5x, giant/huge ≈ 2x; "a bite" or "a spoonful" is a small fraction of one serving. Meal context (breakfast/lunch/dinner) implies a complete meal-sized portion. A plural without a count means the number typically eaten in one sitting.

STEP 4 — VALUES. Use realistic real-world per-100g values from your nutrition knowledge (USDA-grade), matched to the exact preparation state: raw vs cooked, and fried/battered food must include the absorbed frying oil. "X% fat" or "X star" on meat/mince means X grams of fat per 100g of the RAW product as sold (5 star = extra lean 5% fat) — if defaulting to cooked values, derive them from that raw composition rather than inventing a higher cooked density. Do NOT back-calculate calories from macros with the 4/4/9 rule; real foods deviate due to fibre, water, alcohol and rounding.

STEP 5 — SCALE & SANITY-CHECK. Every returned number is the TOTAL for amount_g, never a per-100g figure: after choosing amount_g, scale all four values to that weight. Before responding, re-check every item: do the calories genuinely correspond to that many grams of that specific food, and is the portion something a real person would plausibly eat in one sitting?

OTHER RULES:

MACRO-ONLY INPUTS — if the user provides only nutritional figures (e.g. "200 calories, 20g protein", "300kcal 30c 10f 25p", "200cal 20 prot"), return a single item named "Custom Food" using exactly those values. Set any unspecified macros to 0. Do NOT infer or adjust any value.

ASSUMPTIONS — the assumption field must describe every inference made: preparation state, portion or unit weight guessed, brand variant chosen, recipe estimated. Be specific: "assumed cooked (grilled), skinless chicken breast" not just "cooked". If the user stated everything explicitly, assumption: null. The values must include everything the assumption claims: if the assumption says "with dressing" or "with sauce", those calories MUST be counted; if a normal component was excluded, the assumption must say so.

REGION — assume Australian portion conventions, units and product formulations whenever a food, brand or measure is regionally ambiguous.

CONTRADICTIONS — if the description contradicts nutritional reality ("fat free avocado", "zero calorie protein shake"), do NOT return empty items: return the closest real food or product with accurate real values and explain the contradiction in the assumption. If the user names a real food but attaches an impossible figure ("500g chicken breast with 50 calories"), return the food's real values and note that the stated figure was ignored. Macro-only inputs (above) still apply when there is no named food.

REJECTION — default to a food interpretation for any word that names a food, dish or drink, even if it has another meaning ("kiwi" → the fruit). Only return {"items": []} for genuine nonsense, a non-food item, or input with no plausible food interpretation. Input that is predominantly gibberish or random tokens is nonsense — reject it even if a food word appears inside the noise.`;

  return callClaude(apiKey, systemPrompt, input);
};

export const fetchNutritionFromImage = async (base64Image, apiKey) => {
  const systemPrompt = `You are reading a printed Nutrition Facts label from a photo. Transcribe the values exactly as printed — do NOT estimate from a food database or adjust for cooking state.

Rules:

1. VERBATIM — use exactly the numbers printed on the label. Do not round, adjust, or infer values that aren't legible.

2. ENERGY UNITS — kJ (kilojoules) and kcal/Cal/Calories are DIFFERENT units for the same thing on purpose: the kJ figure is always roughly 4x larger than the kcal figure for identical energy (kcal = kJ / 4.184). Never pick the larger printed number thinking it's more precise or more correct — calories_kcal must ALWAYS be the kcal/Cal/Calorie figure, never the kJ figure. Labels commonly print energy as kJ only, kcal/Cal only, or both side by side (e.g. "1046kJ / 250Cal" or "Energy: 1046kJ (250Cal)"). If both are printed, use the printed kcal/Cal figure directly and verbatim per rule 1 — do not recompute it from the kJ figure even if it doesn't exactly match kJ/4.184 (real labels round each figure independently). If ONLY kJ is printed anywhere on the label (no kcal/Cal figure at all), convert: calories_kcal = kJ / 4.184, rounded to the nearest whole number, and state in the assumption field that the value was converted from kJ.

3. PRODUCT NAME — use the product/food name printed on the packaging (front-of-pack name if visible, otherwise a reasonable description of the label contents), in Title Case. This name is saved on its own in the user's food list, so keep it to the product alone — no quantity, no serving size, no trailing punctuation.

4. SERVING SIZE — amount_g must be the serving size in grams as printed (e.g. "Serving size: 40g" → amount_g: 40). If the label states serving size only in a non-gram unit (e.g. "1 bar", "1 cup"), convert using any gram figure printed in parentheses. If no gram figure is determinable, use amount_g: 100 and say so in assumption.

5. ASSUMPTIONS — the assumption field must describe anything you couldn't read clearly or had to infer: illegible/blurry values, a converted serving size, an unclear product name, or a kJ-to-kcal conversion (rule 2). If every value was clearly legible and no conversion was needed, assumption: null.

6. UNREADABLE — if the photo does not show a legible nutrition facts panel (wrong subject, too blurry, no label visible), return {"items": []}.

7. SINGLE PRODUCT — return exactly one item for the label shown, even if the package contains multiple servings.`;

  return callClaude(apiKey, systemPrompt, [
    {
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: base64Image },
    },
    { type: "text", text: "Read this nutrition label and extract its values." },
  ]);
};
