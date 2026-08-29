/**
 * Informe Semanal Misional — Google Form builder (Spanish version)
 * Honduras San Pedro Sula East Mission (HSPSE)
 * ------------------------------------------------------------------
 * Wording/keys/order sourced VERBATIM from METRIC_CATALOG_ES.md v2
 * (President sign-off 2026-08-29). Do not paraphrase Spanish — if wording
 * needs to change, change METRIC_CATALOG_ES.md first, then this file.
 *
 * v2 CHANGES vs the v1 draft this replaces:
 *   - ki_member_lessons KEPT (was flagged "drop?" in v1) — reworded per the
 *     President to "Lecciones con miembros participando": a member actively
 *     participating (teaching/testifying/supporting), not merely present.
 *     Distinct from the nightly `lessons_member_present` (presence only).
 *   - ki_rc_could_attend help text finalized: count every RC in the area
 *     this week including those out of town/sick; exclude only confirmed
 *     moved-away RCs of unknown whereabouts.
 *   - 8 KIs now (was 7 in the v1 draft) — 16 Real/Meta questions total.
 *
 * ZONE/AREA DATA: ZONES + AREAS_ROWS below are sourced from the IMOS roster
 * export (roster_staging/, 2026-08-29) — 10 zones, 81 areas, President-
 * confirmed alphabetical zone order. Keep both in sync with config/AREAS.csv
 * and with HspsemData.gs's HSPSEM_ZONES/HSPSEM_AREAS_ROWS — all three copies
 * must match (same pattern CCSM used for its ZONES/CCSM_ZONES pair). The
 * "Misioneros de Servicio" zone is permanently excluded — never add it here.
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
 *   3. Run  buildWeeklyReportFormES  (first run: approve the permission prompt).
 *   4. The Execution log prints the form's edit + live URLs and the URL of
 *      the freshly-created linked responses spreadsheet.
 *
 * SAFE TO RE-RUN: each run creates a brand-new form + sheet; it never edits
 * an existing one.
 *
 * WHY THE VERIFY/FIX PASS: this form creates 40+ items, and Google's Forms
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
// DATA — zone dropdown order, President-confirmed 2026-08-29 (alphabetical).
// Drives the per-zone section loop below.
// ==================================================================
var ZONES = ["El Carmen", "La Ceiba", "La Paz", "Miramar", "Olanchito", "Palermo", "Planeta", "Progreso", "Santa Rita", "Satélite"];

// ==================================================================
// DATA — the 81 teaching areas (Zone,Area), sourced from config/AREAS.csv.
// Area order within each zone follows district grouping — confirmed fine.
// ==================================================================
var AREAS_HEADERS = ['Zone', 'Area'];
var AREAS_ROWS = [
  ['El Carmen', 'El Carmen'], ['El Carmen', 'La Aldea 1'], ['El Carmen', 'Ocotillo'],
  ['El Carmen', 'Calpules'], ['El Carmen', 'Las Lomas'], ['El Carmen', 'San Juan'],
  ['La Ceiba', 'Acacias'], ['La Ceiba', 'Jutiapa'], ['La Ceiba', 'Pizzaty 1'],
  ['La Ceiba', 'Pizzaty 2'], ['La Ceiba', 'El Imán'], ['La Ceiba', 'Independencia'],
  ['La Ceiba', 'Lempira 1'], ['La Ceiba', 'Lempira 2'], ['La Ceiba', 'Flowers Bay'],
  ['La Ceiba', 'Los Fuertes'], ['La Ceiba', 'Roatán'], ['La Ceiba', 'Sandy Bay'],
  ['La Ceiba', 'Utila'], ['La Paz', 'Flores de Oriente'], ['La Paz', 'La Paz'],
  ['La Paz', 'Pineda'], ['La Paz', 'El Porvenir'], ['La Paz', 'La Sabana'],
  ['La Paz', 'San Manuel 2'], ['Miramar', 'Buenos Aires'], ['Miramar', 'Confite 1'],
  ['Miramar', 'Confite 2'], ['Miramar', 'La Masica'], ['Miramar', 'Mezapita'],
  ['Miramar', 'San Juan Pueblo'], ['Miramar', 'Miramar'], ['Miramar', 'Montecristo 1'],
  ['Miramar', 'Montecristo 2'], ['Olanchito', 'Bellavista'], ['Olanchito', 'Coyoles 1'],
  ['Olanchito', 'Coyoles 2'], ['Olanchito', 'Olanchito'], ['Olanchito', 'Sabá 1'],
  ['Olanchito', 'Sabá 2'], ['Olanchito', 'Isletas Central'], ['Olanchito', 'Sonaguera 1'],
  ['Olanchito', 'Sonaguera 2'], ['Olanchito', 'Tocoa 1'], ['Olanchito', 'Tocoa 2'],
  ['Olanchito', 'Trujillo 1'], ['Olanchito', 'Trujillo 2'], ['Palermo', 'Palermo'],
  ['Palermo', 'Sarrosa 1'], ['Palermo', 'Sarrosa 2'], ['Palermo', 'Bendeck'],
  ['Palermo', 'Palmeras'], ['Palermo', 'William Hall'], ['Planeta', 'Jerusalén 1'],
  ['Planeta', 'La Mesa'], ['Planeta', 'La Lima 1'], ['Planeta', 'La Lima 2'],
  ['Planeta', 'Planeta 1'], ['Planeta', 'Planeta 2'], ['Progreso', 'Berlín 1'],
  ['Progreso', 'Berlín 2'], ['Progreso', 'Mezapa'], ['Progreso', 'Corocol'],
  ['Progreso', 'El Centro'], ['Progreso', 'Jazmines'], ['Progreso', 'Progreso'],
  ['Progreso', 'Tela'], ['Progreso', 'Telamar'], ['Santa Rita', 'El Negrito'],
  ['Santa Rita', 'Morazán 1'], ['Santa Rita', 'Aguablanca'], ['Santa Rita', 'Santa Rita'],
  ['Santa Rita', 'Yoro 1'], ['Santa Rita', 'Yoro 2'], ['Satélite', 'Central'],
  ['Satélite', 'Los Ángeles'], ['Satélite', 'Seis de Mayo 1'], ['Satélite', 'Luisiana 1'],
  ['Satélite', 'Planes'], ['Satélite', 'Satelite 1'], ['Satélite', 'Satelite 2']
];

// Resolves 'Zone'/'Area' column positions by NAME once, then groups
// AREAS_ROWS into per-zone sections: { zoneName: [areaName, ...] }.
// Never call headers.indexOf() anywhere else in this file — go through
// this map (or areaChoicesForZone_() below) instead.
function buildZoneSections_() {
  var col = {};
  AREAS_HEADERS.forEach(function(h, i) { col[h] = i; });

  var sections = {};
  AREAS_ROWS.forEach(function(row) {
    var zone = row[col['Zone']];
    var area = row[col['Area']];
    if (!sections[zone]) { sections[zone] = []; }
    sections[zone].push(area);
  });
  return sections;
}

// Returns the area list ("section") for a single zone name.
function areaChoicesForZone_(zoneName) {
  return buildZoneSections_()[zoneName] || [];
}

// ==================================================================
// DATA — the intro questions asked before the Real/Meta groups (Spanish).
//   type: 'date' | 'yesno'
// ==================================================================
var INTRO_QUESTIONS = [
  { type: 'date', title: '¿Qué fecha está ingresando?',
    help: 'Ingrese la fecha correspondiente al día que está reportando. En la mayoría de los casos, será la fecha de hoy. Si está registrando información de un día anterior, ingrese la fecha en que realmente ocurrieron las actividades, no la fecha en que está enviando el informe.' }, // [CCSM verbatim]

  { type: 'yesno', title: '¿Recibió una llamada de sus líderes?',
    help: 'Seleccione Sí si recibió una llamada de ministración de sus líderes durante esta semana. Seleccione No si no recibió una llamada de ministración durante esta semana.' }, // [CCSM verbatim]

  { type: 'yesno', title: '¿Usted y sus líderes locales realizaron una reunión de coordinación semanal?',
    help: 'Seleccione Sí si participó en una reunión de coordinación semanal con los líderes de su barrio o rama. Seleccione No si no se llevó a cabo una reunión de coordinación semanal durante la semana.' } // [CCSM verbatim]
];

// ==================================================================
// DATA — the 8 weekly key indicators, in order (Spanish). Rendered twice:
// once as "Real" results, once as "Meta" targets. Order + keys from
// METRIC_CATALOG_ES.md v2's key summary: ki_pew, ki_baptismal_date,
// ki_baptized_confirmed, ki_rc_at_church, ki_rc_could_attend,
// ki_new_people_found, ki_first_week_church, ki_member_lessons.
// ki_member_lessons and ki_rc_could_attend carry their own help text
// (below); the rest use only a title, same as CCSM's pattern.
// ==================================================================
var KEY_INDICATORS = [
  'Amigos en la reunión sacramental',
  'Amigos con fecha bautismal',
  'Bautizados y confirmados',
  'Conversos recientes en la Iglesia',
  'Conversos recientes que podían asistir', // [NEW — President signed off 2026-08-29]
  'Nuevas personas encontradas',
  'Amigos en la Iglesia durante su primera semana de enseñanza',
  'Lecciones con miembros participando' // [CCSM — edited per President 2026-08-29: KEEP, reworded]
];

// Help text for KIs that carry one (index-matched to KEY_INDICATORS by
// title). Every other KI gets no help text, matching CCSM's convention.
var KEY_INDICATOR_HELP = {
  'Conversos recientes que podían asistir':
    'El número total de conversos recientes en su área esta semana. Incluya a todos — también a quienes estaban temporalmente fuera de la ciudad o enfermos. Excluya únicamente a los conversos recientes que se han mudado de forma confirmada y de quienes no se sabe su paradero. Se usa junto con "Conversos recientes en la Iglesia" para calcular el porcentaje de asistencia.', // [NEW — President signed off 2026-08-29]
  'Lecciones con miembros participando':
    'El número de lecciones esta semana en las que un miembro de la Iglesia participó activamente — no solo estuvo presente, sino que ayudó a enseñar, compartió su testimonio o apoyó de otra forma en la lección. Distinto del indicador nocturno "Lecciones con un miembro presente", que solo requiere que el miembro estuviera presente.' // [CCSM — edited per President 2026-08-29]
};

// Accumulates the expected {title, help} for every item, in creation order,
// so verifyAndFix_ can repair any writes the Advanced Service dropped.
var gExpected = [];

// ==================================================================
// BUILDER
// ==================================================================
function buildWeeklyReportFormES() {
  gExpected = [];

  var form = FormApp.create('Informe Semanal Misional — Honduras San Pedro Sula East');
  form.setDescription('Informe misional semanal. Elija su zona, luego su área, y luego ingrese los resultados de esta semana y las metas de la próxima semana.');
  form.setProgressBar(true);
  form.setAllowResponseEdits(false);
  form.setCollectEmail(false);

  // Section 1: the zone selector (choices + branching set after sections exist).
  var zoneItem = form.addListItem();
  setMeta_(zoneItem, '¿En qué zona sirve?', 'La zona en la que usted sirve. Seleccione su zona cada vez que envíe el informe semanal.');
  zoneItem.setRequired(true);

  // One section per zone.
  var zoneChoices = [];
  for (var i = 0; i < ZONES.length; i++) {
    var zone = ZONES[i];

    var pageBreak = form.addPageBreakItem();
    setMeta_(pageBreak, zone, null);

    // Area dropdown for this zone — choices are that zone's section
    // (areaChoicesForZone_), never a positional headers.indexOf() lookup.
    var areaItem = form.addListItem();
    setMeta_(areaItem, '¿En qué área sirve?', 'El área en la que usted sirve. Seleccione su área cada vez que envíe el informe semanal.');
    areaItem.setChoiceValues(areaChoicesForZone_(zone));
    areaItem.setRequired(true);

    addIntroQuestions_(form);
    addKeyIndicatorGroup_(form, 'Indicadores Clave Semanales (Resultados)',
      'Estos indicadores representan los resultados obtenidos durante la semana pasada, de acuerdo con las normas establecidas en Predicad Mi Evangelio. Ingrese los mismos números que registró en los indicadores clave semanales de la aplicación Predicad Mi Evangelio.',
      KEY_INDICATORS, 'Real');
    addKeyIndicatorGroup_(form, 'Indicadores Clave Semanales (Metas)',
      'Estos indicadores representan las metas que usted estableció durante la planificación semanal para la semana siguiente, de acuerdo con las normas establecidas en Predicad Mi Evangelio. Ingrese las mismas metas que registró en la aplicación Predicad Mi Evangelio.',
      KEY_INDICATORS, 'Meta');

    // Finishing this zone's section submits the form (skip the other zones).
    pageBreak.setGoToPage(FormApp.PageNavigationType.SUBMIT);

    // Route the zone selector into this section.
    zoneChoices.push(zoneItem.createChoice(zone, pageBreak));
  }
  zoneItem.setChoices(zoneChoices);

  // New, dedicated responses spreadsheet (kept off any live sheet).
  var ss = SpreadsheetApp.create('Informe Semanal Misional (Respuestas)');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  // Self-healing pass: re-open the form (forces a server flush + true read-back)
  // and re-apply any titles/help the Advanced Service dropped during the build.
  verifyAndFix_(form.getId(), gExpected);

  Logger.log('DONE.');
  Logger.log('Form (edit):   ' + form.getEditUrl());
  Logger.log('Form (live):   ' + form.getPublishedUrl());
  Logger.log('Responses sheet: ' + ss.getUrl());
}

function addIntroQuestions_(form) {
  for (var q = 0; q < INTRO_QUESTIONS.length; q++) {
    var def = INTRO_QUESTIONS[q];
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
    }
  }
}

function addKeyIndicatorGroup_(form, sectionTitle, sectionHelp, titles, suffix) {
  var header = form.addSectionHeaderItem();
  setMeta_(header, sectionTitle, sectionHelp);

  for (var k = 0; k < titles.length; k++) {
    var item = form.addTextItem();
    setMeta_(item, titles[k] + ' (' + suffix + ')', KEY_INDICATOR_HELP[titles[k]] || null);
    item.setRequired(true);
    var validation = FormApp.createTextValidation()
      .setHelpText('Ingrese un número (0 o más).')
      .requireNumberGreaterThanOrEqualTo(0)
      .build();
    item.setValidation(validation);
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
