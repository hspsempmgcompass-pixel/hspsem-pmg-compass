// ── HSPSEM_TransferWebApp.gs ──────────────────────────────────────────────────────
// Headless HTTPS bridge so the HSPSEM dashboard's Traslados page can trigger the
// nightly + weekly form zone/area dropdown sync WITHOUT anyone opening the
// sheet's Apps Script editor. The gspread service account behind the dashboard
// has NO Forms API access, so form sync must run here.
//
// Ported from Provo's docs/TransferWebApp.gs. Calls HSPSEM_TransferHelpers.gs
// (cct_getOrgZones_, cct_readFormStructure_, cct_repairFormRouting_,
// cct_cloneItem_, cct_log_) — same Apps Script project = shared global scope.
//
// ── ONE-TIME SETUP (before deploy) ───────────────────────────────────────────
// 1. Set CCT_NIGHTLY_FORM_ID / CCT_WEEKLY_FORM_ID below to HSPSEM's real form
//    edit IDs — open each Google Form's edit URL
//    (docs.google.com/forms/d/<FORM_ID>/edit) and copy the ID out of it.
//    AGENT_CONFIG's NIGHTLY_FORM_LINK/WEEKLY_FORM_LINK store the published
//    viewform URL, which has a DIFFERENT id — that one will not work here.
// 2. Set CCT_SHARED_SECRET below to a long random string.
//
// ── ONE-TIME DEPLOY ──────────────────────────────────────────────────────────
// 3. Paste this file AND HSPSEM_TransferHelpers.gs into the COMPASS_HSPSE Apps
//    Script project.
// 4. Deploy → New deployment → type "Web app":
//       Execute as:      Me
//       Who has access:  Anyone
//    Copy the /exec URL.
// 5. In dashboard/.streamlit/secrets.toml set:
//       TRANSFER_WEBAPP_URL    = <that /exec URL>
//       TRANSFER_WEBAPP_SECRET = <the same secret as CCT_SHARED_SECRET>
// Re-deploy (Manage deployments → edit → new version) whenever this file changes.

var CCT_SHARED_SECRET = 'hspsem-transfer-sync-2026';
var CCT_NIGHTLY_FORM_ID = '1UrvFbRW72FjUOznzDOUjpWCY2K_iQmz8UGTBFwE8WJ8';
var CCT_WEEKLY_FORM_ID = '1PCFA1WdyZGVQcBfFq5DmzeAoqN1eP24NCvpXITwHdVw';

function doGet() {
  return cct_json_({ ok: true, service: 'HSPSEM_TransferWebApp', ts: new Date().toISOString() });
}

function doPost(e) {
  try {
    var body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
    if (String(body.secret || '') !== CCT_SHARED_SECRET) {
      return cct_json_({ ok: false, error: 'Unauthorized — bad or missing secret.' });
    }

    var action = String(body.action || '');
    if (action === 'formSync') {
      return cct_formSync_(body.which || 'both');
    }
    return cct_json_({ ok: false, error: 'Unknown action: ' + action });

  } catch (err) {
    return cct_json_({ ok: false, error: String(err && err.message || err) });
  }
}

function cct_formSync_(which) {
  var out = { ok: true };
  which = String(which || 'both').toLowerCase();

  if (which === 'nightly' || which === 'both') {
    out.nightly = cct_applyFormSync_(CCT_NIGHTLY_FORM_ID, 'nightly');
    if (out.nightly.status === 'ERROR') out.ok = false;
  }
  if (which === 'weekly' || which === 'both') {
    out.weekly = cct_applyFormSync_(CCT_WEEKLY_FORM_ID, 'weekly');
    if (out.weekly.status === 'ERROR') out.ok = false;
  }
  // Surface a top-level "error" summary whenever ok is false — the Python
  // client (transfer_bridge.py) only reads data.error and falls back to a
  // generic "Unknown form sync failure" otherwise, which masked the real
  // per-form message (e.g. the Spanish-form-title bug) behind a useless
  // string during live debugging on 2026-08-08.
  if (!out.ok) {
    var parts = [];
    if (out.nightly && out.nightly.status === 'ERROR') parts.push('nightly: ' + out.nightly.msg);
    if (out.weekly && out.weekly.status === 'ERROR') parts.push('weekly: ' + out.weekly.msg);
    out.error = parts.join(' | ') || 'Unknown form sync failure.';
  }
  return cct_json_(out);
}

function cct_applyFormSync_(formId, label) {
  try {
    var orgZones   = cct_getOrgZones_();
    var formStruct = cct_readFormStructure_(formId);
    var form       = formStruct.form;
    var sections   = formStruct.zoneSections;
    var orgZoneNames = Object.keys(orgZones).sort();

    // Normalize once so a page-break title and a MISSION_ORG Zone value that
    // differ only by accents (e.g. a form section titled "Temuco Cautin" vs
    // MISSION_ORG's "Temuco Cautín") still match — these are two
    // independently-typed Spanish sources with no guarantee of identical
    // diacritic spelling.
    var normToOrgKey = {};
    orgZoneNames.forEach(function(k) { normToOrgKey[cct_normalizeText_(k)] = k; });

    // Step 1: update area dropdowns in existing sections
    var handledZones = {};
    sections.forEach(function(sec) {
      if (!sec.zoneName) return;
      var orgKey = normToOrgKey[cct_normalizeText_(sec.zoneName)];
      if (orgKey) {
        if (sec.areaItem) sec.areaItem.setChoiceValues(orgZones[orgKey]);
        handledZones[orgKey] = sec.pageBreak;
      } else {
        if (sec.areaItem) sec.areaItem.setChoiceValues(['(No active areas)']);
      }
    });

    // Step 2: add new zone sections. Title/question text is copied from the
    // form's own first section rather than hardcoded English — HSPSEM's forms
    // are entirely in Spanish, and a newly-added zone (e.g. after a mission
    // reorganization) must not insert an English section into it. Matches
    // the live form's own convention of an unsuffixed zone-name page-break
    // title (confirmed 2026-08-08: sections are titled e.g. "San Pedro", not
    // "San Pedro Zone Section").
    var templateSec = sections[0];
    var areaQuestionTitle = (templateSec && templateSec.areaItem)
      ? templateSec.areaItem.getTitle()
      : 'What is your area?';
    orgZoneNames.forEach(function(zoneName) {
      if (handledZones[zoneName]) return;
      var newPb = form.addPageBreakItem().setTitle(zoneName);
      form.addListItem()
        .setTitle(areaQuestionTitle)
        .setChoiceValues(orgZones[zoneName])
        .setRequired(true);
      templateSec.allSectionItems.slice(2).forEach(function(item) {
        cct_cloneItem_(form, item);
      });
      handledZones[zoneName] = newPb;
    });

    // Step 3: rebuild zone dropdown choices + routing
    var repairResult = cct_repairFormRouting_(formId);

    // Step 4: verification pass
    var verErrors = [];
    if (repairResult.missing.length > 0) {
      verErrors.push('Could not route zones: ' + repairResult.missing.join(', '));
    }

    var status = verErrors.length === 0 ? 'OK' : 'WARN';
    var msg = verErrors.length === 0
      ? label + ' form sync complete. ' + orgZoneNames.length + ' zones verified.'
      : 'Sync applied but verification found issues: ' + verErrors.join(' | ');

    cct_log_('HSPSEM_TransferWebApp formSync [' + label + ']', status, msg);
    return { status: status, msg: msg };

  } catch (e) {
    cct_log_('HSPSEM_TransferWebApp formSync [' + label + ']', 'ERROR', e.message);
    return { status: 'ERROR', msg: e.message };
  }
}

function cct_json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
