# HSPSE — Saturday 2026-09-05 Readiness

**Assembled 2026-09-02** from two working sessions. Supersedes the stale
"PRE-BUILD" language in `HSPSEM_DEPLOYMENT.md` / `ONBOARDING_READINESS.md` —
those docs were written before the 2026-08-29 build and never updated.

---

## TL;DR — what Saturday can honestly show

| Thing | State |
|---|---|
| The Apps Script system (sheet, 21 agents, forms) | **Built and deep-tested 8/29**, `TEST_MODE=TRUE`, zero triggers. Not verifiable from the current machine — the `hspsem.pmg.compass@gmail.com` account is not signed into this Chrome. |
| The Spanish dashboard | Runs locally. Test suite: **321 pass / 9 fail / 1 skip** — the 9 are pre-existing CCSM-fork issues, not regressions. Not deployed (no Streamlit Cloud app yet). |
| Per-missionary tracking | **Phase 1 built** (branch `feat/per-missionary-phase1`, unmerged). Phase 2 designed. See §4. |
| Go-live on 9/9 | Still has 4 open blockers — see §5. |

**The per-missionary message for the president** (he expects to see it — user
confirmed): *"Individual numbers are in. Every missionary now has their own
view showing their area's numbers. When transfers start on 21 October, that
view becomes a full mission timeline — one screen per missionary covering
every area they serve in. The tracking runs from day one; there's just
nothing to stitch together until the first transfer."*

---

## 1. System state (verified against session memory, not the stale docs)

- **Sheet `COMPASS_HSPSE`** = `15xj7bQxa1dZ-xERuGw8wU7PneRXpmCQP1hycaR2gE0s`, 27
  tabs, owner `hspsem.pmg.compass@gmail.com`, project timezone
  `America/Tegucigalpa` (fixed 8/29).
- **Bound Apps Script "COMPASS_HSPSE Agents"** =
  `1zclCJcs4-wtNrBH7dYZJl1DukA00sR9EvzAgrrCHO4FpdGgYVRcZGIYl`, 21 files pushed
  via clasp, on commit `891084a`'s fixes. Seeders run: MESSAGE_BANK 121,
  KNOWLEDGE_BASE 10, SCORE_CONFIG 18.
- **4 Google Forms** live and linked (Nightly, Weekly, Q&A, Milagros).
  `AGENT_CONFIG` `NIGHTLY_FORM_LINK` / `WEEKLY_FORM_LINK` set.
- **Safety:** `TEST_MODE=TRUE`, **zero triggers**. Every send redirects to the
  hspsem inbox with `[TEST]`. This was proven end-to-end on 8/29 (0 emails to
  any real `@missionary.org` / `@churchofjesuschrist.org` address after
  running the full agent chain).
- **Deep test** ran 8/29, paused at Phase 11 (teardown of seed data). Safety
  model proven; the coaching chain surfaced the Agent1C blocker below.

## 2. Original handoff checklist — status

| # | Item | Status |
|---|---|---|
| 1 | Confirm live deployment state | **BLOCKED** — needs the `hspsem` account signed into Chrome. Run `smokeTestPipeline()`, check triggers, `previewNightlyEscalation()` etc. |
| 2 | Re-pull live `QUESTIONS_CONFIG` snapshot | **BLOCKED** — `tests/live/live_form_headers.json` is actually *CCSM's* snapshot (the whole `tests/*.js` suite is CCSM's, unmodified). Needs `dashboard/tools/probe_live.py` against the live HSPSE sheet, i.e. the GCP service account (item 3). |
| 3 | Provision dashboard Google credentials | **BLOCKED** — no `dashboard/.streamlit/secrets.toml` for HSPSE. Needs a new GCP project + service account + JSON key (do NOT reuse CCSM's `gen-lang-client-0214221824`). Clears ~67 of the masked test failures. |
| 4 | Dashboard running + deployable | **PARTIAL** — runs locally (with a dev-only `secrets.toml`, see below). No GitHub repo, no Streamlit Cloud app yet. |
| 5 | Per-missionary tracking | **Phase 1 DONE**, Phase 2 designed — see §4. |

## 3. Dashboard test state

- Baseline (2026-09-02): 232 pass / 76 fail. All 76 were
  `FileNotFoundError: No secrets found` — `require_auth()` blows up on every
  page when `dashboard/.streamlit/secrets.toml` is absent.
- A **local-only** `dashboard/.streamlit/secrets.toml` was added (contents:
  `STREAMLIT_DEV_EMAIL = "dev@example.com"` — no real credentials). It is
  gitignored two ways (`.git/info/exclude` + the untracked `.gitignore`),
  `git check-ignore` confirms it, and `test_sso_viewer.py` guards that the
  dev-bypass key can't reach the deploy template. **This file must never be
  pasted into Streamlit Cloud's secrets box** (see
  `reference-streamlit-cloud-deploy-mechanics` — shipping `STREAMLIT_DEV_EMAIL`
  caused an outage on 8/4).
- With it in place: **321 pass / 9 fail / 1 skip.** The 9
  (`test_goals_duplicate_metric_keys`, `test_renders_ccsm_metrics`,
  `test_renders_ccsm_with_data`, one `test_renders_spanish`, one
  `test_weekly_form_parser`) are **pre-existing** — verified identical on
  `master` with the same secrets file. They are CCSM-fork residue + a
  goals-page duplicate-widget-key bug + a weekly-projection routing bug,
  none related to per-missionary work.

## 4. Per-missionary tracking

**Design:** `docs/superpowers/specs/2026-09-02-hspse-per-missionary-tracking-design.md`
(committed `e94c1e3`).

**Corrected premise:** `ONBOARDING_READINESS.md` assumed this was a *port* of
"Provo main's per-missionary layer." Verified 9/2 by reading Provo: **there is
no such layer.** Provo, CCSM, and HSPSE are all per-area. This is net-new.

**Decided scope:** individual metric *numbers*; both companions show the
*area's* numbers (no per-person data entry — nightly form, `DAILY_LOG`,
scoring all unchanged); stitched across areas over time.

### Phase 1 — DONE (branch `feat/per-missionary-phase1`, unmerged, not reviewed)

4 commits: `cac14fa` (queries), `28e1576` (helper extract), `c154fe4` (page),
`73fae72` (plan doc).

- `get_missionary_roster()` + `resolve_missionary_area()` in
  `dashboard/app/db/queries.py` — melts `MISSION_ORG`'s Companion1–4 columns
  to one row per (missionary, area); sources `get_submitting_areas()`
  (teaching areas only, per the design's lean call on open question 1); not
  `@st.cache_data` (pytest cross-test pollution).
- `companionship_label` / `build_companionship_map` moved to
  `dashboard/app/utils/area_helpers.py` — one implementation shared by
  `scope_selector.py` and the new page.
- `dashboard/pages/05_Misioneros.py` — pick a missionary, see their current
  area's numbers via `render_group_breakdown(scope_kind="Area")` (the same
  function `04_Desgloses.py` uses). Spanish i18n added.
- 20 new tests (written test-first). Suite: 321 pass.
- Known nit (not this PR's job): `page_title="CCSM · …"` — 14/15 pages have it.

### Phase 2 — designed only (needs live Apps Script access)

New append-only `MISSIONARY_ASSIGNMENTS` tab, written by the transfer flow
(there's already a `MISSION_ORG_SNAPSHOT` + `TRANSFER_LOG` in
`HSPSEM_AddTransferTabs.gs`); dashboard `get_missionary_history()` stitches
the per-area timeline. Seed all 164 open assignment rows at launch. **No
backfill needed** — reporting starts 9/9, first transfer 10/21, so the
timeline is trivially short until then and only needs to accumulate forward.

Open questions for Phase 2 / the president (design §8): non-teaching
missionaries (president, APs, couples) in the roster?; identity key (name vs
an IMOS id — check `roster_staging/`); weekly-KI attribution rule.

## 5. Go-live blockers still open (from the 8/29 deep test — unchanged)

1. **Agent1C fix not deployed.** `HSPSEM_Agent1C.FIXED.gs` (committed
   `7421164`) adds a Gemini circuit-breaker and skips the president + no-data
   areas. Without it, Agent1C times out under Gemini slowness and emails every
   area (incl. a "0/7 días reportados" scolding to the president). **User must
   paste `HSPSEM_Agent1C.FIXED.gs` over `HSPSEM_Agent1C.gs` in the bound
   editor** — clasp push and sheet paste are both classifier-blocked.
2. **Relay blank.** `RELAY_2_URL` / `RELAY_SECRET` empty → mail to
   `@missionary.org` is silently dropped by church mail. `TEST_MODE` hides
   this. Needs a second Gmail account + `HSPSEM_RelayReceiver.gs` deployed as
   a Web App (`HSPSEM_RELAY_SETUP.md`), then `testRelay()`.
3. **§8.3 leadership scriptures** in `HSPSEM_Agent1C.gs` (`_LEADERSHIP_MSGS`)
   ship with model-written verse text; at least two point at the wrong verse.
   Needs a Spanish-edition check. `HSPSEM_SCRIPTURE_FILLIN.md` is the fill
   sheet (also covers the 14 blank message-bank refs).
4. **`MISSION_ORG` companion emails** — 80 area emails were written 8/29
   (A074/Yoro 2 blank). Verify against the office roster before go-live; a
   wrong address = a companionship that silently never hears from the system.

## 6. Do first when back at a machine with the `hspsem` account

1. Sign `hspsem.pmg.compass@gmail.com` into Chrome. Confirm the 8/29 build is
   intact: open `COMPASS_HSPSE`, run `smokeTestPipeline()` (read-only),
   check `AGENT_CONFIG` `TEST_MODE=TRUE` and zero triggers.
2. Paste `HSPSEM_Agent1C.FIXED.gs` (blocker 1), re-run the coaching chain,
   re-verify the safety proof.
3. New GCP project → service account → `secrets.toml` (checklist item 3).
   Run `dashboard/tools/check_handoff_access.py`.
4. `dashboard/tools/probe_live.py json tests/live/live_form_headers.json
   NIGHTLY_FORM_RAW WEEKLY_FORM_RAW QUESTIONS_CONFIG` — real HSPSE snapshot
   (checklist item 2).
5. Review + merge `feat/per-missionary-phase1`.
6. GitHub repo + Streamlit Cloud app (checklist item 4).

## 7. Scoped hand-off — the two offline tasks not done tonight

### Port `tests/*.js` from CCSM to HSPSE (DEPLOYMENT.md "could not verify" #5)

All 31 JS test files + `fixtures.js` + `test_live_form_headers.js` are CCSM's,
copied unmodified — every one ENOENTs on `CcsmData.gs` / `CCSM_*.gs`. Not
mechanical: the fixtures generate form headers from `CcsmData.gs`'s metric
set, which differs from HSPSE's v2 catalog (no `exchanges` / `roleplays`;
weekly KI renames `ki_friends_sacrament`→`ki_pew`,
`ki_new_people`→`ki_new_people_found`,
`ki_friends_first_week`→`ki_first_week_church`; new `ki_rc_could_attend`).
Needs: rewrite `fixtures.js` (`makeCcsmSpreadsheet`→`makeHspsemSpreadsheet`,
already partly done per `tests/fixtures.js`'s git status), repoint every
`loadGs([...])`, rework assertions to the v2 catalog, fix one hardcoded Provo
absolute path. Its own task — plan it with `superpowers:writing-plans`.

### Regenerate `tests/live/live_form_headers.json`

Blocked on the service account. Once item 3/4 above are done, the one command
in §6 step 4 produces it. Then port `test_live_form_headers.js` alongside the
suite above.
