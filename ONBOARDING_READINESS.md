# HSPSE — PMG Compass Onboarding Readiness

**Mission:** Honduras San Pedro Sula East (HSPSE)
**Official name:** Honduras San Pedro Sula East Mission / Misión Honduras San Pedro Sula Este
**Intake received:** 2026-08-29
**Filled out by:** Mission President (himself)
**President / system contact:** `hspsem.pmg.compass@gmail.com` (system account — his personal
Church email still needed for leadership-report routing)
**Status:** PRE-BUILD — metric wording FINAL (President sign-off 2026-08-29). Awaiting mission-org
rosters + Google Form build.

---

## 1. Decisions locked (from intake + 8/29 Q&A)

| Item | Value | Notes |
|---|---|---|
| Isolation | **Its own system** — own GitHub repo, own Google Sheet, own Apps Script project, own Streamlit deploy, own GCP project, own relay Gmail. Must not touch Provo or CCSM. | User: "it needs to be its own system that isn't going to mess up other systems" |
| Dashboard language | Spanish | |
| Missionary-facing (emails + forms) | Spanish | |
| Locale | `es_HN` | |
| Timezone | **`America/Tegucigalpa`** | CONFIRMED 8/29. All of Honduras is one zone — CST (UTC−6), year-round, no DST. Intake said "America/Chicago" (wrong — Chicago has DST). |
| `SYSTEM_START_DATE` | `2026-09-09` | Nightly reporting begins |
| `TRANSFER_START_DATE` | `2026-09-09` | CONFIRMED — matches a real transfer date. 6-week cadence. |
| Transfer calendar | 2026: 05-06, 06-17, 07-29, **09-09**, 10-21, 12-02 · 2027: 01-13, 02-24, 04-07, 05-19, 06-30 | From President 8/29. Exact 6-week cycles. Load into transfer config. |
| `TEST_MODE` | `TRUE` until go-live | |
| Granularity | **Both per-missionary AND per-area at launch** | Hard requirement. See §4. |
| Metric fidelity | **Exact list as the President wrote it** — build the ~3 net-new metrics | See §3 |

---

## 2. Recommended build base — FORK CCSM

CCSM is the closest existing sibling and reused work is maximized:

- Spanish throughout (dashboard, forms, coaching letters, agent emails) — already done and proven live
- `es` locale/number/date formatting — done
- **Metric vocabulary is a near-exact match** — CCSM already has `church_invites`, `bom_shared`, `effort` (All/Most/Some choice), `baptismal_invitations`, `baptismal_calendars`, `meaningful_conversations`, `new_people_found`, `friend_lessons`, `lessons_member_present`, `rc_lessons`, `contacts_attempted`, `contacts_made`. 12 of the President's 13 nightly metrics already exist.
- Coaching letters, scoring, QA agents, quota guards, go-live gating — all built and hardened through CCSM's Aug outage work

**The one real gap: per-missionary tracking.** CCSM is per-area only. "Both at launch" means porting Provo main's per-missionary layer into the CCSM fork. This is the single biggest design question for the spec session — is per-missionary attribution contained enough in Provo to lift cleanly, or does it touch DAILY_LOG shape, forms, scoring, and every page.

Alternative considered — fork Provo main: gets per-missionary for free but re-opens the entire Spanish + metric-catalogue rework that CCSM already paid for (CCSM phase 2 alone was ~240 code references). Not recommended.

Preset flavor package: not viable for a full launch — never used for a real mission, English Provo vocabulary, no dashboard/agent adaptation.

---

## 3. Metric mapping — FINAL after President sign-off 2026-08-29

Full wording + keys: `METRIC_CATALOG_ES.md` v2 (authoritative). Summary:

### Nightly — 3 structural + 12 metrics

Structural: `report_date`, `zone`, `area`. *(`exchanges` and `roleplays` — President said
neither, dropped.)*

| # | President's wording | Key | Notes |
|---|---|---|---|
| 1 | New People Found | `new_people_found` | CCSM verbatim |
| 2 | Non-member ~~Doors~~ Attempted | `contacts_attempted` | "doors" removed per President; broad wording |
| 3 | Non-members Contacted | `contacts_made` | "doors" removed per President |
| 4 | Meaningful Conversations | `meaningful_conversations` | CCSM verbatim |
| 5 | Non-member Lessons | `friend_lessons` | CCSM verbatim ("amigos") |
| 6 | Lessons with Member Present | `lessons_member_present` | CCSM verbatim |
| 7 | Recent Convert Lessons | `rc_lessons` | CCSM verbatim |
| 8 | Church Invite Given | `church_invites` | CCSM verbatim |
| 9 | Book of Mormon Shared | `bom_shared` | CCSM verbatim |
| 10 | Effort Level (All / Most / Some) | `effort` | CHOICE — `Todo`/`La mayor parte`/`Algo`; renormalize weights, never treat as numeric 0 |
| 11 | Baptismal Invitations Extended | `baptismal_invitations` | CCSM verbatim |
| 12 | Baptismal Calendars Given | `baptismal_calendars` | CCSM verbatim |

~~Baptismal Date Set (nightly)~~ — **DROPPED.** President: weekly-only, covered by
`ki_baptismal_date` standing total.

### Weekly — 3 intro + 8 KIs (each rendered Real + Meta = 2 columns)

Intro: `report_date`, `leader_call`, `coordination_meeting`.

| # | KI | Key | Notes |
|---|---|---|---|
| 1 | Amigos en la reunión sacramental | `ki_pew` | CCSM verbatim |
| 2 | Amigos con fecha bautismal | `ki_baptismal_date` | CCSM verbatim — standing total |
| 3 | Bautizados y confirmados | `ki_baptized_confirmed` | CCSM verbatim |
| 4 | Conversos recientes en la Iglesia | `ki_rc_at_church` | CCSM verbatim |
| 5 | Conversos recientes que podían asistir | `ki_rc_could_attend` | NEW — President signed off; incl. out-of-town/sick, exclude only confirmed-moved |
| 6 | Nuevas personas encontradas | `ki_new_people_found` | CCSM verbatim |
| 7 | Amigos en la Iglesia (primera semana) | `ki_first_week_church` | CCSM verbatim |
| 8 | Lecciones con miembros participando | `ki_member_lessons` | KEEP per President; reworded to "participating actively" |

---

## 4. Open design questions for the spec session

1. **Per-missionary + per-area** — port strategy from Provo main. Scope unknown until we read Provo's DAILY_LOG / form / scoring shape. **This is the only top risk left.**
2. ~~"Baptismal Date Set" nightly~~ — **RESOLVED 8/29: dropped.** Weekly-only; existing `ki_baptismal_date` standing total covers it. No new metric.
3. ~~Net-new metrics missionary-entered or derived?~~ **RESOLVED 8/29: missionary-entered.**
4. ~~"Non-member Doors Attempted" vs `contacts_attempted`~~ — **RESOLVED 8/29: no doors-specific metric; remove the word "doors" from the wording.**
5. ~~Transfer cadence / start date~~ — **RESOLVED 8/29: full 11-date calendar received, 6-week cadence, `TRANSFER_START_DATE` = 2026-09-09.**
6. ~~Exchanges / roleplays nightly questions~~ — **RESOLVED 8/29: neither. Dropped.**
7. ~~Weekly "Lessons with members"~~ — **RESOLVED 8/29: keep, reword to "members participating actively".**

**Net effect on forms:** nightly = 3 structural (date/zone/area) + **12** metrics.
Weekly = 3 intro + **8** KIs as Real/Meta pairs. See `METRIC_CATALOG_ES.md` v2 (final).

---

## 5. Inputs still needed FROM the mission before build can finish

- [x] **Exact official mission name** — Honduras San Pedro Sula East Mission
- [~] **President contact** — system account `hspsem.pmg.compass@gmail.com` given; personal Church
  email + phone still needed for leadership-report routing
- [~] **Area roster** — IMOS CurrentOrganization export parsed 2026-08-29 → `roster_staging/`.
  **10 zones, 27 districts, 81 teaching areas, 164 teaching missionaries.** Structure complete;
  **companion emails MISSING** — that export has phone only. Blocker: get an IMOS export with
  email, or an office area-email list.
- [~] **Leadership roster** — `roster_staging/LEADERSHIP.csv`: 20 ZLs, 27 DLs, 4 STLs, 2 APs by
  name. **Emails missing** (same gap). President + spouse not in the export — need separately.
  Nightly-report recipients undecided.
- [x] **Zone count / district count** — 10 teaching zones, 27 districts (+ 1 excluded service zone).
- [ ] **Knowledge Base** Q&A — President: "we will form this later" (non-blocking)
- [ ] **Coaching-message customizations** — President: "we will also make this later"

The `make_onboarding_template.py` script in the Provo repo generates a fillable intake workbook (`Areas`, `Leadership`, `Mission Basics`, `Metrics Tracked`, `Goals`, `Knowledge Base`, `Coaching Messages` tabs) — send that to the mission to collect the roster data cleanly.

---

## 6. Infrastructure to provision (own, isolated stack)

- [x] Dedicated Google account for HSPSE (owns the Sheet + Apps Script + Forms) — **`hspsem.pmg.compass@gmail.com`** (given 8/29). President has the username + password.
- [ ] `COMPASS_HSPSE` Google Sheet — plan (8/29): `.env` file with the account creds + a
  Playwright script signs in as `hspsem.pmg.compass@gmail.com`, creates a blank Sheet + bound
  Apps Script project, pastes `BuildHspsemSheet.gs` / `HSPSEM_Setup.gs`, and runs the builder.
  Account B owns this script.
- [ ] Nightly + Weekly Google Forms (copied, never shared — one set for this mission)
- [ ] GitHub repo + org/collab account (mirrors the `ccsmpmgcompass-collab` pattern; keep SSH host alias setup)
- [ ] GCP project for the service account + Gemini API (CCSM handoff is mid GCP-detachment — follow that model, don't reuse CCSM's project)
- [ ] Relay Gmail account + Apps Script Web App deploy → `RELAY_2_URL` (hard blocker for full launch, not for a leadership trial under ~45 sends/day)
- [ ] Streamlit Cloud app — PRIVATE, auto-deploy from the new repo's `main`
- [ ] `.streamlit/secrets.toml` — service account key + Gemini key, never committed

---

## 7. Next session

Run `superpowers:brainstorming` on the **architectural design** for the HSPSE fork:
base = CCSM, add per-missionary layer, add the 3 net-new metrics, re-brand HN/es_HN.
Then `superpowers:writing-plans` → phased implementation (mirror CCSM's 8-phase structure).
