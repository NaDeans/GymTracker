// Round 1: broad sweep across all categories.
// kcal bounds are deliberately generous — a FAIL means genuinely unreasonable.
export const CASES = [
  // 1. Simple whole foods
  { cat: "simple", q: "banana", expect: { kcal: [80, 140], maxItems: 1, needsAssumption: true } },
  { cat: "simple", q: "2 bananas", expect: { kcal: [160, 270] } },
  { cat: "simple", q: "large banana", expect: { kcal: [110, 170], maxItems: 1 } },
  { cat: "simple", q: "chicken breast", expect: { kcal: [220, 340], maxItems: 1, needsAssumption: true } },
  { cat: "simple", q: "300g chicken breast", expect: { kcal: [430, 560], maxItems: 1 } },
  { cat: "simple", q: "avocado", expect: { kcal: [180, 380], maxItems: 1, needsAssumption: true } },
  { cat: "simple", q: "2 eggs", expect: { kcal: [120, 190] } },
  { cat: "simple", q: "1 cup rice", expect: { kcal: [150, 300], maxItems: 1, needsAssumption: true } },
  { cat: "simple", q: "salmon fillet", expect: { kcal: [230, 470], maxItems: 1, needsAssumption: true } },
  { cat: "simple", q: "sweet potato", expect: { kcal: [80, 210], maxItems: 1, needsAssumption: true } },

  // 2. Multi-food entries
  { cat: "multi", q: "banana and protein shake", expect: { minItems: 2, kcal: [190, 450] } },
  { cat: "multi", q: "chicken rice broccoli", expect: { minItems: 3, kcal: [380, 800] } },
  { cat: "multi", q: "steak potato peas", expect: { minItems: 3, kcal: [380, 950] } },
  { cat: "multi", q: "eggs toast avocado coffee", expect: { minItems: 4, kcal: [280, 750] } },
  { cat: "multi", q: "tuna sandwich apple yoghurt", expect: { minItems: 3, kcal: [330, 750] } },

  // 3. Natural human language
  { cat: "natural", q: "had some toast with peanut butter", expect: { kcal: [220, 500] } },
  { cat: "natural", q: "ate half an avocado and 2 eggs this morning", expect: { minItems: 2, kcal: [240, 420] } },
  { cat: "natural", q: "quick lunch was chicken wrap and coke zero", expect: { minItems: 2, kcal: [300, 750] } },
  { cat: "natural", q: "just had sushi for dinner", expect: { kcal: [280, 800], needsAssumption: true } },
  { cat: "natural", q: "grabbed a coffee and muffin on the way to work", expect: { minItems: 2, kcal: [250, 750] } },

  // 4. Vague inputs
  { cat: "vague", q: "pasta", expect: { kcal: [250, 750], needsAssumption: true } },
  { cat: "vague", q: "curry", expect: { kcal: [250, 850], needsAssumption: true } },
  { cat: "vague", q: "burger", expect: { kcal: [350, 850], needsAssumption: true } },
  { cat: "vague", q: "sandwich", expect: { kcal: [230, 650], needsAssumption: true } },
  { cat: "vague", q: "salad", expect: { kcal: [20, 550], needsAssumption: true } },
  { cat: "vague", q: "pizza", expect: { kcal: [180, 1300], needsAssumption: true } },
  { cat: "vague", q: "fried rice", expect: { kcal: [280, 850], needsAssumption: true } },
  { cat: "vague", q: "tacos", expect: { kcal: [280, 850], needsAssumption: true } },
  { cat: "vague", q: "burrito bowl", expect: { kcal: [380, 950], needsAssumption: true } },

  // 5. Restaurant / fast food
  { cat: "fastfood", q: "Big Mac", expect: { kcal: [470, 600], maxItems: 1 } },
  { cat: "fastfood", q: "McChicken", expect: { kcal: [340, 480], maxItems: 1 } },
  { cat: "fastfood", q: "large fries mcdonalds", expect: { kcal: [380, 570], maxItems: 1 } },
  { cat: "fastfood", q: "zinger box KFC", expect: { kcal: [850, 1700] } },
  { cat: "fastfood", q: "quarter pounder meal", expect: { kcal: [850, 1350] } },
  { cat: "fastfood", q: "burrito from guzman y gomez", expect: { kcal: [450, 950], maxItems: 1 } },
  { cat: "fastfood", q: "chipotle bowl", expect: { kcal: [450, 1100] } },
  { cat: "fastfood", q: "subway chicken teriyaki footlong", expect: { kcal: [550, 950], maxItems: 1 } },

  // 6. Australian foods
  { cat: "aussie", q: "meat pie", expect: { kcal: [330, 580], maxItems: 1 } },
  { cat: "aussie", q: "sausage roll", expect: { kcal: [230, 550], maxItems: 1 } },
  { cat: "aussie", q: "weet bix", expect: { kcal: [90, 300] } },
  { cat: "aussie", q: "tim tam", expect: { kcal: [75, 120], maxItems: 1 } },
  { cat: "aussie", q: "chicken parmigiana pub meal", expect: { kcal: [650, 1600] } },
  { cat: "aussie", q: "vegemite toast", expect: { kcal: [70, 260] } },
  { cat: "aussie", q: "bunnings sausage sizzle", expect: { kcal: [280, 600] } },
  { cat: "aussie", q: "coles mud cake", expect: { kcal: [250, 650], needsAssumption: true } },

  // 7. Branded products
  { cat: "brand", q: "quest protein bar", expect: { kcal: [160, 220], maxItems: 1 } },
  { cat: "brand", q: "up and go", expect: { kcal: [160, 360], maxItems: 1 } },
  { cat: "brand", q: "chobani fit yoghurt", expect: { kcal: [90, 210], maxItems: 1 } },
  { cat: "brand", q: "musashi protein bar", expect: { kcal: [180, 420], maxItems: 1 } },
  { cat: "brand", q: "cocobella coconut yoghurt", expect: { kcal: [90, 320], maxItems: 1 } },
  { cat: "brand", q: "bsc protein bar", expect: { kcal: [140, 420], maxItems: 1 } },
  { cat: "brand", q: "fairlife protein shake", expect: { kcal: [130, 250], maxItems: 1 } },
  { cat: "brand", q: "gatorade zero", expect: { kcal: [0, 25], maxItems: 1 } },

  // 8. Obscure foods
  { cat: "obscure", q: "tempeh", expect: { kcal: [140, 380], maxItems: 1 } },
  { cat: "obscure", q: "natto", expect: { kcal: [70, 260], maxItems: 1 } },
  { cat: "obscure", q: "injera", expect: { kcal: [80, 420], maxItems: 1 } },
  { cat: "obscure", q: "kimchi jjigae", expect: { kcal: [130, 500], maxItems: 1 } },
  { cat: "obscure", q: "paneer tikka", expect: { kcal: [220, 650], maxItems: 1 } },
  { cat: "obscure", q: "halva", expect: { kcal: [90, 620], maxItems: 1 } },
  { cat: "obscure", q: "bibimbap", expect: { kcal: [380, 850], maxItems: 1 } },
  { cat: "obscure", q: "ceviche", expect: { kcal: [90, 420], maxItems: 1 } },
  { cat: "obscure", q: "bulgogi", expect: { kcal: [250, 750], maxItems: 1 } },

  // 9. Homemade meals
  { cat: "homemade", q: "homemade lasagna", expect: { kcal: [320, 950] } },
  { cat: "homemade", q: "chicken curry with rice", expect: { kcal: [420, 950] } },
  { cat: "homemade", q: "spaghetti bolognese", expect: { kcal: [380, 950] } },
  { cat: "homemade", q: "beef tacos with guacamole", expect: { kcal: [330, 950] } },
  { cat: "homemade", q: "stir fry noodles with chicken", expect: { kcal: [380, 950] } },

  // 10. Descriptive portion queries
  { cat: "descriptive", q: "bowl of cereal", expect: { kcal: [140, 480] } },
  { cat: "descriptive", q: "big bowl of pasta", expect: { kcal: [450, 1200] } },
  { cat: "descriptive", q: "small protein smoothie", expect: { kcal: [130, 420] } },
  { cat: "descriptive", q: "thick peanut butter sandwich", expect: { kcal: [330, 700] } },
  { cat: "descriptive", q: "large iced latte", expect: { kcal: [90, 380] } },
  { cat: "descriptive", q: "giant burrito", expect: { kcal: [650, 1500] } },
  { cat: "descriptive", q: "tiny slice cheesecake", expect: { kcal: [80, 320] } },

  // 11. Typos / poor grammar
  { cat: "typo", q: "ckicken breast and rise", expect: { minItems: 2, kcal: [330, 750] } },
  { cat: "typo", q: "bananna smoothie", expect: { kcal: [180, 550] } },
  { cat: "typo", q: "protien bar", expect: { kcal: [140, 320], maxItems: 1 } },
  { cat: "typo", q: "2 egg n toast", expect: { minItems: 2, kcal: [180, 420] } },
  { cat: "typo", q: "mcdonald fries larg", expect: { kcal: [380, 570], maxItems: 1 } },

  // 12. Extremely long input
  { cat: "long", q: "today i had a chicken wrap with avocado and cheese then later ate a protein bar and after gym had a banana smoothie with milk and whey protein and then for dinner had steak sweet potato and vegetables", expect: { minItems: 6, kcal: [1700, 3600] } },

  // 13. Minimal inputs
  { cat: "minimal", q: "coffee", expect: { kcal: [0, 160], maxItems: 1, needsAssumption: true } },
  { cat: "minimal", q: "cereal", expect: { kcal: [90, 420], needsAssumption: true } },
  { cat: "minimal", q: "sushi", expect: { kcal: [180, 750], needsAssumption: true } },
  { cat: "minimal", q: "milk", expect: { kcal: [80, 260], maxItems: 1, needsAssumption: true } },
  { cat: "minimal", q: "yoghurt", expect: { kcal: [60, 260], maxItems: 1, needsAssumption: true } },

  // 14. Impossible inputs — MUST reject
  { cat: "impossible", q: "asdfghjkl", expect: { mustError: true } },
  { cat: "impossible", q: "qwertyuiop", expect: { mustError: true } },
  { cat: "impossible", q: "zzzzz xkcd 99999", expect: { mustError: true } },
  { cat: "impossible", q: "hello how are you today", expect: { mustError: true } },
  { cat: "impossible", q: "ran 5km this morning", expect: { mustError: true } },

  // user's spec lists this under impossible inputs — must reject
  { cat: "impossible", q: "food food banana moon x7q2z", expect: { mustError: true } },

  // 15. Quantity edge cases
  { cat: "quantity", q: "700g chicken breast", expect: { kcal: [1000, 1300], maxItems: 1 } },
  { cat: "quantity", q: "half a banana", expect: { kcal: [35, 75], maxItems: 1 } },
  { cat: "quantity", q: "0.25 avocado", expect: { kcal: [35, 100], maxItems: 1 } },
  { cat: "quantity", q: "2.5 scoops whey", expect: { kcal: [230, 420], maxItems: 1 } },
  { cat: "quantity", q: "3 tablespoons peanut butter", expect: { kcal: [240, 330], maxItems: 1 } },
  { cat: "quantity", q: "one bite of cheesecake", expect: { kcal: [15, 130], maxItems: 1 } },
  { cat: "quantity", q: "half a large pizza", expect: { kcal: [450, 1400] } },

  // 16. Mixed units
  { cat: "units", q: "500ml chocolate milk", expect: { kcal: [320, 520], maxItems: 1 } },
  { cat: "units", q: "2 cups rice", expect: { kcal: [300, 560], maxItems: 1 } },
  { cat: "units", q: "1 tbsp olive oil", expect: { kcal: [100, 135], maxItems: 1 } },
  { cat: "units", q: "100g almonds", expect: { kcal: [545, 650], maxItems: 1 } },
  { cat: "units", q: "12oz steak", expect: { kcal: [600, 1100], maxItems: 1 } },
  { cat: "units", q: "3 slices bread", expect: { kcal: [180, 320], maxItems: 1 } },

  // 17. Contradictory inputs — review manually; loose bounds just to see behavior
  { cat: "contradiction", q: "zero calorie protein shake", expect: { kcal: [0, 250] } },
  { cat: "contradiction", q: "fat free avocado", expect: { kcal: [0, 400] } },
  { cat: "contradiction", q: "500g chicken breast with 50 calories", expect: { kcal: [0, 99999] } },

  // 18. Ambiguous
  { cat: "ambiguous", q: "noodles", expect: { kcal: [180, 750], needsAssumption: true } },
  { cat: "ambiguous", q: "stir fry", expect: { kcal: [180, 750], needsAssumption: true } },
];
