/**
 * BuildHspsemSheet.gs — one-shot builder for the COMPASS_HSPSE spreadsheet
 * ------------------------------------------------------------------
 * HOW TO USE
 *   1. Create a new standalone Google Apps Script project (script.google.com
 *      > New project), NOT bound to any existing sheet.
 *   2. Paste HspsemData.gs and this file (BuildHspsemSheet.gs) into the project
 *      (HspsemData.gs first — this file reads its globals).
 *   3. Select buildHspsemSheet from the function dropdown and click Run.
 *      Authorize when prompted (creates a new spreadsheet in your Drive).
 *   4. Check the Execution log (View > Logs) for the new sheet's URL and the
 *      VERIFY result, then follow the NEXT STEPS printed at the end.
 *
 * WHAT IT DOES
 *   Creates one new spreadsheet named COMPASS_HSPSE, builds every tab listed
 *   in HSPSEM_TAB_SPECS (HspsemData.gs) with its header row (if any) and any
 *   pre-filled config/org/questions rows, then runs a self-verifying
 *   reopen-compare-fix pass (verifyHspsemSheet_) to guard against Google
 *   Sheets occasionally dropping a write under load — it reopens the
 *   spreadsheet by ID (fresh server state, not a cached handle), compares
 *   every expected cell, re-applies any mismatch, and repeats (capped at 20
 *   rounds) until a clean read-back.
 *
 * This is a standalone builder script — it is never bound to the sheet it
 * creates, and it is not part of the ported HSPSEM_* agent scripts that will
 * later run against the sheet it produces.
 */

function buildHspsemSheet() {
  var ss = SpreadsheetApp.create('COMPASS_HSPSE');
  // Without this, the spreadsheet inherits the script owner's default
  // timezone (usually America/Los_Angeles), which changes how Sheets
  // parses/displays date-like string literals on write — part of why
  // SYSTEM_START_DATE/TRANSFER_START_DATE never converged in verify (see
  // hspsemCellsEqual_'s Date branch below for the other half of that fix).
  ss.setSpreadsheetTimeZone('America/Tegucigalpa');
  HSPSEM_TAB_SPECS.forEach(function(spec) {
    var sh = ss.insertSheet(spec.name);
    if (spec.headers) {
      sh.getRange(1, 1, 1, spec.headers.length).setValues([spec.headers]);
      sh.getRange(1, 1, 1, spec.headers.length).setFontWeight('bold').setBackground('#173A72').setFontColor('#FFFFFF');
      sh.setFrozenRows(1);
    }
    var rows = hspsemPrefillRows_(spec);
    if (rows && rows.length) sh.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  });
  // remove the default sheet LAST (a spreadsheet can never have zero sheets)
  var def = ss.getSheetByName('Sheet1') || ss.getSheetByName('Hoja 1');
  if (def) ss.deleteSheet(def);
  SpreadsheetApp.flush();
  var ok = verifyHspsemSheet_(ss.getId());
  Logger.log('COMPASS_HSPSE created: ' + ss.getUrl());
  Logger.log(ok ? 'VERIFY: all tabs & headers correct.' : 'VERIFY WARNING: see fix log above.');
  Logger.log('NEXT STEPS: (1) attach the ES daily form -> rename its new tab to NIGHTLY_FORM_RAW; ' +
             '(2) attach the ES weekly form -> rename to WEEKLY_FORM_RAW; ' +
             '(3) fill AGENT_CONFIG blanks (SYSTEM_START_DATE, form links, GEMINI key via Script Properties); ' +
             '(4) create the bound Apps Script project and paste the HSPSEM_*.gs files (Helpers first).');
}

function hspsemPrefillRows_(spec) {
  if (spec.prefill === 'HSPSEM_MISSION_ORG_ROWS') return HSPSEM_MISSION_ORG_ROWS;
  if (spec.prefill === 'HSPSEM_AGENT_CONFIG_ROWS') return HSPSEM_AGENT_CONFIG_ROWS;
  if (spec.prefill === 'HSPSEM_TRANSFER_SCHEDULE_ROWS') return HSPSEM_TRANSFER_SCHEDULE_ROWS;
  if (spec.name === 'QUESTIONS_CONFIG') return hspsemQuestionsConfigRows_();
  return null;
}

function hspsemQuestionsConfigRows_() {
  var rows = [], n = 0;
  HSPSEM_NIGHTLY_QUESTIONS.forEach(function(q) {
    n++;
    rows.push(['Q-N-' + ('00' + n).slice(-3), 'NIGHTLY', q.headerEs, q.key, q.displayEs,
               q.type, 'TRUE', 'TRUE', 'TRUE', q.order, 'TRUE']);
  });
  var w = 0;
  HSPSEM_WEEKLY_QUESTIONS.forEach(function(q) {
    w++;
    rows.push(['Q-W-' + ('00' + w).slice(-3), 'WEEKLY', q.headerEs, q.key, q.displayEs,
               q.type, 'FALSE', 'FALSE', 'TRUE', q.order, 'TRUE']);
  });
  return rows;
}

// Builds the same {tabName: [[row1],[row2],...]} shape the builder wrote,
// from the same HspsemData.gs globals — so the verify pass never drifts from
// what buildHspsemSheet() actually intended to write. Each tab's array starts
// with its header row (if the spec has one) followed by any prefill rows;
// tabs with neither are recorded as an empty array (skipped by the verifier).
function hspsemExpectedState_() {
  var expected = {};
  HSPSEM_TAB_SPECS.forEach(function(spec) {
    var rows = [];
    if (spec.headers) rows.push(spec.headers.slice());
    var prefill = hspsemPrefillRows_(spec);
    if (prefill && prefill.length) rows = rows.concat(prefill);
    expected[spec.name] = rows;
  });
  return expected;
}

// Google Sheets auto-parses a plain string literal that LOOKS like a boolean,
// a number, or a date into that typed value when it is written via setValue /
// setValues — "TRUE"/"FALSE" become real Booleans, "0.50" becomes the Number
// 0.5, and a "YYYY-MM-DD" string (e.g. AGENT_CONFIG's SYSTEM_START_DATE /
// TRANSFER_START_DATE) becomes a real Date. want[] is always the literal
// string HspsemData.gs authored; got[] is whatever Sheets actually stored. A
// naive String(got) !== String(want) never converges here: String(true) is
// "true", not "TRUE"; String(0.5) is "0.5", not "0.50"; and String(aDate) is
// a full "Wed Sep 09 2026 00:00:00 GMT..." — nothing like "2026-09-09", so
// those two cells "fixed" each other every single round and verify never hit
// 0 fixes. This normalizes each case to what Sheets will actually treat as
// equivalent, so the verify pass can recognize a correctly-written cell
// instead of trying to fix it forever.
function hspsemCellsEqual_(got, want) {
  if (want === 'TRUE' || want === 'FALSE') {
    return String(got).trim().toUpperCase() === want;
  }
  if (typeof want === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(want) && got instanceof Date) {
    var wantDate = new Date(want + 'T00:00:00');
    return got.getFullYear() === wantDate.getFullYear() &&
           got.getMonth()    === wantDate.getMonth() &&
           got.getDate()     === wantDate.getDate();
  }
  if (typeof want === 'string' && /^-?\d+(\.\d+)?$/.test(want)) {
    return Number(got) === Number(want);
  }
  return String(got) === String(want);
}

function verifyHspsemSheet_(spreadsheetId) {
  var expected = hspsemExpectedState_();
  for (var round = 1; round <= 20; round++) {
    var ss = SpreadsheetApp.openById(spreadsheetId);   // FRESH open — true server state
    var fixes = 0;
    Object.keys(expected).forEach(function(tabName) {
      var sh = ss.getSheetByName(tabName);
      if (!sh) { ss.insertSheet(tabName); fixes++; return; }
      var want = expected[tabName];
      if (!want.length) return;
      var got = sh.getLastRow() > 0 ? sh.getRange(1, 1, want.length, want[0].length).getValues() : [];
      for (var r = 0; r < want.length; r++) {
        for (var c = 0; c < want[r].length; c++) {
          var g = got[r] ? got[r][c] : '';
          if (!hspsemCellsEqual_(g, want[r][c])) { sh.getRange(r + 1, c + 1).setValue(want[r][c]); fixes++; }
        }
      }
    });
    Logger.log('Verify round ' + round + ': applied ' + fixes + ' fix(es)');
    if (fixes === 0) return true;
    SpreadsheetApp.flush();
  }
  return false;
}
