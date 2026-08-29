# HSPSE roster staging — from IMOS CurrentOrganization export, 2026-08-29

Source: `CurrentOrganization-Excel (4).xls` (President-provided). Parsed by
`parse_hspse_org.py` (self-contained, no data leaves the machine).

## What's here

| File | Content | Ready? |
|---|---|---|
| `AREAS.csv` | `Zone,Area` — 81 teaching areas, 10 zones. Matches `HSPSEM_AREAS_HEADERS`. | ✅ ready to promote to `config/AREAS.csv` |
| `areas_with_districts.csv` | `Zone,District,Area` — reference (district column for leadership routing) | ✅ |
| `zones.txt` | 10 zone names + `HSPSEM_ZONES` JS literal. **Order = alphabetical** — reorder to the President's preferred dropdown order before building the form. | ⚠️ confirm order |
| `hspsem_areas_rows.txt` | `HSPSEM_AREAS_ROWS` JS literal for Account B to paste into `HspsemData.gs` | ✅ |
| `hspsem_mission_org_rows.txt` | **`HSPSEM_MISSION_ORG_ROWS` literal, 81 rows** — modeled exactly on `CCSM_MISSION_ORG_ROWS`. Area_Code A001–A081 (Zone→District→Area alpha), Companion1/2 names, Is_DL/Is_ZL/Is_STL/Is_AP flags derived from position codes, Is_MP=FALSE, Active=TRUE. **Email columns blank — same as CCSM's own data file.** | ✅ ready for `HspsemData.gs` |
| `LEADERSHIP.csv` | 53 rows: ZLs (20), DLs (27, incl. `DT` code), STLs (4), APs (2). Email column BLANK. | reference |
| `roster.tsv` | All 164 teaching missionaries, Companion1/Companion2 slot per area. Email column BLANK. | reference |
| `anomalies.txt` | Areas with ≠2 missionaries | see below |

## Emails — NOT a build blocker (matches CCSM)

CCSM's own `CcsmData.gs` ships `CCSM_MISSION_ORG_ROWS` with **blank email columns** — the
addresses are hand-entered into the live `MISSION_ORG` tab of the Sheet, not stored in the
`.gs`. HSPSE follows the same pattern: build the sheet now with blank emails, fill the
`Companion1_Email` / `Companion2_Email` cells directly in the Sheet when the address list
arrives (President is getting it). Nothing automated *sends* until then anyway — `TEST_MODE=TRUE`
routes all mail to `hspsem.pmg.compass@gmail.com`.

`roster.tsv` / `LEADERSHIP.csv` carry `Email_TO_FILL` columns as a worksheet for collecting
the addresses before they go into the Sheet.

## Decisions for the President / user

1. **Zone dropdown order** — currently alphabetical. Give the preferred order.
2. **"Misioneros de Servicio" zone (10 service missionaries) — excluded** from teaching areas
   and metrics. Confirm that's right (they don't submit proselyting reports).
3. **Nightly leadership report recipients** — which of the 20 ZLs / 27 DLs / 4 STLs / 2 APs,
   plus the President, get the nightly mission report? (fill `Gets_Nightly_Report_TO_CONFIRM`)
4. **President + spouse** — not in this export. Need name + Church email.
5. Anomalies to confirm:
   - `La Paz / La Paz / La Paz` — 3 elders coded `SA` (service/unassigned), no senior/junior.
   - `Palermo / William Hall / William Hall` — trio (1 trainer + 2 new sisters). Normal, but
     confirm which sister is the area contact.
   - 6 missionaries total carry the `SA` code (La Mesa ×2, Pineda ×1, La Paz ×3) — treated as
     Companion2. Confirm.

## Position codes seen

`ZL1/ZL2` zone leaders · `DL` / `DT` district leader (one per district; DT = also training) ·
`STL1/STL2` sister training leaders · `AP` assistant to president · `TR` trainer ·
`SC/JC` senior/junior companion · `SA` service / unassigned
