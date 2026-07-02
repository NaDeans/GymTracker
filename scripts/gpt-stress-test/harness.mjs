// Stress-test harness for GymTracker food search (Claude Haiku 4.5).
// Extracts the LIVE system prompt + output schema from gptService.js so prompt edits are picked
// up automatically, replicates the exact API call + normalization, runs a case file, evaluates,
// writes results JSON.
//
// Usage: node harness.mjs <cases-file.mjs> <results-out.json> [--only=cat1,cat2] [--repeat=N]

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// repo root = two levels up from scripts/gpt-stress-test/
const PROJECT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

// ---- load API key ----
const env = readFileSync(resolve(PROJECT, ".env"), "utf8");
const apiKey = env.match(/ANTHROPIC_API_KEY\s*=\s*(\S+)/)?.[1];
if (!apiKey || apiKey === "your_key_here") throw new Error("No ANTHROPIC_API_KEY in .env");

// ---- extract live system prompt (first one = text search) and output schema ----
const svc = readFileSync(resolve(PROJECT, "src/features/macroTracker/services/gptService.js"), "utf8");
const promptMatch = svc.match(/const systemPrompt = `([\s\S]*?)`;/);
if (!promptMatch) throw new Error("Could not extract systemPrompt from gptService.js");
const systemPrompt = promptMatch[1];

const schemaMatch = svc.match(/const NUTRITION_SCHEMA = (\{[\s\S]*?\n\});/);
if (!schemaMatch) throw new Error("Could not extract NUTRITION_SCHEMA from gptService.js");
const NUTRITION_SCHEMA = new Function(`return ${schemaMatch[1]}`)();

// ---- replicate gptUtils normalization ----
const formatName = (name) => {
  if (!name || typeof name !== "string") return "";
  return name.trim().toLowerCase().split(" ").filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
};

const normalizeAndValidateItem = (i) => {
  const protein = Number(i.protein_g ?? i.protein ?? 0);
  const carbs = Number(i.carbs_g ?? i.carbs ?? 0);
  const fats = Number(i.fat_g ?? i.fats ?? 0);
  const amount_g = i.amount_g != null ? Number(i.amount_g) : null;
  const rawCals = Number(i.calories_kcal ?? i.calories ?? 0);
  const calories = rawCals > 0 ? Math.round(rawCals) : Math.round(protein * 4 + carbs * 4 + fats * 9);
  return { name: formatName(i.name), amount_g, calories, protein, carbs, fats,
    assumption: i.assumption?.trim() ? i.assumption : null };
};

// ---- single query, mirrors fetchNutritionFromGPT semantics (Claude Sonnet 5) ----
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function query(input) {
  let response;
  for (let attempt = 0; ; attempt++) {
    let res;
    try {
      res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5",
          max_tokens: 16000,
          output_config: {
            format: { type: "json_schema", schema: NUTRITION_SCHEMA },
          },
          system: systemPrompt,
          messages: [{ role: "user", content: input }],
        }),
      });
    } catch (e) {
      if (attempt < 8) { await sleep(5000); continue; }
      return { status: "transport_error", error: String(e) };
    }
    try {
      response = await res.json();
    } catch (e) {
      if (attempt < 8) { await sleep(3000); continue; }
      return { status: "transport_error", error: String(e) };
    }
    // retry rate limits, overloads, and 5xx
    if ((res.status === 429 || res.status >= 500) && attempt < 8) {
      await sleep(5000 + Math.random() * 5000);
      continue;
    }
    break;
  }
  if (response.error) return { status: "api_error", error: response.error.message };
  if (response.stop_reason === "refusal") return { status: "refusal" };
  const rawText = response.content?.find((b) => b.type === "text")?.text;
  if (!rawText) return { status: "app_error", error: "No response from Claude" };
  let parsed;
  try {
    parsed = JSON.parse(rawText.replace(/```json/g, "").replace(/```/g, "").trim());
  } catch {
    return { status: "app_error", error: "Failed to parse model JSON output", rawText };
  }
  // app throws "No nutrition items returned" when items missing/empty -> user-visible error
  if (!parsed.items || parsed.items.length === 0) return { status: "rejected" };
  if (!Array.isArray(parsed.items)) return { status: "app_error", error: "Invalid model output", rawText };
  return { status: "ok", items: parsed.items.map(normalizeAndValidateItem) };
}

// ---- evaluation ----
function evaluate(c, r) {
  const problems = [];
  const warns = [];
  if (c.expect.mustError) {
    if (r.status !== "rejected") problems.push(`expected REJECT but got ${r.status}${r.items ? ": " + r.items.map(i => i.name).join(", ") : ""}`);
    return { problems, warns };
  }
  if (r.status !== "ok") {
    problems.push(`expected result but got ${r.status}${r.error ? " (" + r.error + ")" : ""}`);
    return { problems, warns };
  }
  const total = r.items.reduce((s, i) => s + i.calories, 0);
  const [lo, hi] = c.expect.kcal ?? [null, null];
  if (lo != null && (total < lo || total > hi)) problems.push(`total ${total} kcal outside [${lo}, ${hi}]`);
  if (c.expect.minItems != null && r.items.length < c.expect.minItems) problems.push(`only ${r.items.length} items, expected >= ${c.expect.minItems}`);
  if (c.expect.maxItems != null && r.items.length > c.expect.maxItems) problems.push(`${r.items.length} items, expected <= ${c.expect.maxItems}`);
  for (const it of r.items) {
    if (it.amount_g == null || it.amount_g <= 0) warns.push(`"${it.name}" has amount_g=${it.amount_g}`);
    // 4/4/9 sanity: flag wild deviation (possible hallucination). Skip low-cal items.
    const est = it.protein * 4 + it.carbs * 4 + it.fats * 9;
    if (it.calories >= 60 && est > 0) {
      const dev = Math.abs(it.calories - est) / Math.max(it.calories, est);
      if (dev > 0.45) warns.push(`"${it.name}" kcal ${it.calories} vs 4/4/9 est ${Math.round(est)} (dev ${(dev * 100).toFixed(0)}%)`);
    }
  }
  if (c.expect.needsAssumption && r.items.every(i => !i.assumption)) warns.push("no assumption stated despite inferred portion");
  return { problems, warns };
}

// ---- runner ----
const [casesFile, outFile] = process.argv.slice(2);
const onlyArg = process.argv.find(a => a.startsWith("--only="))?.slice(7)?.split(",");
const repeat = Number(process.argv.find(a => a.startsWith("--repeat="))?.slice(9) ?? 1);
const { CASES } = await import("file://" + resolve(casesFile));
let cases = onlyArg ? CASES.filter(c => onlyArg.includes(c.cat)) : CASES;
if (repeat > 1) cases = cases.flatMap(c => Array.from({ length: repeat }, (_, k) => ({ ...c, rep: k + 1 })));

const CONCURRENCY = 4;
const results = new Array(cases.length);
let idx = 0;
async function worker() {
  while (idx < cases.length) {
    const my = idx++;
    const c = cases[my];
    let r;
    try { r = await query(c.q); } catch (e) { r = { status: "app_error", error: String(e) }; }
    const ev = evaluate(c, r);
    results[my] = { ...c, result: r, ...ev };
    const flag = ev.problems.length ? "FAIL" : ev.warns.length ? "warn" : "ok  ";
    process.stdout.write(`[${flag}] (${c.cat}) ${c.q.slice(0, 60)}\n`);
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

writeFileSync(resolve(outFile), JSON.stringify(results, null, 1));

// ---- summary ----
const fails = results.filter(r => r.problems.length);
const warnsOnly = results.filter(r => !r.problems.length && r.warns.length);
console.log(`\n===== ${results.length} cases | ${fails.length} FAIL | ${warnsOnly.length} warn =====\n`);
for (const f of fails) {
  console.log(`FAIL (${f.cat}) "${f.q}"${f.rep ? " [rep " + f.rep + "]" : ""}`);
  for (const p of f.problems) console.log(`   - ${p}`);
  if (f.result.items) for (const i of f.result.items)
    console.log(`   > ${i.name} ${i.amount_g}g ${i.calories}kcal P${i.protein} C${i.carbs} F${i.fats} | ${i.assumption ?? "no assumption"}`);
}
for (const w of warnsOnly) {
  console.log(`warn (${w.cat}) "${w.q}": ${w.warns.join("; ")}`);
}
