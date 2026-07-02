# Food Search — Stress Test Harness

Tests the live system prompt in `src/features/macroTracker/services/gptService.js` against
real Claude API calls (Claude Sonnet 5) (uses `ANTHROPIC_API_KEY` from the project `.env`; costs a fraction of a
cent per case). The prompt is extracted from the source file at runtime, so any prompt edit
is picked up automatically — edit the prompt, rerun, compare.

## Usage

```bash
node scripts/gpt-stress-test/harness.mjs scripts/gpt-stress-test/cases-round1.mjs results.json
node scripts/gpt-stress-test/harness.mjs <cases> <out.json> --only=vague,fastfood   # subset
node scripts/gpt-stress-test/harness.mjs cases-consistency.mjs out.json --repeat=3  # stability
```

Prints `[ok]/[warn]/[FAIL]` per case plus a failure summary; full raw outputs land in the
results JSON.

## Case suites

- `cases-round1.mjs` — broad sweep: simple foods, multi-food, vague, fast food, Australian,
  branded, obscure, homemade, typos, quantities, units, contradictions, gibberish rejection.
- `cases-round2.mjs` — adversarial: Aussie slang, supplements, alcohol, negation,
  raw/dry/packet traps, emoji, recipes.
- `cases-round3.mjs` — real user behaviour: gym shorthand, voice-to-text, partial consumption,
  plus generalization probes (foods never referenced in the prompt).
- `cases-consistency.mjs` — run with `--repeat=3` to measure output stability.

A case: `{ cat, q, expect: { kcal: [lo, hi], minItems, maxItems, mustError, needsAssumption } }`.
Bounds are deliberately generous — a FAIL means genuinely unreasonable output.

## Refinement policy

Fix failures by improving *reasoning principles* in the prompt (portion logic per food
category, scaling, preparation state), never by hardcoding per-food weights or calorie
values. The food space is infinite; the prompt must generalize.
