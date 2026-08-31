export const UNTITLED = "Untitled recipe";

// First two non-empty lines of the body, used as the list preview.
export const previewOf = (body = "") =>
  body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join("\n");

// "Today" / "Yesterday" / DD/MM/YY — the app's display date format elsewhere.
export const formatUpdated = (timestamp) => {
  const then = new Date(timestamp);
  if (Number.isNaN(then.getTime())) return "";

  const midnight = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayDiff = Math.round((midnight(new Date()) - midnight(then)) / 86400000);
  if (dayDiff === 0) return "Today";
  if (dayDiff === 1) return "Yesterday";

  const d = String(then.getDate()).padStart(2, "0");
  const m = String(then.getMonth() + 1).padStart(2, "0");
  const y = String(then.getFullYear()).slice(-2);
  return `${d}/${m}/${y}`;
};

export const matchesSearch = (recipe, query) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return `${recipe.title}\n${recipe.body}`.toLowerCase().includes(q);
};
