# HSPSEM_Agent1C.gs — deep-test fixes (2026-08-29)

`clasp push` is classifier-blocked for Claude, so the fixed file is
`HSPSEM_Agent1C.FIXED.gs` in this folder. To deploy: open the bound project
(COMPASS_HSPSE → Extensions → Apps Script), open **HSPSEM_Agent1C.gs**,
Ctrl+A, Ctrl+V from the FIXED file, save. Then tell Claude and it resumes the test.

Syntax-checked with `node --check`. Four small, additive changes — no existing
logic removed. Diff summary:

## 1 — Gemini circuit-breaker (fixes: Agent1C 6-minute timeout)

**New, right after `var _narrativeCache = {};`:**

```js
var A1C_GEMINI_MAX_FAILURES = 2;
var _a1cGeminiFailures = 0;
function a1c_geminiTripped_() { return _a1cGeminiFailures >= A1C_GEMINI_MAX_FAILURES; }
function a1c_geminiFailed_()  {
  _a1cGeminiFailures++;
  if (a1c_geminiTripped_()) {
    Logger.log('Agent1C: Gemini circuit-breaker TRIPPED after ' + _a1cGeminiFailures +
      ' failure(s) — using static leadership narratives for the rest of this run.');
  }
}
```

**In `a1c_buildLeadershipNarrative()`** — one line after the cache check:
`if (a1c_geminiTripped_()) return '';`
and `a1c_geminiFailed_();` as the first line of its `catch`.

**In `a1c_fetchBatchNarratives_()`** — `if (a1c_geminiTripped_()) return {};` right
before the `try { var response = callGemini(...) }`, and `a1c_geminiFailed_();`
as the first line of its `catch`.

*Why:* `callGemini()` sleeps 13 s per call, even on a failure. The per-unit
narrative fallback fires once per zone/district/mission — ~38 calls at full
scale, ≈ 8 min of sleeps, past the 6-minute execution cap. After 2 Gemini
failures the breaker trips and every later narrative call returns immediately;
`a1c_pickRelevantLeadershipMsg_()`'s static `_LEADERSHIP_MSGS` block (which
already renders unconditionally) carries the leadership narrative.

## 2 — Skip the President and no-data areas (fixes: 118-send fan-out, President scolded)

**In `runAgent1C()`'s send loop**, right after `var person = peopleMap[email];`:

```js
if ((person.roles || []).some(function(r) { return r.type === 'MP'; })) return;
var a1cReported = (person.areas || []).some(function(a) { return !!areas[a]; });
if (!a1cReported && !(person.roles && person.roles.length)) return;
```

and the personal-letter send (`a1c_buildSubject` / `a1c_buildEmail` /
`sendEmail` / `emailsSent++`) is wrapped in `if (a1cReported) { ... }`.

*Why:* `a1c_buildPeopleMap()` builds a recipient for every `Companion1_Email`
in MISSION_ORG — all ~80 area mailboxes plus the President's row (A000,
`Is_MP=TRUE`). With this guard the President never gets a coaching letter, and a
companionship whose area is not in this week's coaching data (`areas`, from
A1B_DATA) gets no "0/7 días reportados" letter. Leaders still get their
zone/district rollup regardless of their own area's reporting.

## Expected effect on the next test run

- Agent1C completes well under 6 minutes even if Gemini errors.
- ~7 personal letters (the areas that reported) + the leader reports for their
  zones/districts — on the order of 10-15 `[TEST]` emails, not ~118.
- FEEDBACK_HISTORY and WEEKLY_BREAKDOWNS get written; an AGENT_RUN_LOG row appears.
