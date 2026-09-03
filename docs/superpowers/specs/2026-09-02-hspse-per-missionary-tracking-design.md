# HSPSE — Per-Missionary Tracking Design

**Date:** 2026-09-02
**Status:** DESIGN — brainstormed with the tech missionary 2026-09-02; not yet
implemented. Implementation plan to be produced by `superpowers:writing-plans`.
**Driver:** `ONBOARDING_READINESS.md` §1 — "Both per-missionary AND per-area at
launch" is a hard requirement from the mission president. Meeting with the
president 2026-09-05.

---

## 1. Context and the corrected premise

`ONBOARDING_READINESS.md` §2 and §4 assume per-missionary tracking is a
**port** of "Provo main's per-missionary layer" into the CCSM fork. **That
premise is wrong and was verified wrong on 2026-09-02 by reading Provo main
directly** (`C:\Users\2011794-MTS\Desktop\PMG-Compass`):

- Provo's nightly form asks *"What is your area?"*, never *"Who are you?"*.
- `DAILY_LOG` is keyed by **area + date**. Metrics for an area/date are summed
  across submissions.
- `SCORES.Missionary_Names` is a display label only — literally
  `Companion1_Name & Companion2_Name` joined (`docs/AgentScores.gs:929-937`).
- The "Find by missionary" control in `app/components/scope_selector.py` is a
  **lookup shortcut**: pick a name → it jumps the area selector to that
  missionary's current area. Its own docstring says "a lookup, not a filter".

So per-missionary metric tracking has **never existed in any of the three
missions** (Provo, CCSM, HSPSE). This is net-new, not a port.

## 2. Decided scope (from the 2026-09-02 brainstorm)

Three questions were answered by the tech missionary, reading the president's
intent:

1. **What does "per-missionary" mean?** → *Individual metric numbers* — the
   president wants to see numbers attributed to each missionary, not only to
   areas.
2. **How is companionship work handled?** (two elders teach one lesson
   together) → *Both companions show the area's numbers.* The nightly report
   stays **one submission per area**. No per-person data entry. "Individual"
   means a per-person **view** of the shared area numbers. This keeps it a
   presentation layer — `DAILY_LOG`, the forms, and scoring are unchanged.
3. **Current area only, or stitched across areas over time?** → *Stitched
   across areas (mission history).* A missionary's view is a timeline: the
   areas they've served in, with each area's numbers for the weeks they were
   assigned there.

**Explicitly out of scope:** per-missionary data entry, per-missionary
scoring, per-missionary coaching letters, splitting joint metrics between
companions.

## 3. The launch-timing fact that shrinks this

- The mission's nightly reporting starts **2026-09-09**.
- The first transfer is **2026-10-21** (`TRANSFER_SCHEDULE`).
- Therefore **there is no history to backfill.** Between 09-09 and 10-21 every
  missionary has exactly one area assignment. The cross-area timeline is
  trivial until the first transfer and only becomes interesting on 10-21.

This means the history mechanism must be **in place from launch so it
accumulates correctly**, but it produces near-trivial output for the first six
weeks. The Saturday demo shows the per-missionary view with a single
assignment per missionary — which is correct, not a limitation.

## 4. Two-phase split

### Phase 1 — Per-missionary view (dashboard only, no live infrastructure)

Everything here is Python in `dashboard/`, local, reversible, unit-testable,
and touches **nothing** in Google / Apps Script / the live sheet.

- **Missionary roster, derived (not a new stored table).** The roster is
  `MISSION_ORG`'s `Companion1_Name` / `Companion2_Name` columns, already
  populated (164 teaching missionaries per `roster_staging/`). A new query
  `get_missionary_roster()` melts `MISSION_ORG` into one row per
  (missionary, area) with the area's zone/district and leadership flags.
- **Per-missionary page.** A new Spanish page, `pages/NN_Misioneros.py`
  (English base name in code comments; the file name follows the existing
  Spanish-filename convention — see `pages/12_Traslados.py`). It lets you pick
  a missionary and shows that missionary's **current area's** numbers, reusing
  the existing metric-display components (the same ones
  `04_Desgloses.py` / `06_Puntajes.py` render). Both companions in an area
  show identical numbers, by design.
- **Reuse, don't reinvent, the picker.** `scope_selector.py` already builds
  the `comp_to_area` map and the "Find by missionary" selectbox. Phase 1
  promotes that from a shortcut on other pages to the primary control on this
  page. Consider extracting the missionary→area resolution into a small shared
  helper so the page and `scope_selector` share one implementation.
- **i18n.** All new UI strings go through `app/i18n/es.py` (and the English
  base). `MISSION_LANGUAGE=ES` for HSPSE, so the page renders Spanish by
  default; the bilingual toggle must keep working (`test_renders_spanish.py`).

### Phase 2 — Assignment history (needs Apps Script + live sheet; later)

- **New append-only tab `MISSIONARY_ASSIGNMENTS`** in `COMPASS_HSPSE`:
  `Missionary_Name | Area_Code | Area_Name | Zone | District | Start_Date |
  End_Date | Transfer_Number | Recorded_At`. One row per missionary per
  area-stint. `End_Date` blank = current assignment.
- **Written by the transfer flow.** When a transfer is applied (see
  `HSPSEM_TransferHelpers.gs`, `HSPSEM_AddTransferTabs.gs` — note there is
  already a `MISSION_ORG_SNAPSHOT` tab and a `TRANSFER_LOG`), the agent
  closes out the affected missionaries' open rows (`End_Date` = transfer date
  − 1) and opens new rows for their new areas. A one-time seeding routine
  writes the initial open rows for all 164 missionaries at launch
  (`Start_Date` = `SYSTEM_START_DATE`).
- **Dashboard stitches the timeline.** `get_missionary_history(name)` returns
  the assignment rows; for each stint the page pulls that area's `DAILY_LOG` /
  `WEEKLY_KI` numbers restricted to `[Start_Date, End_Date]` and concatenates
  them into one per-missionary timeline with subtotals per area and a mission
  total.
- **Backfill:** none needed (see §3). The seeding routine + forward
  accumulation is the whole history.

Phase 2's `.gs` changes are inert until pasted into the live Apps Script
editor (the project's Gotcha 1) and must be confirmed with the tech
missionary before pasting, per the repo's production boundary.

## 5. Saturday deliverable (realistic)

- **Phase 1 running locally** in both languages, showing per-missionary
  numbers for the current area, from real (or seeded-test) `MISSION_ORG` +
  `DAILY_LOG` data.
- **Phase 2 designed** (this document) with the `MISSIONARY_ASSIGNMENTS`
  schema and the transfer-hook described, presented to the president as "the
  timeline builds itself from day one; you'll see the first multi-area view
  after the 21 October transfer."
- What the meeting **cannot** promise: a fully live per-missionary view inside
  `COMPASS_HSPSE` with cross-area history working end to end. That depends on
  live-account work that is currently blocked (the HSPSE Google account is not
  reachable from the tech missionary's current session).

## 6. Components and boundaries

| Unit | Responsibility | Depends on | New? |
|---|---|---|---|
| `get_missionary_roster()` | melt `MISSION_ORG` → (missionary, area, zone, district, flags) | `get_areas_df` / `get_submitting_areas` | new, `dashboard/app/db/queries.py` |
| missionary→area resolver | one name → current area (+ zone/district) | roster | extract from `scope_selector.py` |
| `pages/NN_Misioneros.py` | the per-missionary page | roster, resolver, existing metric components | new |
| i18n keys | Spanish + English strings for the page | `app/i18n` | new keys only |
| `get_missionary_history()` | assignment rows for a name | `MISSIONARY_ASSIGNMENTS` tab | **Phase 2** |
| `MISSIONARY_ASSIGNMENTS` tab + writer | append-only assignment log | transfer flow | **Phase 2**, `.gs` |

**Hard boundaries:**
- Never touch `..\CCSM PMG Compass\` — live production for a different mission.
- Never touch Provo main (`C:\Users\2011794-MTS\Desktop\PMG-Compass`) except
  read-only for reference.
- No `.gs` file change takes effect live without a manual paste — Phase 2
  `.gs` edits are code-only until the tech missionary pastes them.
- Phase 1 must not require `secrets.toml` to exist to run its **tests** (the
  suite already has ~76 failures from the missing HSPSE `secrets.toml`; new
  tests must use fixtures / `AppTest` the way the passing tests do, not a live
  Sheets connection).

## 7. Testing

- **Phase 1:** unit tests for `get_missionary_roster()` (melt correctness,
  blank-companion handling, leadership flags carried through) and an `AppTest`
  render test for `pages/NN_Misioneros.py` in **both** languages, following
  the pattern in `tests/test_renders_spanish.py` and
  `tests/test_renders_ccsm_with_data.py`. Render-with-data, not empty
  fixtures.
- **Phase 2:** unit tests for `get_missionary_history()` timeline stitching
  (single stint; two stints across a transfer; open-ended current stint;
  a missionary who left the mission), and a `.gs` offline test for the
  assignment-writer using the repo's `vm`-sandbox stub pattern (see
  `tests/gas_stubs.js`, and the memory note on `.gs vm-Sandbox Offline
  Test`) — noting that the whole `tests/*.js` suite currently ENOENTs on
  CCSM filenames and needs its own separate port (`HSPSEM_DEPLOYMENT.md`
  "What this runbook could not verify" #5).

## 8. Open questions (do not block Phase 1; resolve before Phase 2 / with the president)

1. **Missionaries not in `MISSION_ORG`** — the president, APs, office staff,
   senior couples. Included in the roster or filtered out? (Lean: filter to
   teaching missionaries only for the per-missionary view.)
2. **Identity key.** Names are not unique and change spelling. Phase 2's
   `MISSIONARY_ASSIGNMENTS` keys on `Missionary_Name` for now; is there an
   IMOS missionary ID we should carry instead? (`roster_staging/` may have
   one — check before Phase 2.)
3. **Companionships of 3–4** (`Companion3_Name`, `Companion4_Name` exist in
   the transfer tabs). Roster melt must handle them; the metric attribution
   rule ("everyone in the area shows the area's numbers") already covers it.
4. **Weekly KIs** — same "both companions show the area's number" rule, or
   are weekly KIs area-only in the per-missionary view? (Lean: same rule.)
