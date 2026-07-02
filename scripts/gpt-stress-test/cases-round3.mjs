// Round 3 case set: real user behaviour (gym shorthand, voice-to-text, partial consumption)
// + generalization probes: foods never referenced in the prompt or earlier tests.
export const CASES = [
  // Gym shorthand
  { cat: "gym", q: "250g 5 star mince", expect: { kcal: [280, 480], maxItems: 1 } },
  { cat: "gym", q: "2 scoops whey", expect: { kcal: [190, 320], maxItems: 1 } },
  { cat: "gym", q: "protein oats", expect: { kcal: [250, 700] } },
  { cat: "gym", q: "cutting wrap", expect: { kcal: [200, 600] } },
  { cat: "gym", q: "bulking shake", expect: { kcal: [400, 1300] } },

  // Voice-to-text messy
  { cat: "voice", q: "uh had like chicken rice and maybe half an avo", expect: { minItems: 3, kcal: [400, 1000] } },
  { cat: "voice", q: "ate like 2 eggs toast coffee this morning", expect: { minItems: 3, kcal: [180, 480] } },
  { cat: "voice", q: "had some pasta after gym with chicken", expect: { minItems: 1, kcal: [400, 1050] } },

  // Incomplete single words
  { cat: "incomplete", q: "protein shake", expect: { kcal: [100, 350], maxItems: 1 } },
  { cat: "incomplete", q: "chicken", expect: { kcal: [180, 420], maxItems: 1 } },
  { cat: "incomplete", q: "rice", expect: { kcal: [150, 400], maxItems: 1 } },
  { cat: "incomplete", q: "mince", expect: { kcal: [200, 650], maxItems: 1 } },
  { cat: "incomplete", q: "wrap", expect: { kcal: [250, 650], maxItems: 1 } },
  { cat: "incomplete", q: "toast", expect: { kcal: [60, 280] } },

  // Mixed branded + generic
  { cat: "mixed", q: "musashi protein bar and banana", expect: { minItems: 2, kcal: [280, 600] } },
  { cat: "mixed", q: "bsc bar and iced coffee", expect: { minItems: 2, kcal: [230, 650] } },
  { cat: "mixed", q: "big mac and fries", expect: { minItems: 2, kcal: [700, 1250] } },
  { cat: "mixed", q: "2 weet bix with milk and honey", expect: { minItems: 2, kcal: [200, 480] } },

  // Partial consumption
  { cat: "partial", q: "half muffin", expect: { kcal: [100, 320], maxItems: 1 } },
  { cat: "partial", q: "quarter pizza", expect: { kcal: [180, 550] } },
  { cat: "partial", q: "one bite cheesecake", expect: { kcal: [15, 130], maxItems: 1 } },
  { cat: "partial", q: "2 spoon peanut butter", expect: { kcal: [130, 260], maxItems: 1 } },
  { cat: "partial", q: "half protein bar", expect: { kcal: [70, 160], maxItems: 1 } },

  // Typos (regression)
  { cat: "typo2", q: "protien bar", expect: { kcal: [140, 320], maxItems: 1 } },
  { cat: "typo2", q: "bananna smoothie", expect: { kcal: [180, 550] } },
  { cat: "typo2", q: "ckicken breast", expect: { kcal: [200, 380], maxItems: 1 } },
  { cat: "typo2", q: "mcdonald fries larg", expect: { kcal: [380, 570], maxItems: 1 } },

  // Long input
  { cat: "long2", q: "today i had eggs toast coffee then chicken wrap then protein bar then steak and vegetables for dinner", expect: { minItems: 6, kcal: [1150, 2600] } },

  // Generalization probes — foods never referenced anywhere in prompt/tests
  { cat: "general", q: "grilled kangaroo fillet", expect: { kcal: [140, 400], maxItems: 1 } },
  { cat: "general", q: "venison steak", expect: { kcal: [180, 480], maxItems: 1 } },
  { cat: "general", q: "dragonfruit", expect: { kcal: [40, 160], maxItems: 1 } },
  { cat: "general", q: "quinoa buddha bowl", expect: { kcal: [350, 850], maxItems: 1 } },
  { cat: "general", q: "okonomiyaki", expect: { kcal: [350, 900], maxItems: 1 } },
  { cat: "general", q: "lamb rogan josh with naan", expect: { minItems: 2, kcal: [550, 1300] } },
  { cat: "general", q: "acai bowl", expect: { kcal: [250, 700], maxItems: 1 } },
  { cat: "general", q: "pork banh mi", expect: { kcal: [400, 800], maxItems: 1 } },
  { cat: "general", q: "3 arancini balls", expect: { kcal: [250, 820], maxItems: 1 } },
  { cat: "general", q: "seaweed snack pack", expect: { kcal: [10, 100], maxItems: 1 } },
  { cat: "general", q: "persimmon", expect: { kcal: [50, 180], maxItems: 1 } },
  { cat: "general", q: "duck pancakes", expect: { kcal: [250, 800] } },
];
