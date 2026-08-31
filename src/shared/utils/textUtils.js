// Canonical formatting for anything the user names a food: typed searches,
// voice transcripts, scanned-label names, manual entries and edits.
//
// Two hard rules, in this order:
//   1. Never change what was written. Word order, quantities and the foods
//      themselves survive untouched — this only fixes casing, spacing and
//      unambiguous misspellings.
//   2. Be idempotent. format(format(x)) === format(x), because stored keys are
//      re-formatted every time they're displayed.

// Words whose correct casing plain title case gets wrong: acronyms, brands and
// proper nouns that turn up in food names. Keys are lowercase.
const SPECIAL_CASE = {
  // acronyms / initialisms
  bbq: "BBQ", bcaa: "BCAA", bcaas: "BCAAs", blt: "BLT", eaa: "EAA", eaas: "EAAs",
  hp: "HP", ipa: "IPA", kfc: "KFC", mct: "MCT", pb: "PB", "pb&j": "PB&J",
  uht: "UHT", xl: "XL",
  // nationalities / proper nouns used as food descriptors
  american: "American", asian: "Asian", australian: "Australian", brazilian: "Brazilian",
  british: "British", cajun: "Cajun", caesar: "Caesar", chinese: "Chinese",
  danish: "Danish", english: "English", french: "French", greek: "Greek",
  indian: "Indian", italian: "Italian", japanese: "Japanese", korean: "Korean",
  lebanese: "Lebanese", mediterranean: "Mediterranean", mexican: "Mexican",
  moroccan: "Moroccan", spanish: "Spanish", swiss: "Swiss", thai: "Thai",
  turkish: "Turkish", vietnamese: "Vietnamese",
  // brands
  aldi: "ALDI", coles: "Coles", "domino's": "Domino's", dominos: "Domino's",
  gatorade: "Gatorade", "kellogg's": "Kellogg's", kelloggs: "Kellogg's",
  "mcdonald's": "McDonald's", mcdonalds: "McDonald's", macdonalds: "McDonald's",
  milo: "Milo", "nando's": "Nando's", nandos: "Nando's", nutella: "Nutella",
  oreo: "Oreo", oreos: "Oreos", pepsi: "Pepsi", powerade: "Powerade",
  pringles: "Pringles", "reese's": "Reese's", reeses: "Reese's",
  subway: "Subway", vegemite: "Vegemite", woolworths: "Woolworths",
};

// Unambiguous misspellings → correct spelling (lowercase). Australian spellings
// (yoghurt, chilli, doughnut) are correct here and deliberately left alone.
// Entries that map a word to itself are guards: they stop the plural fallback
// below from "correcting" an already-correct plural.
const SPELLING = {
  almound: "almond", asparugus: "asparagus", avacado: "avocado", avaocado: "avocado",
  avocardo: "avocado", bananna: "banana", banna: "banana", bannana: "banana",
  bacan: "bacon", biscut: "biscuit", blueberrys: "blueberries",
  bolognaise: "bolognese", bolognese: "bolognese", brocoli: "broccoli",
  brocolli: "broccoli", broccolli: "broccoli",
  burgur: "burger", burguer: "burger", buter: "butter", butterr: "butter",
  cappucino: "cappuccino", capuccino: "cappuccino", carot: "carrot",
  carrott: "carrot", cauliflour: "cauliflower", cerael: "cereal",
  cerial: "cereal", cheeze: "cheese", chesse: "cheese",
  chiken: "chicken", chickn: "chicken", chickon: "chicken", chiceken: "chicken",
  chocolat: "chocolate", choclate: "chocolate", chocolote: "chocolate",
  cofee: "coffee", coffe: "coffee", cucmber: "cucumber", cucumbar: "cucumber",
  eggplan: "eggplant", expresso: "espresso",
  garlick: "garlic", grapfruit: "grapefruit", hummous: "hummus", humus: "hummus",
  lettice: "lettuce", lettus: "lettuce",
  mayonaise: "mayonnaise", mayonnaise: "mayonnaise", milkshak: "milkshake",
  mozarella: "mozzarella", mozzerella: "mozzarella", mushrom: "mushroom",
  mushroon: "mushroom", musroom: "mushroom", noodel: "noodle", nooodles: "noodles",
  omlet: "omelette", omlette: "omelette", onoin: "onion", oninon: "onion",
  parmasan: "parmesan", parmesean: "parmesan", pineaple: "pineapple",
  pinapple: "pineapple", potatoe: "potato",
  potatoes: "potatoes", potatos: "potatoes", protien: "protein",
  rasberry: "raspberry", rasberries: "raspberries",
  resturant: "restaurant", salmom: "salmon", samon: "salmon", sandwhich: "sandwich",
  sandwitch: "sandwich", sanwich: "sandwich", sause: "sauce", sausge: "sausage",
  sausauge: "sausage", smoothy: "smoothie", smootie: "smoothie",
  spagetti: "spaghetti", spagheti: "spaghetti", spinich: "spinach",
  steack: "steak", strawbery: "strawberry",
  strawberrys: "strawberries", strawberries: "strawberries", suger: "sugar",
  tomatoe: "tomato", tomatoes: "tomatoes", tomatos: "tomatoes", tunna: "tuna",
  vegatable: "vegetable", vegtable: "vegetable", vegtables: "vegetables",
  vegatables: "vegetables", veggtables: "vegetables", watermellon: "watermelon",
  wholemal: "wholemeal", zuchini: "zucchini", zucchinni: "zucchini",
};

// Lowercased mid-name — never at the start or end of the name.
const MINOR_WORDS = new Set([
  "a", "an", "and", "as", "at", "but", "by", "for", "from", "in", "into",
  "n", "nor", "of", "off", "on", "onto", "or", "over", "per", "the", "to", "via",
  "vs", "with", "without",
]);

// Measurement suffixes, so "200G" / "500ML" come out as "200g" / "500ml".
const UNIT_CASE = {
  g: "g", kg: "kg", mg: "mg", ml: "ml", l: "L", cl: "cl", oz: "oz", lb: "lb",
  lbs: "lbs", tbsp: "tbsp", tsp: "tsp", cal: "cal", cals: "cals", kcal: "kcal",
  kj: "kJ", pc: "pc", pcs: "pcs", pk: "pk", x: "x",
};

// Multi-word fixes, applied after word-level casing. Each pattern is matched
// case-insensitively on whole words; the replacement is already canonical, so
// re-running the pass is a no-op.
const PHRASES = [
  [/\bcoca[\s-]?cola\b/gi, "Coca-Cola"],
  [/\bweet[\s-]?bix\b/gi, "Weet-Bix"],
  [/\bup\s?&\s?go\b/gi, "Up&Go"],
  [/\bmc\s+donald'?s\b/gi, "McDonald's"],
  [/\bmac\s?donald'?s\b/gi, "McDonald's"],
  [/\bmcdonalds\b/gi, "McDonald's"],
  [/\bhungry\s+jacks'?s?\b/gi, "Hungry Jack's"],
  [/\bred\s?bull\b/gi, "Red Bull"],
  [/\btim\s?tams\b/gi, "Tim Tams"],
  [/\btim\s?tam\b/gi, "Tim Tam"],
  [/\bbig\s?mac\b/gi, "Big Mac"],
  [/\bbrussel(s)?\s+sprouts\b/gi, "Brussels Sprouts"],
  [/\bbrussel(s)?\s+sprout\b/gi, "Brussels Sprout"],
  [/\bice[\s-]?cream\b/gi, "Ice Cream"],
];

const capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1);

// Looks a word up in SPELLING, falling back to a simple plural form so
// "chikens" is corrected off the "chiken" entry.
const correctSpelling = (lower) => {
  if (SPELLING[lower]) return SPELLING[lower];
  if (lower.endsWith("es") && SPELLING[lower.slice(0, -2)]) return `${SPELLING[lower.slice(0, -2)]}es`;
  if (lower.endsWith("s") && SPELLING[lower.slice(0, -1)]) return `${SPELLING[lower.slice(0, -1)]}s`;
  return lower;
};

const formatWord = (word, isEdge, prevWord) => {
  const lower = word.toLowerCase();

  if (SPECIAL_CASE[lower]) return SPECIAL_CASE[lower];

  const corrected = correctSpelling(lower);
  if (corrected !== lower && SPECIAL_CASE[corrected]) return SPECIAL_CASE[corrected];

  // Pure numbers ("250", "1.5") pass straight through.
  if (/^\d+(?:\.\d+)?$/.test(corrected)) return corrected;

  // Quantity + unit: "200g", "1.5KG", "2X".
  const measure = corrected.match(/^(\d+(?:\.\d+)?)([a-z]+)$/);
  if (measure && UNIT_CASE[measure[2]]) return measure[1] + UNIT_CASE[measure[2]];

  // A unit spoken or typed apart from its number ("200 g") is still a unit.
  if (UNIT_CASE[corrected] && /^\d+(?:\.\d+)?$/.test(prevWord || "")) return UNIT_CASE[corrected];

  // Vitamin/additive style codes: "b12" → "B12", "d3" → "D3".
  const code = corrected.match(/^([a-z]{1,2})(\d+)$/);
  if (code) return code[1].toUpperCase() + code[2];

  if (!isEdge && MINOR_WORDS.has(corrected)) return corrected;

  // "mcchicken" → "McChicken", "o'brien" → "O'Brien".
  if (/^mc[a-z]{2,}('s)?$/.test(corrected)) return `Mc${capitalize(corrected.slice(2))}`;
  if (/^o'[a-z]{2,}$/.test(corrected)) return `O'${capitalize(corrected.slice(2))}`;

  // Deliberate internal capitals the user typed ("MyProtein") are kept as-is;
  // shouty or all-lowercase input is recased.
  if (corrected === lower && /[a-z][A-Z]/.test(word)) return capitalize(word);

  return capitalize(corrected);
};

/**
 * Formats a food name for storage and display: tidy spacing, sensible capitals,
 * corrected spelling of common typos. Word order and quantities are preserved.
 */
export const formatFoodName = (raw) => {
  if (typeof raw !== "string") return "";

  let text = raw
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    // dictation and hurried typing leave dangling punctuation
    .replace(/[.,;:!?]+$/, "")
    // no space before closing punctuation, always one after a comma
    .replace(/\s+([,;:.!?)])/g, "$1")
    .replace(/([,;:])(?=[^\s])/g, "$1 ")
    .replace(/\(\s+/g, "(")
    .trim();

  if (!text) return "";

  // Split on separators but keep them, so hyphens, slashes and brackets survive.
  const parts = text.split(/([^A-Za-z0-9'&]+)/);
  const wordPositions = new Set();
  parts.forEach((part, i) => {
    if (/[A-Za-z0-9]/.test(part)) wordPositions.add(i);
  });
  const indexes = [...wordPositions];
  const first = indexes[0];
  const last = indexes[indexes.length - 1];

  let prevWord = "";
  text = parts
    .map((part, i) => {
      if (!wordPositions.has(i)) return part;
      const formatted = formatWord(part, i === first || i === last, prevWord);
      prevWord = part.toLowerCase();
      return formatted;
    })
    .join("");

  PHRASES.forEach(([pattern, replacement]) => {
    text = text.replace(pattern, replacement);
  });

  return text;
};

/**
 * The canonical lookup key for a food name — the formatted name, lowercased.
 * Two spellings of the same thing ("Chiken Breast", "chicken breast") collapse
 * onto one cache entry.
 */
export const foodKey = (raw) => formatFoodName(raw).toLowerCase();
