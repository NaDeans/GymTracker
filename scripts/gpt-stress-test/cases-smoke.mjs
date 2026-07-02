// Minimal smoke set (~8 calls) — quick sanity check after model/prompt changes.
export const CASES = [
  { cat: "smoke", q: "300g chicken breast", expect: { kcal: [430, 560], maxItems: 1 } },
  { cat: "smoke", q: "chicken rice broccoli", expect: { minItems: 3, kcal: [380, 800] } },
  { cat: "smoke", q: "big mac", expect: { kcal: [470, 600], maxItems: 1 } },
  { cat: "smoke", q: "spaghetti bolognese", expect: { kcal: [380, 950] } },
  { cat: "smoke", q: "half a banana", expect: { kcal: [35, 75], maxItems: 1 } },
  { cat: "smoke", q: "2 scoops whey", expect: { kcal: [190, 320], maxItems: 1 } },
  { cat: "smoke", q: "coles mud cake", expect: { kcal: [250, 650] } },
  { cat: "smoke", q: "asdfghjkl", expect: { mustError: true } },
];
