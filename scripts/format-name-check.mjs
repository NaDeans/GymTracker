// Sanity check for src/shared/utils/textUtils.js — no test runner is configured,
// so this is a plain `node scripts/format-name-check.mjs` script.
//
// The util is an ES module inside an app that Metro bundles (not Node), so it's
// loaded from source text via a data: URL rather than imported by path.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, "..", "src", "shared", "utils", "textUtils.js"), "utf8");
const { formatFoodName, foodKey } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
);

const CASES = [
  // casing
  ["chicken breast", "Chicken Breast"],
  ["CHICKEN BREAST", "Chicken Breast"],
  ["chicken breast with rice", "Chicken Breast with Rice"],
  ["steak and chips", "Steak and Chips"],
  ["bowl of oats", "Bowl of Oats"],
  ["with", "With"],
  // acronyms / brands / proper nouns
  ["bbq chicken pizza", "BBQ Chicken Pizza"],
  ["kfc zinger burger", "KFC Zinger Burger"],
  ["greek yoghurt", "Greek Yoghurt"],
  ["french fries", "French Fries"],
  ["mcdonalds big mac", "McDonald's Big Mac"],
  ["mcchicken", "McChicken"],
  ["nandos chicken", "Nando's Chicken"],
  ["coca cola", "Coca-Cola"],
  ["weetbix", "Weet-Bix"],
  ["pb&j sandwich", "PB&J Sandwich"],
  // measurements
  ["200G chicken", "200g Chicken"],
  ["500ML milk", "500ml Milk"],
  ["1.5kg MINCE", "1.5kg Mince"],
  ["2x weet bix", "2x Weet-Bix"],
  ["vitamin b12", "Vitamin B12"],
  ["chicken 200 g", "Chicken 200 g"],
  ["200 ML milk", "200 ml Milk"],
  ["grams of oats", "Grams of Oats"],
  // spelling
  ["chiken brest", "Chicken Brest"],
  ["chiken", "Chicken"],
  ["brocoli and chiken", "Broccoli and Chicken"],
  ["avacado toast", "Avocado Toast"],
  ["spagetti bolognaise", "Spaghetti Bolognese"],
  ["2 potatoes", "2 Potatoes"],
  ["mashed potatos", "Mashed Potatoes"],
  ["strawberrys", "Strawberries"],
  ["chikens", "Chickens"],
  // spacing / punctuation
  ["  chicken   rice  ", "Chicken Rice"],
  ["chicken, rice and beans.", "Chicken, Rice and Beans"],
  ["chicken,rice", "Chicken, Rice"],
  ["stir-fry veg", "Stir-Fry Veg"],
  ["chicken ( grilled )", "Chicken (Grilled)"],
  // dictation shapes
  ["two hundred grams of chicken breast.", "Two Hundred Grams of Chicken Breast"],
  ["i had a chicken wrap", "I Had a Chicken Wrap"],
  // preserved intent
  ["MyProtein whey", "MyProtein Whey"],
  ["", ""],
  ["   ", ""],
];

let failed = 0;
for (const [input, expected] of CASES) {
  const actual = formatFoodName(input);
  if (actual !== expected) {
    failed += 1;
    console.log(`FAIL  ${JSON.stringify(input)}\n  expected ${JSON.stringify(expected)}\n  got      ${JSON.stringify(actual)}`);
  }
}

// Idempotency: formatting stored keys happens on every render, so a second pass
// must be a no-op. Same for the lowercase key round-trip.
const IDEMPOTENCY_INPUTS = [
  ...CASES.map(([i]) => i),
  "Hungry Jacks whopper",
  "tim tams",
  "brussel sprouts",
  "ice cream 2 scoops",
  "o'briens beef",
  "protein shake 30g",
];
for (const input of IDEMPOTENCY_INPUTS) {
  const once = formatFoodName(input);
  const twice = formatFoodName(once);
  if (once !== twice) {
    failed += 1;
    console.log(`FAIL (not idempotent)  ${JSON.stringify(input)}\n  1st ${JSON.stringify(once)}\n  2nd ${JSON.stringify(twice)}`);
  }
  // Deliberate internal capitals ("MyProtein") can't survive the lowercase key,
  // by design — the name keeps them, the cache key doesn't.
  const keyed = formatFoodName(foodKey(input));
  if (!/[a-z][A-Z]/.test(input) && keyed !== once) {
    failed += 1;
    console.log(`FAIL (key round-trip)  ${JSON.stringify(input)}\n  direct ${JSON.stringify(once)}\n  viaKey ${JSON.stringify(keyed)}`);
  }
}

// Meaning must survive: same words, same order, same numbers.
const wordsOf = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean);
const MEANING_INPUTS = [
  "chicken breast with rice and broccoli",
  "200g steak, sweet potato and vegetables",
  "large flat white with 2 sugars",
  "half a cup of oats and 30g whey",
];
for (const input of MEANING_INPUTS) {
  const before = wordsOf(input);
  const after = wordsOf(formatFoodName(input));
  if (before.length !== after.length) {
    failed += 1;
    console.log(`FAIL (word count changed)  ${JSON.stringify(input)} → ${JSON.stringify(formatFoodName(input))}`);
  }
  const numsBefore = input.match(/\d+(?:\.\d+)?/g) || [];
  const numsAfter = formatFoodName(input).match(/\d+(?:\.\d+)?/g) || [];
  if (numsBefore.join(",") !== numsAfter.join(",")) {
    failed += 1;
    console.log(`FAIL (numbers changed)  ${JSON.stringify(input)}`);
  }
}

console.log(failed === 0 ? `PASS — ${CASES.length} cases + idempotency + meaning checks` : `${failed} failure(s)`);
process.exit(failed === 0 ? 0 : 1);
