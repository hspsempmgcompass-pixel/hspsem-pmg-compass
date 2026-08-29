/**
 * Informe Diario Misional — Google Form builder (Spanish version)
 * Honduras San Pedro Sula East Mission (HSPSE)
 * ------------------------------------------------------------------
 * Wording/keys/order sourced VERBATIM from METRIC_CATALOG_ES.md v2
 * (President sign-off 2026-08-29). Do not paraphrase Spanish — if wording
 * needs to change, change METRIC_CATALOG_ES.md first, then this file.
 *
 * v2 CHANGES vs the v1 draft this replaces:
 *   - Structural: exchanges/roleplays REMOVED. Nightly structural = date,
 *     zone, area only (President 2026-08-29, catalog resolved Q2).
 *   - baptismal_dates_set REMOVED — President wants baptismal-date tracking
 *     on the weekly report only (existing ki_baptismal_date covers it).
 *   - contacts_attempted / contacts_made help text: the "no tiene que ser
 *     en una puerta" (doors) sentence is gone — catalog resolved Q1.
 *   - 12 metric questions now (was 13 in the v1 draft).
 *
 * ZONE/AREA DATA: AREAS_ROWS below is sourced from config/AREAS.csv (Zone,Area
 * columns) — currently EMPTY, roster not yet provided (ONBOARDING_READINESS.md
 * §5). Do NOT run buildDailyReportFormES() until it's populated; an empty
 * roster builds a form with zero zone/area sections. Keep this array in sync
 * with config/AREAS.csv and with HspsemData.gs's HSPSEM_AREAS_ROWS — all three
 * must match (same pattern CCSM used for its ZONES/CCSM_ZONES pair).
 *
 * PER-ZONE SECTION LOOKUP: grouped via areaChoicesForZone_() below, which
 * resolves the 'Zone'/'Area' column positions by NAME once (into a map),
 * then groups rows into per-zone sections — never scattered
 * headers.indexOf() calls. NOT named findRowSection() on purpose: that
 * name isn't a CCSM pattern at all — it's a Provo main-repo incident
 * (docs/AgentValidation.gs was hand-edited to call a `findRowSection`
 * helper that was never defined, crashing every form submission; see
 * PMG-Compass's tests/gs/test_validation_sections.js, which now asserts
 * that file must never call it again). Named this helper something
 * unambiguous instead so it can't be confused with that bug.
 *
 * HOW TO USE
 *   1. Go to https://script.google.com  ->  New project.
 *   2. Delete the sample code, paste THIS ENTIRE FILE in.
 *   3. Run  buildDailyReportFormES  (first run: approve the permission prompt).
 *   4. The Execution log prints the form's edit + live URLs and the URL of
 *      the freshly-created linked responses spreadsheet.
 *
 * SAFE TO RE-RUN: each run creates a brand-new form + sheet; it never edits
 * an existing one.
 *
 * WHY THE VERIFY/FIX PASS: this form creates 50+ items, and Google's Forms
 * Advanced Service intermittently drops a setTitle()/setHelpText() write when
 * many items are created in one run — leaving Google's placeholder text
 * ("Question" / "Description" / "Title"). Sleeps and in-place retries do NOT
 * fix it: getTitle() reads the local pending value, so it can't even detect a
 * dropped server write. Instead, after building, this script RE-OPENS the form
 * by ID (which forces pending writes to flush and returns TRUE server state),
 * then re-applies any titles/help that didn't stick, repeating until a fresh
 * read-back matches. Watch the execution log — it prints how many fixes each
 * round applied and a final "all correct" (or warning) line.
 */

// ==================================================================
// DATA — zone/area roster, sourced from config/AREAS.csv (Zone,Area
// columns). TODO(roster): EMPTY — populate before running the builder.
// ==================================================================
var AREAS_HEADERS = ['Zone', 'Area'];
var AREAS_ROWS = []; // TODO(roster): paste rows from config/AREAS.csv here

// Resolves 'Zone'/'Area' column positions by NAME once, then groups
// AREAS_ROWS into per-zone sections: { zoneName: [areaName, ...] }.
// Never call headers.indexOf() anywhere else in this file — go through
// this map (or areaChoicesForZone_() below) instead.
function buildZoneSections_() {
  var col = {};
  AREAS_HEADERS.forEach(function(h, i) { col[h] = i; });

  var sections = {};
  var zoneOrder = [];
  AREAS_ROWS.forEach(function(row) {
    var zone = row[col['Zone']];
    var area = row[col['Area']];
    if (!sections[zone]) { sections[zone] = []; zoneOrder.push(zone); }
    sections[zone].push(area);
  });
  return { sections: sections, zoneOrder: zoneOrder };
}

// Returns the area list ("section") for a single zone name.
function areaChoicesForZone_(zoneName) {
  return buildZoneSections_().sections[zoneName] || [];
}

// ==================================================================
// DATA — the per-area question set, in order (Spanish). Order + wording
// verbatim from METRIC_CATALOG_ES.md v2's 12 nightly metrics.
//   type: 'date' | 'yesno' | 'number' | 'effort' | 'yes'
//   yes  = single "Sí" checkbox (required flag set per item)
// ==================================================================
var QUESTIONS = [
  { type: 'date',   title: '¿Qué fecha está ingresando?',
    help: 'Ingrese la fecha correspondiente al día que está reportando. En la mayoría de los casos, será la fecha de hoy. Si está registrando información de un día anterior, ingrese la fecha en que realmente ocurrieron las actividades, no la fecha en que está enviando el informe.' }, // [CCSM verbatim]

  { type: 'number', title: 'Nuevas personas encontradas',
    help: 'Cada persona (que no haya sido bautizada) que haya recibido una lección durante la semana, que no haya sido enseñada en los últimos tres meses y que haya aceptado una cita específica para regresar. Normalmente, una lección incluye una oración (cuando sea apropiado), la enseñanza de al menos un principio del evangelio y una invitación.' }, // [CCSM verbatim]

  { type: 'number', title: 'Intentos de contacto con amigos',
    help: 'Cuente cada intento de contactar a un amigo hoy, independientemente de si la persona respondió o no. Si nadie respondió, igualmente cuenta aquí. Incluye los intentos realizados en cualquier lugar — en la calle, en lugares públicos, por referencia o de cualquier otra forma.' }, // [CCSM — edited per President 2026-08-29: "doors" wording removed]

  { type: 'number', title: 'Contactos con amigos',
    help: 'Cuente cada ocasión en la que una persona respondió y usted logró establecer contacto. Todo contacto también cuenta como un intento de contacto. Incluye los contactos hechos en cualquier lugar — en la calle, en lugares públicos o por referencia.' }, // [CCSM — edited per President 2026-08-29: "doors" wording removed]

  { type: 'number', title: 'Conversaciones significativas con amigos',
    help: 'Una conversación con un amigo que duró más de tres minutos e incluyó un principio o mensaje del evangelio. Sea honesto consigo mismo: ¿fue realmente una conversación significativa? Si la respuesta es sí, también cuenta como un contacto y un intento de contacto.' }, // [CCSM verbatim]

  { type: 'number', title: 'Lecciones con amigos',
    help: 'Una visita con un amigo en la que usted enseñó un principio del evangelio y extendió una invitación. Cada lección también cuenta como una conversación significativa, un contacto y un intento de contacto. El número de lecciones nunca debe ser mayor que el de conversaciones significativas. Si lo es, revise nuevamente sus registros.' }, // [CCSM verbatim]

  { type: 'number', title: 'Lecciones con un miembro presente',
    help: 'La cantidad de lecciones dadas hoy en las que estuvieron presentes tanto un amigo como un miembro de la Iglesia. No corresponde al total de lecciones, sino únicamente a aquellas en las que también participó un miembro.' }, // [CCSM verbatim]

  { type: 'number', title: 'Lecciones con conversos recientes',
    help: 'Las lecciones dadas hoy únicamente a conversos recientes. No incluya amigos en este conteo; es exclusivamente para conversos recientes.' }, // [CCSM verbatim]

  { type: 'number', title: 'Invitaciones a la Iglesia extendidas',
    help: 'La cantidad de amigos a quienes usted invitó personalmente a asistir a una reunión o actividad de la Iglesia hoy. Cuente cada invitación, independientemente de si fue aceptada o rechazada.' }, // [CCSM verbatim]

  { type: 'number', title: 'Copias del Libro de Mormón entregadas',
    help: 'La cantidad de copias del Libro de Mormón que entregó hoy a amigos, ya sean físicos o digitales. Cuente cada persona que recibió uno.' }, // [CCSM verbatim]

  { type: 'effort', title: '¿Dio todo, la mayor parte o algo de esfuerzo en el altar del sacrificio hoy?',
    help: 'Una autoevaluación personal del esfuerzo que usted dio hoy. Sea honesto: esto es entre usted y el Señor. Seleccione Todo si dio todo lo que tenía sin reservas, La mayor parte si trabajó diligentemente pero sintió que pudo haber dado un poco más, o Algo si su esfuerzo fue solo parcial. No se trata de ser perfecto, sino de ser honesto.' }, // [CCSM verbatim]

  { type: 'number', title: 'Invitaciones al bautismo extendidas',
    help: 'La cantidad de personas a quienes invitó claramente a bautizarse hoy. Cuente cada invitación, independientemente de si fue aceptada, rechazada o pospuesta.' }, // [CCSM verbatim]

  { type: 'number', title: 'Calendarios bautismales entregados',
    help: 'La cantidad de calendarios bautismales o planes de preparación para el bautismo que entregó a personas que se están preparando para bautizarse. Cuente cada persona que recibió uno.' } // [CCSM verbatim]
];

// Accumulates the expected {title, help} for every item, in creation order,
// so verifyAndFix_ can repair any writes the Advanced Service dropped.
var gExpected = [];

// ==================================================================
// BUILDER
// ==================================================================
function buildDailyReportFormES() {
  gExpected = [];

  var form = FormApp.create('Informe Diario Misional — Honduras San Pedro Sula East');
  form.setDescription('Informe misional nocturno. Elija su zona, luego su área, y luego ingrese los números de hoy.');
  form.setProgressBar(true);
  form.setAllowResponseEdits(false);
  form.setCollectEmail(false);

  // Section 1: the zone selector (choices + branching set after sections exist).
  var zoneItem = form.addListItem();
  setMeta_(zoneItem, '¿En qué zona sirve?', 'La zona en la que usted sirve. Seleccione su zona cada vez que envíe el informe nocturno.');
  zoneItem.setRequired(true);

  // One section per zone.
  var zoneChoices = [];
  var zoneOrder = buildZoneSections_().zoneOrder;
  for (var i = 0; i < zoneOrder.length; i++) {
    var zone = zoneOrder[i];

    var pageBreak = form.addPageBreakItem();
    setMeta_(pageBreak, zone, null);

    // Area dropdown for this zone — choices are that zone's section
    // (areaChoicesForZone_), never a positional headers.indexOf() lookup.
    var areaItem = form.addListItem();
    setMeta_(areaItem, '¿En qué área sirve?', 'El área en la que usted sirve. Seleccione su área cada vez que envíe el informe nocturno.');
    areaItem.setChoiceValues(areaChoicesForZone_(zone));
    areaItem.setRequired(true);

    // The full nightly question set.
    addQuestions_(form);

    // Finishing this zone's section submits the form (skip the other zones).
    pageBreak.setGoToPage(FormApp.PageNavigationType.SUBMIT);

    // Route the zone selector into this section.
    zoneChoices.push(zoneItem.createChoice(zone, pageBreak));
  }
  zoneItem.setChoices(zoneChoices);

  // New, dedicated responses spreadsheet (kept off any live sheet).
  var ss = SpreadsheetApp.create('Informe Diario Misional (Respuestas)');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  // Self-healing pass: re-open the form (forces a server flush + true read-back)
  // and re-apply any titles/help the Advanced Service dropped during the build.
  verifyAndFix_(form.getId(), gExpected);

  Logger.log('DONE.');
  Logger.log('Form (edit):   ' + form.getEditUrl());
  Logger.log('Form (live):   ' + form.getPublishedUrl());
  Logger.log('Responses sheet: ' + ss.getUrl());
}

function addQuestions_(form) {
  for (var q = 0; q < QUESTIONS.length; q++) {
    var def = QUESTIONS[q];
    var item;
    switch (def.type) {

      case 'date':
        item = form.addDateItem();
        setMeta_(item, def.title, def.help);
        item.setIncludesYear(true).setRequired(true);
        break;

      case 'yesno':
        item = form.addMultipleChoiceItem();
        setMeta_(item, def.title, def.help);
        item.setChoiceValues(['Sí', 'No']).setRequired(true);
        break;

      case 'effort':
        item = form.addMultipleChoiceItem();
        setMeta_(item, def.title, def.help);
        item.setChoiceValues(['Todo', 'La mayor parte', 'Algo']).setRequired(true);
        break;

      case 'yes':
        item = form.addCheckboxItem();
        setMeta_(item, def.title, def.help);
        item.setChoiceValues(['Sí']).setRequired(!!def.required);
        break;

      case 'number':
      default:
        item = form.addTextItem();
        setMeta_(item, def.title, def.help);
        item.setRequired(true);
        var validation = FormApp.createTextValidation()
          .setHelpText('Ingrese un número (0 o más).')
          .requireNumberGreaterThanOrEqualTo(0)
          .build();
        item.setValidation(validation);
        break;
    }
  }
}

// Sets title/help on a freshly-created item AND records what it should be
// (in creation order) so verifyAndFix_ can repair drops afterward.
function setMeta_(item, title, help) {
  if (title != null) item.setTitle(title);
  if (help != null) item.setHelpText(help);
  gExpected.push({ title: (title != null ? title : null), help: (help != null ? help : null) });
}

// Re-opens the form by ID (forcing pending writes to flush + a true server
// read), then re-applies any title/help that didn't stick. Repeats until a
// fresh read-back is clean or the round cap is hit. Items come back from
// getItems() in creation order, so they line up with gExpected by index.
function verifyAndFix_(formId, expected) {
  var maxRounds = 20;
  for (var round = 1; round <= maxRounds; round++) {
    var f = FormApp.openById(formId);
    var items = f.getItems();
    if (items.length !== expected.length) {
      Logger.log('Verify WARNING: form has ' + items.length + ' items but expected ' + expected.length + '.');
    }
    var fixes = 0;
    var n = Math.min(items.length, expected.length);
    for (var i = 0; i < n; i++) {
      var it = items[i], exp = expected[i];
      if (exp.title != null && it.getTitle() !== exp.title) { it.setTitle(exp.title); fixes++; }
      if (exp.help != null && it.getHelpText() !== exp.help) { it.setHelpText(exp.help); fixes++; }
    }
    Logger.log('Verify round ' + round + ': applied ' + fixes + ' fix(es).');
    if (fixes === 0) { Logger.log('Verify: all titles/help correct.'); return; }
    Utilities.sleep(800);
  }
  // Final read-back to flush the last round of fixes and report the truth.
  var ff = FormApp.openById(formId).getItems();
  var bad = 0, m = Math.min(ff.length, expected.length);
  for (var j = 0; j < m; j++) {
    var e = expected[j];
    if (e.title != null && ff[j].getTitle() !== e.title) bad++;
    if (e.help != null && ff[j].getHelpText() !== e.help) bad++;
  }
  Logger.log(bad === 0
    ? 'Verify: all titles/help correct after final pass.'
    : ('Verify WARNING: ' + bad + ' field(s) still wrong after ' + maxRounds + ' rounds — just re-run the script.'));
}
