/**
 * Formulario de Milagros — Google Form builder (Spanish)
 * Honduras San Pedro Sula East Mission (HSPSE)
 * ------------------------------------------------------------------
 * A missionary shares a miracle or faith-promoting experience. Modeled
 * on the Provo (upm) PMG Compass "Miracles" form: submissions land in a
 * linked response tab (rename it MIRACLES on COMPASS_HSPSE) and mission
 * leadership reviews them on the dashboard, where each row can be turned
 * into a shareable PDF (Gemini fixes spelling + translates ES->EN).
 *
 * There is no processing agent — this form only collects. The Provo
 * dashboard reads the tab column-name-agnostically (it treats the
 * longest free-text column as the story and everything else as meta),
 * so exact column order is not load-bearing here; keep it readable.
 *
 * Columns produced (Timestamp is column 0, added by Forms):
 *   1: Nombre del misionero
 *   2: Zona
 *   3: Área
 *   4: Fecha del milagro
 *   5: Cuente lo que sucedió        <- the "story" column
 *
 * ZONES is the same President-confirmed alphabetical list the nightly
 * and weekly form builders carry. "Misioneros de Servicio" is excluded.
 *
 * HOW TO USE
 *   1. https://script.google.com -> New project.
 *   2. Delete the sample code, paste THIS ENTIRE FILE in.
 *   3. Run  buildMiracleFormES  (first run: approve the permission prompt).
 *   4. The Execution log prints the form's edit + live URLs and the URL
 *      of the freshly-created linked responses spreadsheet.
 *   5. Re-link the form to COMPASS_HSPSE and rename the new tab MIRACLES.
 *
 * SAFE TO RE-RUN: each run creates a brand-new form + sheet.
 */

var ZONES = ["El Carmen", "La Ceiba", "La Paz", "Miramar", "Olanchito", "Palermo", "Planeta", "Progreso", "Santa Rita", "Satélite"];

var MIRACLE_ITEMS = [
  { type: 'text', title: 'Nombre del misionero',
    help: 'Su nombre completo (por ejemplo, "Élder Pérez" o "Hermana López"). Si el milagro involucró a su compañero(a), puede incluir ambos nombres.' },
  { type: 'zone', title: 'Zona',
    help: 'La zona en la que sirve.' },
  { type: 'text', title: 'Área',
    help: 'El área en la que ocurrió el milagro.' },
  { type: 'date', title: 'Fecha del milagro',
    help: 'Aproximadamente cuándo sucedió. Si no recuerda el día exacto, una fecha cercana está bien.' },
  { type: 'paragraph', title: 'Cuente lo que sucedió',
    help: 'Describa el milagro o la experiencia que fortaleció su fe. Escriba con sus propias palabras, con el detalle que quiera — la presidencia de la misión lo leerá y podrá compartirlo con la misión.' }
];

var gExpected = [];

function buildMiracleFormES() {
  gExpected = [];

  var form = FormApp.create('Milagros — Honduras San Pedro Sula East');
  form.setDescription('Comparta un milagro o una experiencia que haya fortalecido su fe. La presidencia de la misión lee cada uno.');
  form.setProgressBar(false);
  form.setAllowResponseEdits(false);
  form.setCollectEmail(false);

  for (var i = 0; i < MIRACLE_ITEMS.length; i++) {
    var def = MIRACLE_ITEMS[i];
    var item;
    switch (def.type) {
      case 'zone':
        item = form.addListItem();
        setMeta_(item, def.title, def.help);
        item.setChoiceValues(ZONES).setRequired(true);
        break;
      case 'date':
        item = form.addDateItem();
        setMeta_(item, def.title, def.help);
        item.setIncludesYear(true).setRequired(false);
        break;
      case 'paragraph':
        item = form.addParagraphTextItem();
        setMeta_(item, def.title, def.help);
        item.setRequired(true);
        break;
      case 'text':
      default:
        item = form.addTextItem();
        setMeta_(item, def.title, def.help);
        item.setRequired(true);
        break;
    }
  }

  var ss = SpreadsheetApp.create('Milagros (Respuestas)');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  verifyAndFix_(form.getId(), gExpected);

  Logger.log('DONE.');
  Logger.log('Form (edit):   ' + form.getEditUrl());
  Logger.log('Form (live):   ' + form.getPublishedUrl());
  Logger.log('Responses sheet: ' + ss.getUrl());
  Logger.log('NEXT: re-link to COMPASS_HSPSE and rename the new tab MIRACLES.');
}

function setMeta_(item, title, help) {
  if (title != null) item.setTitle(title);
  if (help != null) item.setHelpText(help);
  gExpected.push({ title: (title != null ? title : null), help: (help != null ? help : null) });
}

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
  Logger.log('Verify WARNING: still not clean after ' + maxRounds + ' rounds — just re-run the script.');
}
