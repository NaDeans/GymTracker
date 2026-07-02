// Round 2 case set: adversarial — slang, supplements, alcohol, negation, raw/dry traps, emoji, recipes.
export const CASES = [
  // Aussie slang / abbreviations
  { cat: "slang", q: "maccas run large big mac meal", expect: { kcal: [1000, 1600] } },
  { cat: "slang", q: "chicky nugs 10 pack", expect: { kcal: [350, 580] } },
  { cat: "slang", q: "PB&J", expect: { kcal: [280, 560] } },
  { cat: "slang", q: "avo toast", expect: { kcal: [180, 480] } },
  { cat: "slang", q: "brekkie burrito", expect: { kcal: [280, 750] } },
  { cat: "slang", q: "choccy milk 600ml", expect: { kcal: [360, 640] } },
  { cat: "slang", q: "snag in bread", expect: { kcal: [230, 520] } },
  { cat: "slang", q: "servo pie and an iced coffee", expect: { minItems: 2, kcal: [450, 950] } },
  { cat: "slang", q: "schnitty and chips", expect: { kcal: [650, 1600] } },
  { cat: "slang", q: "half strength cap", expect: { kcal: [40, 220] } },

  // Quantity phrasing
  { cat: "qty", q: "1.5 chicken breasts", expect: { kcal: [340, 540] } },
  { cat: "qty", q: "dozen oysters", expect: { kcal: [70, 280] } },
  { cat: "qty", q: "6 nuggets and medium fries", expect: { minItems: 2, kcal: [480, 800] } },
  { cat: "qty", q: "2 slices pepperoni pizza and a garlic bread", expect: { minItems: 2, kcal: [480, 1100] } },
  { cat: "qty", q: "two eggs and three bacon rashers", expect: { minItems: 2, kcal: [240, 700] } },
  { cat: "qty", q: "a couple of tim tams", expect: { kcal: [150, 230] } },
  { cat: "qty", q: "3x eggs", expect: { kcal: [170, 290] } },
  { cat: "qty", q: "eggs (3)", expect: { kcal: [170, 290] } },

  // Drinks / alcohol
  { cat: "drinks", q: "glass of red wine", expect: { kcal: [90, 190], maxItems: 1 } },
  { cat: "drinks", q: "pint of beer", expect: { kcal: [140, 290], maxItems: 1 } },
  { cat: "drinks", q: "schooner of pale ale", expect: { kcal: [90, 260], maxItems: 1 } },
  { cat: "drinks", q: "vodka soda", expect: { kcal: [55, 160], maxItems: 1 } },
  { cat: "drinks", q: "bubble tea", expect: { kcal: [180, 550], maxItems: 1 } },
  { cat: "drinks", q: "long black", expect: { kcal: [0, 20], maxItems: 1 } },
  { cat: "drinks", q: "200ml orange juice", expect: { kcal: [65, 120], maxItems: 1 } },

  // Supplements / zero-cal — must NOT error
  { cat: "supps", q: "scoop of whey in water", expect: { kcal: [85, 170] } },
  { cat: "supps", q: "5g creatine", expect: { kcal: [0, 30] } },
  { cat: "supps", q: "pre workout", expect: { kcal: [0, 60] } },
  { cat: "supps", q: "sugar free red bull", expect: { kcal: [0, 20] } },
  { cat: "supps", q: "diet coke", expect: { kcal: [0, 10] } },
  { cat: "supps", q: "water", expect: { kcal: [0, 5] } },

  // Negation
  { cat: "negation", q: "burger without the bun", expect: { kcal: [180, 520] } },
  { cat: "negation", q: "pizza no cheese", expect: { kcal: [140, 850] } },
  { cat: "negation", q: "salad no dressing", expect: { kcal: [10, 160] } },

  // Raw / dry / packet traps
  { cat: "trap", q: "250g raw chicken breast", expect: { kcal: [240, 330], maxItems: 1 } },
  { cat: "trap", q: "100g dry rice", expect: { kcal: [330, 400], maxItems: 1 } },
  { cat: "trap", q: "100g cooked rice", expect: { kcal: [105, 165], maxItems: 1 } },
  { cat: "trap", q: "2 minute noodles", expect: { kcal: [270, 560] } },
  { cat: "trap", q: "mi goreng", expect: { kcal: [300, 560] } },
  { cat: "trap", q: "half a rotisserie chicken", expect: { kcal: [450, 1150] } },
  { cat: "trap", q: "footlong meatball sub", expect: { kcal: [750, 1250] } },
  { cat: "trap", q: "whole block of chocolate", expect: { kcal: [450, 1400] } },

  // AU brands round 2
  { cat: "brand2", q: "boost juice mango magic", expect: { kcal: [230, 560], maxItems: 1 } },
  { cat: "brand2", q: "hungry jacks whopper", expect: { kcal: [520, 780], maxItems: 1 } },
  { cat: "brand2", q: "red rooster quarter chicken and chips", expect: { minItems: 2, kcal: [550, 1300] } },
  { cat: "brand2", q: "oporto bondi burger", expect: { kcal: [380, 720], maxItems: 1 } },
  { cat: "brand2", q: "zambrero small chicken burrito", expect: { kcal: [330, 680], maxItems: 1 } },

  // Messy human input
  { cat: "messy", q: "idk maybe like some chips or whatever", expect: { kcal: [130, 750] } },
  { cat: "messy", q: "late night snack: bowl of ice cream", expect: { kcal: [180, 550] } },
  { cat: "messy", q: "i was naughty today... whole block of chocolate", expect: { kcal: [450, 1400] } },
  { cat: "messy", q: "🍕🍕", expect: { kcal: [250, 900] } },
  { cat: "messy", q: "pollo con arroz", expect: { kcal: [330, 950] } },

  // Recipe-style with explicit weights
  { cat: "recipe", q: "500g beef mince 1 onion 2 cans crushed tomatoes 250g dry pasta", expect: { minItems: 4, kcal: [1400, 2800] } },
  { cat: "recipe", q: "meal prep: 150g chicken 100g cooked rice 100g broccoli", expect: { minItems: 3, kcal: [330, 500] } },
];
