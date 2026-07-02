// Consistency probe — run with --repeat=3 and compare kcal spread across reps.
export const CASES = [
  { cat: "consist", q: "chicken and rice", expect: { kcal: [350, 900] } },
  { cat: "consist", q: "big mac", expect: { kcal: [470, 600] } },
  { cat: "consist", q: "banana smoothie", expect: { kcal: [180, 550] } },
  { cat: "consist", q: "chicky nugs 10 pack", expect: { kcal: [350, 580] } },
  { cat: "consist", q: "oats with milk and honey", expect: { kcal: [250, 650] } },
  { cat: "consist", q: "protein shake", expect: { kcal: [100, 350] } },
];
