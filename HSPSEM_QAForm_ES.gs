/**
 * Formulario de Preguntas y Sugerencias — Google Form builder (Spanish)
 * Honduras San Pedro Sula East Mission (HSPSE)
 * ------------------------------------------------------------------
 * The THIRD HSPSE form (after the nightly + weekly report forms). A
 * missionary picks "Pregunta" or "Sugerencia", then gives their name,
 * email and message. HSPSEM_AgentQA.gs's onFormSubmit handler
 * (onQAFormSubmit) reads the linked response row POSITIONALLY, so the
 * question order below is load-bearing — it must produce exactly these
 * columns (Timestamp is column 0, added by Forms):
 *
 *   1: ¿Es una pregunta o una sugerencia?
 *   2: Nombre    (sección de sugerencia)
 *   3: Correo    (sección de sugerencia)
 *   4: Mensaje   (sección de sugerencia)
 *   5: Nombre    (sección de pregunta)
 *   6: Correo    (sección de pregunta)
 *   7: Mensaje   (sección de pregunta)
 *
 * This matches the field map documented in HSPSEM_AgentQA.gs and in
 * HSPSEM_DEPLOYMENT.md §9.2b (which flagged it "not verified — no such
 * form exists"). Building the form from this file makes it real: Google
 * Forms writes every question to the response sheet in form order
 * regardless of page-break branching, so the two 3-question sections
 * land at columns 2-4 and 5-7 exactly.
 *
 * The handler lowercases column 1 and looks for the substrings
 * "sugerencia" / "pregunta", so the two type choices MUST contain those
 * words — keep them as "Sugerencia" and "Pregunta".
 *
 * HOW TO USE
 *   1. https://script.google.com -> New project.
 *   2. Delete the sample code, paste THIS ENTIRE FILE in.
 *   3. Run  buildQAFormES  (first run: approve the permission prompt).
 *   4. The Execution log prints the form's edit + live URLs and the URL
 *      of the freshly-created linked responses spreadsheet.
 *   5. Re-link the form to COMPASS_HSPSE (Responses -> link to Sheets ->
 *      existing spreadsheet), rename the new tab to QA_FORM_RAW, and run
 *      setupQAFormTrigger() / setupQA() in the BOUND project so
 *      onQAFormSubmit fires.
 *
 * SAFE TO RE-RUN: each run creates a brand-new form + sheet.
 *
 * The verify/fix pass is the same one the nightly/weekly builders use —
 * Google's Forms service intermittently drops a setTitle()/setHelpText()
 * write, so after building this re-opens the form by ID and re-applies
 * anything that didn't stick.
 */

// Timestamp is column 0. Every item below is created in this order and
// flattened to columns 1..7 by Forms regardless of branching.
var QA_ITEMS = [
  { section: null,
    type: 'choice',
    title: '¿Es una pregunta o una sugerencia?',
    help: 'Elija "Pregunta" si necesita una respuesta sobre cómo usar PMG Compass, los formularios o los indicadores. Elija "Sugerencia" si quiere proponer una idea o mejora para la misión.',
    choices: ['Pregunta', 'Sugerencia'] },

  { section: 'Sugerencia',
    sectionHelp: 'Comparta su idea para mejorar la misión o PMG Compass. La presidencia de la misión la revisará.',
    type: 'text', title: 'Nombre',
    help: 'Su nombre completo (por ejemplo, "Élder Pérez" o "Hermana López").' },
  { section: null, type: 'text', title: 'Correo',
    help: 'Su correo de misionero (@churchofjesuschrist.org). Solo se usa si la presidencia necesita responderle.' },
  { section: null, type: 'paragraph', title: 'Mensaje',
    help: 'Escriba su sugerencia con el mayor detalle posible.' },

  { section: 'Pregunta',
    sectionHelp: 'Escriba su pregunta sobre PMG Compass, los formularios, los indicadores o los procesos de la misión. Recibirá una respuesta por correo.',
    type: 'text', title: 'Nombre',
    help: 'Su nombre completo (por ejemplo, "Élder Pérez" o "Hermana López").' },
  { section: null, type: 'text', title: 'Correo',
    help: 'Su correo de misionero (@churchofjesuschrist.org). La respuesta se enviará a esta dirección.' },
  { section: null, type: 'paragraph', title: 'Mensaje',
    help: 'Escriba su pregunta. Sea específico — mientras más contexto dé, mejor será la respuesta.' }
];

var gExpected = [];

function buildQAFormES() {
  gExpected = [];

  var form = FormApp.create('Preguntas y Sugerencias — Honduras San Pedro Sula East');
  form.setDescription('Use este formulario para hacer una pregunta sobre PMG Compass o para enviar una sugerencia a la presidencia de la misión.');
  form.setProgressBar(false);
  form.setAllowResponseEdits(false);
  form.setCollectEmail(false);

  var typeItem = null;
  var sectionBreaks = {};

  for (var i = 0; i < QA_ITEMS.length; i++) {
    var def = QA_ITEMS[i];

    if (def.section) {
      var pb = form.addPageBreakItem();
      setMeta_(pb, def.section, def.sectionHelp || null);
      pb.setGoToPage(FormApp.PageNavigationType.SUBMIT);
      sectionBreaks[def.section] = pb;
    }

    var item;
    switch (def.type) {
      case 'choice':
        item = form.addMultipleChoiceItem();
        setMeta_(item, def.title, def.help);
        item.setChoiceValues(def.choices).setRequired(true);
        typeItem = item;
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

  // Route the type choice into its matching section.
  typeItem.setChoices([
    typeItem.createChoice('Pregunta',   sectionBreaks['Pregunta']),
    typeItem.createChoice('Sugerencia', sectionBreaks['Sugerencia'])
  ]);

  var ss = SpreadsheetApp.create('Preguntas y Sugerencias (Respuestas)');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  verifyAndFix_(form.getId(), gExpected);

  Logger.log('DONE.');
  Logger.log('Form (edit):   ' + form.getEditUrl());
  Logger.log('Form (live):   ' + form.getPublishedUrl());
  Logger.log('Responses sheet: ' + ss.getUrl());
  Logger.log('NEXT: re-link to COMPASS_HSPSE, rename tab QA_FORM_RAW, run setupQA() in the bound project.');
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
