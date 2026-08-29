/**
 * ============================================================
 * HSPSEM_AgentValidation.gs — Data Validation Agent
 * PMG Compass | Honduras San Pedro Sula East Mission (HSPSEM) — Spanish fork
 * ============================================================
 *
 * Fork of AgentValidation.gs (docs/AgentValidation.gs in PMG-Compass).
 * Internal av_* function names are kept identical to the Provo original so
 * future diffs stay readable.
 *
 * Runs BEFORE duplicate detection in onNightlyFormSubmit (HSPSEM_AgentDuplicate.gs).
 * If any numeric field on the just-submitted row contains an invalid value,
 * it:
 *   1. Sets STATUS = 'VALIDATION_ERROR' on the row
 *   2. Emails the area missionaries (Spanish) with the specific field(s) that
 *      failed
 *   3. Logs to AUDIT_LOG
 *   4. Returns false — caller must skip duplicate detection for this row
 *
 * STRUCTURAL CHANGE vs Provo: the Provo original was a flat single-section
 * form with per-companion column SUFFIXES (' ', ' 2', ' 3'). HSPSEM's Google
 * Forms are split into one repeated section PER ZONE (see
 * HSPSEM_Agent3.gs's a3_parseSectionStructure / HSPSEM_FORM_STRUCTURAL) — a
 * single companionship fills exactly one section, not per-companion
 * suffixed columns — so av_validateFormRow locates the FILLED section (via
 * the area column) and validates the numeric fields within it, instead of
 * scanning fixed suffix variants.
 *
 * Numeric field lists are read directly from HSPSEM_NIGHTLY_QUESTIONS /
 * HSPSEM_WEEKLY_QUESTIONS (HspsemData.gs) — the same single source of truth the
 * live forms and every other HSPSEM agent use — rather than a hardcoded
 * literal list, so this file can never drift out of sync with the form.
 *
 * INTEGRATION: HSPSEM_AgentDuplicate.gs's onNightlyFormSubmit() calls
 * av_validateFormRow(e, 'nightly') first and returns early if it is false.
 */

// ── Numeric fields — derived from the single source of truth in HspsemData.gs ───
// LAZY (2026-08-29 fix): these used to run as top-level code, reading
// HSPSEM_NIGHTLY_QUESTIONS/HSPSEM_WEEKLY_QUESTIONS at FILE LOAD time. Apps
// Script (and clasp push) load .gs files alphabetically by default, and
// HspsemData.gs does not sort first — so on every run in the bound project,
// this executed before HspsemData.gs had loaded, throwing "Cannot read
// properties of undefined (reading 'filter')". Wrapped in cached getters
// instead: nothing here touches another file's globals until
// av_nightlyNumericFields_()/av_weeklyNumericFields_() is actually called,
// long after every file has loaded — so file order no longer matters.
var _avNightlyNumericFieldsCache_ = null;
function av_nightlyNumericFields_() {
  if (_avNightlyNumericFieldsCache_) return _avNightlyNumericFieldsCache_;
  _avNightlyNumericFieldsCache_ = HSPSEM_NIGHTLY_QUESTIONS
    .filter(function(q) { return q.type === 'NUMBER'; })
    .map(function(q) { return q.headerEs; });
  return _avNightlyNumericFieldsCache_;
}

var _avWeeklyNumericFieldsCache_ = null;
function av_weeklyNumericFields_() {
  if (_avWeeklyNumericFieldsCache_) return _avWeeklyNumericFieldsCache_;
  _avWeeklyNumericFieldsCache_ = HSPSEM_WEEKLY_QUESTIONS
    .filter(function(q) { return q.type === 'NUMBER'; })
    .map(function(q) { return q.headerEs; });
  return _avWeeklyNumericFieldsCache_;
}


/**
 * Main entry point called from onNightlyFormSubmit (and, if a weekly-form
 * trigger is ever added, onWeeklyFormSubmit).
 * Returns true if validation passed (proceed to duplicate check).
 * Returns false if validation failed (skip duplicate check for this row).
 *
 * @param {Object} e - Apps Script form submit event object (unused — HSPSEM's
 *   raw tabs are read directly, matching HSPSEM_AgentDuplicate.gs's own
 *   convention; kept for API compatibility with the real onFormSubmit trigger).
 * @param {string} formType - 'nightly' or 'weekly'
 * @returns {boolean}
 */
function av_validateFormRow(e, formType) {
  try {
    var tabName = formType === 'weekly' ? 'WEEKLY_FORM_RAW' : 'NIGHTLY_FORM_RAW';
    var rawData = av_getSheetData(tabName);
    if (!rawData || rawData.length < 2) return true; // nothing to validate

    var headers    = rawData[0].map(function(h) { return String(h).trim(); });
    var lastRowIdx = rawData.length - 1; // 0-based index into rawData
    var lastRow    = rawData[lastRowIdx];

    // ── Locate the filled zone-section (one area column per zone) ─────────────
    var sec = av_locateFilledSection(headers, lastRow);
    if (!sec) return true; // structurally unrecognized or nothing filled — don't block
    var sectionStart = sec.start;
    var sectionEnd   = sec.end;

    // ── Validate every numeric field found within that section ────────────────
    var numericFields = formType === 'weekly' ? av_weeklyNumericFields_() : av_nightlyNumericFields_();
    var failures = []; // { field, value }

    numericFields.forEach(function(fieldName) {
      var colIdx = -1;
      for (var i = sectionStart; i < sectionEnd; i++) {
        if (headers[i] === fieldName) { colIdx = i; break; }
      }
      if (colIdx === -1) return; // column not present in this section — skip

      var raw = lastRow[colIdx];
      if (raw === '' || raw === null || raw === undefined) return; // blank is OK

      var strVal = String(raw).trim();
      if (!av_isNonNegativeInteger(strVal)) {
        failures.push({ field: fieldName, value: strVal });
      }
    });

    if (failures.length === 0) {
      // A clean submission — if it supersedes an earlier VALIDATION_ERROR row
      // for the same area + date, remove that row now. Without this,
      // HSPSEM_AgentDuplicate's duplicate scan (which has no "stale vs
      // same-session" distinction) would treat the correction as a duplicate
      // of the old error row and delete BOTH — losing the fix.
      var cleanArea    = String(lastRow[sectionStart] || '').trim();
      var cleanDateStr = av_getDateField(headers, lastRow, sectionStart, sectionEnd);
      av_deleteSupersededErrorRows(tabName, headers, cleanArea, cleanDateStr, lastRowIdx + 1, rawData);
      return true;
    }

    // ── Validation failed — mark row, email missionaries, log ─────────────────
    av_markRowStatus(tabName, headers, lastRowIdx + 1, 'VALIDATION_ERROR'); // +1 for sheet 1-based row

    var areaName   = String(lastRow[sectionStart] || '').trim();
    var dateStr    = av_getDateField(headers, lastRow, sectionStart, sectionEnd);
    var missionOrg = av_loadMissionOrg();
    var emails     = av_getMissionaryEmails(areaName, missionOrg);
    var formLink   = getConfig(formType === 'weekly' ? 'WEEKLY_FORM_LINK' : 'NIGHTLY_FORM_LINK') || '';

    if (emails.length > 0 && MailApp.getRemainingDailyQuota() >= 20) {
      var subject = 'Por favor, reenvíe su informe — se detectó un valor no válido';
      var body    = av_buildValidationEmail(areaName, dateStr, failures, formLink);
      emails.forEach(function(email) {
        sendEmail(email, subject, body, 'AgentValidation');
      });
    } else if (emails.length === 0) {
      Logger.log('AgentValidation: No emails found for area: ' + areaName);
    } else {
      Logger.log('AgentValidation: Quota too low — skipped email for ' + areaName);
    }

    av_logAudit('VALIDATION_ERROR', lastRowIdx + 1, areaName,
      failures.length + ' field(s) failed: ' + failures.map(function(f) { return f.field; }).join(', '));

    return false; // skip duplicate detection

  } catch (err) {
    av_logAudit('ERROR', -1, '', err.message);
    Logger.log('AgentValidation ERROR: ' + err.message);
    return true; // on unexpected error, don't block the trigger
  }
}


// ── Helpers ───────────────────────────────────────────────────────────────────

function av_isNonNegativeInteger(val) {
  // Must be a whole number >= 0. Rejects decimals, letters, negatives, 'O' (letter O).
  return /^\d+$/.test(val);
}

function av_getSheetData(tabName) {
  var sheet = getTab(tabName);
  if (!sheet || sheet.getLastRow() === 0) return null;
  return sheet.getDataRange().getValues();
}

/**
 * Locates which repeated per-zone section of a row is actually filled in,
 * via the area column (one occurrence per zone). Returns { start, end }
 * (0-based, end exclusive) or null if the row can't be placed in a section
 * at all (structurally unrecognized headers, or no section filled).
 */
function av_locateFilledSection(headers, row) {
  var areaTarget = HSPSEM_FORM_STRUCTURAL.areaCol;
  var areaCols   = [];
  headers.forEach(function(h, idx) { if (h === areaTarget) areaCols.push(idx); });
  if (areaCols.length === 0) return null;

  var sectionStart = -1;
  for (var s = 0; s < areaCols.length; s++) {
    if (String(row[areaCols[s]] || '').trim()) { sectionStart = areaCols[s]; break; }
  }
  if (sectionStart === -1) return null;

  var idxInAreaCols = areaCols.indexOf(sectionStart);
  var sectionEnd    = (idxInAreaCols + 1 < areaCols.length) ? areaCols[idxInAreaCols + 1] : headers.length;

  return { start: sectionStart, end: sectionEnd };
}

/**
 * Reads the report-date field within the filled section and normalizes it
 * to 'YYYY-MM-DD'. Falls back to the raw string if it isn't a parseable date.
 */
function av_getDateField(headers, row, sectionStart, sectionEnd) {
  var dateTarget = HSPSEM_FORM_STRUCTURAL.dateCol;
  var colIdx = -1;
  for (var i = sectionStart; i < sectionEnd; i++) {
    if (headers[i] === dateTarget) { colIdx = i; break; }
  }
  if (colIdx === -1) return '';
  var raw = row[colIdx];
  if (!raw) return '';
  try {
    return Utilities.formatDate(new Date(raw), getMissionTimezone(), 'yyyy-MM-dd');
  } catch (e) {
    return String(raw);
  }
}

function av_loadMissionOrg() {
  var data = av_getSheetData('MISSION_ORG');
  if (!data || data.length < 2) return [];
  return data;
}

function av_getMissionaryEmails(areaName, missionOrg) {
  if (!missionOrg || missionOrg.length < 2 || !areaName) return [];
  var headers   = missionOrg[0].map(function(h) { return String(h).trim(); });
  var areaCol   = headers.indexOf('Area_Name');
  var email1Col = headers.indexOf('Companion1_Email');
  var email2Col = headers.indexOf('Companion2_Email');
  if (areaCol === -1) return [];

  var emails = [];
  var canon  = areaName.trim().toLowerCase();
  for (var i = 1; i < missionOrg.length; i++) {
    var row = missionOrg[i];
    if (String(row[areaCol]).trim().toLowerCase() !== canon) continue;
    var e1 = email1Col !== -1 ? String(row[email1Col]).trim() : '';
    var e2 = email2Col !== -1 ? String(row[email2Col]).trim() : '';
    // NOTE (fixed vs the Provo original): 'tbd'/'@notreadyyet.com' are
    // substring markers to reject — they must NOT include '' in that list,
    // since indexOf('')/includes('') is always 0/true for ANY string,
    // which silently made the Provo original's equivalent guard permanently
    // reject every email (av_getMissionaryEmails always returned []). The
    // blank check is already covered by the `e1 &&` / `e2 &&` guards below.
    var invalidSubstrings = ['tbd', '@notreadyyet.com'];
    if (e1 && !invalidSubstrings.some(function(s) { return e1.toLowerCase().indexOf(s) !== -1; })) emails.push(e1);
    if (e2 && !invalidSubstrings.some(function(s) { return e2.toLowerCase().indexOf(s) !== -1; })) emails.push(e2);
    break;
  }
  return emails;
}

function av_markRowStatus(tabName, headers, sheetRowNumber, status) {
  var sheet = getTab(tabName);
  if (!sheet) return;

  var statusCol = headers.indexOf('STATUS');
  if (statusCol === -1) {
    // Append STATUS column header
    var lastCol = headers.length + 1;
    sheet.getRange(1, lastCol).setValue('STATUS');
    statusCol = lastCol - 1; // 0-based
  }
  sheet.getRange(sheetRowNumber, statusCol + 1).setValue(status);
}

function av_buildValidationEmail(areaName, dateStr, failures, formLink) {
  var lines = [];
  lines.push('<p>Estimados misioneros de <strong>' + areaName + '</strong>,</p>');
  lines.push('<p>Notamos un problema con su informe enviado para <strong>' + (dateStr || 'la fecha que ingresó') + '</strong>. ');
  lines.push('Uno o más campos contenían un valor que no es un número entero válido (como 0, 1, 2, etc.).</p>');
  lines.push('<p><strong>Campos que necesitan corrección:</strong></p>');
  lines.push('<table style="border-collapse:collapse;font-size:14px;">');
  lines.push('<tr style="background:#f3f4f6;"><th style="padding:8px 12px;text-align:left;border:1px solid #d1d5db;">Campo</th>');
  lines.push('<th style="padding:8px 12px;text-align:left;border:1px solid #d1d5db;">Lo que Ingresó</th></tr>');
  failures.forEach(function(f) {
    lines.push('<tr><td style="padding:8px 12px;border:1px solid #d1d5db;">' + f.field + '</td>');
    lines.push('<td style="padding:8px 12px;border:1px solid #d1d5db;">' + f.value + '</td></tr>');
  });
  lines.push('</table>');
  lines.push('<p>Por favor, reenvíe su informe con los valores corregidos usando el enlace a continuación.</p>');
  if (formLink) {
    lines.push('<p><a href="' + formLink + '">Reenviar su Informe</a></p>');
  }
  lines.push('<p>Gracias por su diligencia y el gran trabajo que están haciendo. ¡Estamos agradecidos por ustedes!</p>');
  lines.push('<p style="color:#6b7280;font-size:12px;">— Sistema PMG Compass (' + getMissionName() + ')</p>');
  return lines.join('\n');
}

function av_logAudit(action, rowNumber, area, notes) {
  try {
    var sheet = getTab('AUDIT_LOG');
    if (!sheet) return;
    if (sheet.getLastColumn() === 0 || sheet.getLastRow() === 0) {
      sheet.appendRow(['Timestamp', 'Agent', 'Action', 'Rows_Affected', 'Area', 'Notes']);
    }
    sheet.appendRow([
      Utilities.formatDate(new Date(), getMissionTimezone(), 'yyyy-MM-dd HH:mm:ss'),
      'AgentValidation',
      action,
      rowNumber,
      area,
      notes
    ]);
  } catch (e) {
    Logger.log('av_logAudit failed: ' + e.message);
  }
}


/**
 * When a corrected resubmission passes validation, delete any earlier row
 * for the same area + date/week still marked VALIDATION_ERROR. Without this,
 * HSPSEM_AgentDuplicate's duplicate scan (no "stale vs same-session" branch,
 * unlike the Provo original) would treat the correction as a duplicate of
 * the old error row and delete BOTH the bad row and the good one.
 */
function av_deleteSupersededErrorRows(tabName, headers, newArea, newDateStr, excludeRowNumber, rawData) {
  if (!newArea || !newDateStr) return;
  var statusColIdx = headers.indexOf('STATUS');
  if (statusColIdx === -1) return; // no error rows have ever been marked

  var canonArea = newArea.trim().toLowerCase();
  var toDelete  = [];

  for (var i = 1; i < rawData.length; i++) {
    var sheetRowNum = i + 1;
    if (sheetRowNum === excludeRowNumber) continue;
    var row = rawData[i];
    if (String(row[statusColIdx] || '').trim() !== 'VALIDATION_ERROR') continue;

    var sec = av_locateFilledSection(headers, row);
    if (!sec) continue;
    var area    = String(row[sec.start] || '').trim();
    var dateStr = av_getDateField(headers, row, sec.start, sec.end);
    if (area.trim().toLowerCase() === canonArea && dateStr === newDateStr) {
      toDelete.push(sheetRowNum);
    }
  }

  if (toDelete.length === 0) return;

  toDelete.sort(function(a, b) { return b - a; }); // bottom-up so earlier deletes don't shift later row numbers
  var sheet = getTab(tabName);
  toDelete.forEach(function(rowNum) { sheet.deleteRow(rowNum); });

  av_logAudit('SUPERSEDED_BY_CORRECTION', excludeRowNumber, newArea,
    'Deleted ' + toDelete.length + ' prior VALIDATION_ERROR row(s) for ' + newArea + ' / ' + newDateStr + ' — superseded by corrected resubmission.');
}


// ═════════════════════════════════════════════════════════════════════════════
// WEEKLY TRIGGER
// ─────────────────────────────────────────────────────────────────────────────
// Run av_setupWeeklyTrigger() ONCE from the Apps Script editor after pasting
// this file in. Mirrors setupAgentDuplicateTrigger() in HSPSEM_AgentDuplicate.gs.
// ═════════════════════════════════════════════════════════════════════════════

function onWeeklyFormSubmit(e) {
  av_validateFormRow(e, 'weekly');
}

function av_setupWeeklyTrigger() {
  deleteTriggerByName('onWeeklyFormSubmit');

  ScriptApp.newTrigger('onWeeklyFormSubmit')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onFormSubmit()
    .create();

  Logger.log('AgentValidation: onWeeklyFormSubmit trigger installed.');
}
