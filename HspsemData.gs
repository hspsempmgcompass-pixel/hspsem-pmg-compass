/**
 * HspsemData.gs — HSPSE shared data module
 * ------------------------------------------------------------------
 * Single source of truth for the HSPSE (Honduras San Pedro Sula East Mission)
 * fork of PMG Compass: zone/area map, the daily/weekly metric maps, form
 * structural strings, initial AGENT_CONFIG rows, the MISSION_ORG roster, and
 * the tab-build spec. The sheet builder and the HSPSEM_* agents both read
 * from these globals — keeping data separate from builder/agent logic means
 * the next mission only has to swap this one file.
 *
 * Forked from CCSM's CcsmData.gs (Chile Concepción South Mission). Spanish
 * text (headerEs / displayEs) is copied CHARACTER-FOR-CHARACTER from
 * METRIC_CATALOG_ES.md v2 (President sign-off 2026-08-29) — the canonical
 * wording contract for HSPSE. Do not paraphrase; if wording needs to
 * change, change METRIC_CATALOG_ES.md first, then this file.
 *
 * v2 STATUS (2026-08-29): President resolved every open question from the
 * v1 draft. Nightly = 12 metrics, no exchanges/roleplays (dropped), no
 * baptismal_dates_set (dropped — tracked weekly via ki_baptismal_date only).
 * Weekly = 8 KIs (ki_member_lessons KEPT + reworded, ki_rc_could_attend
 * KEPT). See METRIC_CATALOG_ES.md for full provenance per metric.
 *
 * ROSTER (2026-08-29): zones + areas loaded from the IMOS CurrentOrganization
 * export (roster_staging/, parsed by parse_hspse_org.py) — 10 teaching zones,
 * 27 districts, 81 areas, 164 teaching missionaries. The "Misioneros de
 * Servicio" zone (10 service missionaries) is permanently excluded from
 * areas/metrics/MISSION_ORG — never add it. HSPSEM_MISSION_ORG_ROWS is
 * still empty: the export has no email column, so companion logins can't be
 * built yet (see roster_staging/README.md "THE BLOCKER"). Keep
 * HSPSEM_AREAS_ROWS/HSPSEM_ZONES in sync with config/AREAS.csv AND with the
 * standalone form builders' own copies (HSPSEM_DailyReportForm_ES.gs /
 * HSPSEM_WeeklyReportForm_ES.gs — separate Apps Script projects, so they
 * each carry their own literal, same as CCSM's ZONES/CCSM_ZONES pattern).
 *
 * SCOPE NOTE: HSPSE drops 10 CCSM nightly metrics the President did not
 * request: exchanges, roleplays, pmf_lessons, rc_lessons_mcp, friend_texts,
 * friend_calls, member_contacts, references_asked, member_referrals_received,
 * baptism_doctrine_lessons — confirmed final by the President 2026-08-29
 * (METRIC_CATALOG_ES.md v2 resolved the v1 exchanges/roleplays ambiguity:
 * both are dropped).
 */

// ==================================================================
// ZONES — dropdown order, President-confirmed 2026-08-29 (alphabetical).
// Drives the per-zone section loop in both form builders and here; area
// choices within each zone come from HSPSEM_AREAS_ROWS below via
// areaChoicesForZone_()-style grouping (resolve columns by name once,
// never headers.indexOf()).
// ==================================================================
var HSPSEM_ZONES = ["El Carmen", "La Ceiba", "La Paz", "Miramar", "Olanchito", "Palermo", "Planeta", "Progreso", "Santa Rita", "Satélite"];

// ==================================================================
// AREAS — HSPSE's 81 teaching areas, sourced from config/AREAS.csv
// (Zone,Area columns; also mirrors roster_staging/hspsem_areas_rows.txt).
// Area order within each zone follows district grouping (see
// roster_staging/areas_with_districts.csv) — confirmed fine as-is.
// ==================================================================
var HSPSEM_AREAS_HEADERS = ['Zone', 'Area'];
var HSPSEM_AREAS_ROWS = [
  ['El Carmen', 'El Carmen'],
  ['El Carmen', 'La Aldea 1'],
  ['El Carmen', 'Ocotillo'],
  ['El Carmen', 'Calpules'],
  ['El Carmen', 'Las Lomas'],
  ['El Carmen', 'San Juan'],
  ['La Ceiba', 'Acacias'],
  ['La Ceiba', 'Jutiapa'],
  ['La Ceiba', 'Pizzaty 1'],
  ['La Ceiba', 'Pizzaty 2'],
  ['La Ceiba', 'El Imán'],
  ['La Ceiba', 'Independencia'],
  ['La Ceiba', 'Lempira 1'],
  ['La Ceiba', 'Lempira 2'],
  ['La Ceiba', 'Flowers Bay'],
  ['La Ceiba', 'Los Fuertes'],
  ['La Ceiba', 'Roatán'],
  ['La Ceiba', 'Sandy Bay'],
  ['La Ceiba', 'Utila'],
  ['La Paz', 'Flores de Oriente'],
  ['La Paz', 'La Paz'],
  ['La Paz', 'Pineda'],
  ['La Paz', 'El Porvenir'],
  ['La Paz', 'La Sabana'],
  ['La Paz', 'San Manuel 2'],
  ['Miramar', 'Buenos Aires'],
  ['Miramar', 'Confite 1'],
  ['Miramar', 'Confite 2'],
  ['Miramar', 'La Masica'],
  ['Miramar', 'Mezapita'],
  ['Miramar', 'San Juan Pueblo'],
  ['Miramar', 'Miramar'],
  ['Miramar', 'Montecristo 1'],
  ['Miramar', 'Montecristo 2'],
  ['Olanchito', 'Bellavista'],
  ['Olanchito', 'Coyoles 1'],
  ['Olanchito', 'Coyoles 2'],
  ['Olanchito', 'Olanchito'],
  ['Olanchito', 'Sabá 1'],
  ['Olanchito', 'Sabá 2'],
  ['Olanchito', 'Isletas Central'],
  ['Olanchito', 'Sonaguera 1'],
  ['Olanchito', 'Sonaguera 2'],
  ['Olanchito', 'Tocoa 1'],
  ['Olanchito', 'Tocoa 2'],
  ['Olanchito', 'Trujillo 1'],
  ['Olanchito', 'Trujillo 2'],
  ['Palermo', 'Palermo'],
  ['Palermo', 'Sarrosa 1'],
  ['Palermo', 'Sarrosa 2'],
  ['Palermo', 'Bendeck'],
  ['Palermo', 'Palmeras'],
  ['Palermo', 'William Hall'],
  ['Planeta', 'Jerusalén 1'],
  ['Planeta', 'La Mesa'],
  ['Planeta', 'La Lima 1'],
  ['Planeta', 'La Lima 2'],
  ['Planeta', 'Planeta 1'],
  ['Planeta', 'Planeta 2'],
  ['Progreso', 'Berlín 1'],
  ['Progreso', 'Berlín 2'],
  ['Progreso', 'Mezapa'],
  ['Progreso', 'Corocol'],
  ['Progreso', 'El Centro'],
  ['Progreso', 'Jazmines'],
  ['Progreso', 'Progreso'],
  ['Progreso', 'Tela'],
  ['Progreso', 'Telamar'],
  ['Santa Rita', 'El Negrito'],
  ['Santa Rita', 'Morazán 1'],
  ['Santa Rita', 'Aguablanca'],
  ['Santa Rita', 'Santa Rita'],
  ['Santa Rita', 'Yoro 1'],
  ['Santa Rita', 'Yoro 2'],
  ['Satélite', 'Central'],
  ['Satélite', 'Los Ángeles'],
  ['Satélite', 'Seis de Mayo 1'],
  ['Satélite', 'Luisiana 1'],
  ['Satélite', 'Planes'],
  ['Satélite', 'Satelite 1'],
  ['Satélite', 'Satelite 2']
];

// ==================================================================
// NIGHTLY (daily) metric map — one row per question on the nightly form,
// in the President's order (ONBOARDING_READINESS.md §3). headerEs/displayEs
// copied verbatim from METRIC_CATALOG_ES.md v2. No baptismal_dates_set —
// dropped 2026-08-29 (weekly ki_baptismal_date covers it). contacts_attempted
// / contacts_made help text has the "doors" sentence removed per v2.
// ==================================================================
var HSPSEM_NIGHTLY_QUESTIONS = [
  { key: 'report_date',              headerEs: '¿Qué fecha está ingresando?', type: 'DATE',   displayEs: 'Fecha del Informe', order: 1 },
  { key: 'new_people_found',         headerEs: 'Nuevas personas encontradas', type: 'NUMBER', displayEs: 'Nuevas Personas Encontradas', order: 2 },
  { key: 'contacts_attempted',       headerEs: 'Intentos de contacto con amigos', type: 'NUMBER', displayEs: 'Intentos de Contacto', order: 3 },
  { key: 'contacts_made',            headerEs: 'Contactos con amigos', type: 'NUMBER', displayEs: 'Contactos', order: 4 },
  { key: 'meaningful_conversations', headerEs: 'Conversaciones significativas con amigos', type: 'NUMBER', displayEs: 'Conversaciones Significativas', order: 5 },
  { key: 'friend_lessons',           headerEs: 'Lecciones con amigos', type: 'NUMBER', displayEs: 'Lecciones con Amigos', order: 6 },
  { key: 'lessons_member_present',   headerEs: 'Lecciones con un miembro presente', type: 'NUMBER', displayEs: 'Lecciones con Miembro Presente', order: 7 },
  { key: 'rc_lessons',               headerEs: 'Lecciones con conversos recientes', type: 'NUMBER', displayEs: 'Lecciones con Conversos Recientes', order: 8 },
  { key: 'church_invites',           headerEs: 'Invitaciones a la Iglesia extendidas', type: 'NUMBER', displayEs: 'Invitaciones a la Iglesia', order: 9 },
  { key: 'bom_shared',               headerEs: 'Copias del Libro de Mormón entregadas', type: 'NUMBER', displayEs: 'Libros de Mormón Entregados', order: 10 },
  { key: 'effort',                   headerEs: '¿Dio todo, la mayor parte o algo de esfuerzo en el altar del sacrificio hoy?', type: 'CHOICE', displayEs: 'Nivel de Esfuerzo', order: 11 },
  { key: 'baptismal_invitations',    headerEs: 'Invitaciones al bautismo extendidas', type: 'NUMBER', displayEs: 'Invitaciones al Bautismo', order: 12 },
  { key: 'baptismal_calendars',      headerEs: 'Calendarios bautismales entregados', type: 'NUMBER', displayEs: 'Calendarios Bautismales Entregados', order: 13 }
];

// ==================================================================
// WEEKLY metric map — 3 intro questions + 8 key-indicator bases, each
// rendered twice (_real / _meta), matching the '<title> (Real)' /
// '<title> (Meta)' pattern CCSM's WeeklyReportForm_ES.gs uses. Key names
// and order follow METRIC_CATALOG_ES.md v2's "Metric key summary".
// ki_rc_could_attend and ki_member_lessons are both President-approved
// 2026-08-29 (ki_member_lessons reworded to "participating", not merely
// present — see METRIC_CATALOG_ES.md for the distinction from the nightly
// lessons_member_present).
// ==================================================================
var HSPSEM_WEEKLY_QUESTIONS = [
  { key: 'report_date',          headerEs: '¿Qué fecha está ingresando?', type: 'DATE',  displayEs: 'Fecha del Informe Semanal', order: 1 },
  { key: 'leader_call',          headerEs: '¿Recibió una llamada de sus líderes?', type: 'YESNO', displayEs: 'Llamada de Líderes', order: 2 },
  { key: 'coordination_meeting', headerEs: '¿Usted y sus líderes locales realizaron una reunión de coordinación semanal?', type: 'YESNO', displayEs: 'Reunión de Coordinación Semanal', order: 3 },

  { key: 'ki_pew_real',                headerEs: 'Amigos en la reunión sacramental (Real)', type: 'NUMBER', displayEs: 'Personas en Reunión Sacramental (Real)', order: 4 },
  { key: 'ki_pew_meta',                headerEs: 'Amigos en la reunión sacramental (Meta)', type: 'NUMBER', displayEs: 'Personas en Reunión Sacramental (Meta)', order: 5 },
  { key: 'ki_baptismal_date_real',     headerEs: 'Amigos con fecha bautismal (Real)', type: 'NUMBER', displayEs: 'Amigos con Fecha Bautismal (Real)', order: 6 },
  { key: 'ki_baptismal_date_meta',     headerEs: 'Amigos con fecha bautismal (Meta)', type: 'NUMBER', displayEs: 'Amigos con Fecha Bautismal (Meta)', order: 7 },
  { key: 'ki_baptized_confirmed_real', headerEs: 'Bautizados y confirmados (Real)', type: 'NUMBER', displayEs: 'Bautizados y Confirmados (Real)', order: 8 },
  { key: 'ki_baptized_confirmed_meta', headerEs: 'Bautizados y confirmados (Meta)', type: 'NUMBER', displayEs: 'Bautizados y Confirmados (Meta)', order: 9 },
  { key: 'ki_rc_at_church_real',       headerEs: 'Conversos recientes en la Iglesia (Real)', type: 'NUMBER', displayEs: 'Conversos Recientes en la Iglesia (Real)', order: 10 },
  { key: 'ki_rc_at_church_meta',       headerEs: 'Conversos recientes en la Iglesia (Meta)', type: 'NUMBER', displayEs: 'Conversos Recientes en la Iglesia (Meta)', order: 11 },
  { key: 'ki_rc_could_attend_real',    headerEs: 'Conversos recientes que podían asistir (Real)', type: 'NUMBER', displayEs: 'RC Que Podían Asistir (Real)', order: 12 }, // [NEW — President signed off 2026-08-29]
  { key: 'ki_rc_could_attend_meta',    headerEs: 'Conversos recientes que podían asistir (Meta)', type: 'NUMBER', displayEs: 'RC Que Podían Asistir (Meta)', order: 13 }, // [NEW — President signed off 2026-08-29]
  { key: 'ki_new_people_found_real',   headerEs: 'Nuevas personas encontradas (Real)', type: 'NUMBER', displayEs: 'Nuevas Personas Encontradas (Real)', order: 14 },
  { key: 'ki_new_people_found_meta',   headerEs: 'Nuevas personas encontradas (Meta)', type: 'NUMBER', displayEs: 'Nuevas Personas Encontradas (Meta)', order: 15 },
  { key: 'ki_first_week_church_real',  headerEs: 'Amigos en la Iglesia durante su primera semana de enseñanza (Real)', type: 'NUMBER', displayEs: 'Amigos en la Iglesia (Primera Semana) (Real)', order: 16 },
  { key: 'ki_first_week_church_meta',  headerEs: 'Amigos en la Iglesia durante su primera semana de enseñanza (Meta)', type: 'NUMBER', displayEs: 'Amigos en la Iglesia (Primera Semana) (Meta)', order: 17 },
  { key: 'ki_member_lessons_real',     headerEs: 'Lecciones con miembros participando (Real)', type: 'NUMBER', displayEs: 'Lecciones con Miembros Participando (Real)', order: 18 }, // [CCSM — edited per President 2026-08-29: KEEP, reworded]
  { key: 'ki_member_lessons_meta',     headerEs: 'Lecciones con miembros participando (Meta)', type: 'NUMBER', displayEs: 'Lecciones con Miembros Participando (Meta)', order: 19 } // [CCSM — edited per President 2026-08-29: KEEP, reworded]
];

// ==================================================================
// Structural (non-metric) form strings shared by both forms.
// ==================================================================
var HSPSEM_FORM_STRUCTURAL = {
  zoneCol: '¿En qué zona sirve?',
  areaCol: '¿En qué área sirve?',
  dateCol: '¿Qué fecha está ingresando?',
  effortChoices: ['Todo', 'La mayor parte', 'Algo']
};

// ==================================================================
// AGENT_CONFIG initial rows — locked decisions from
// ONBOARDING_READINESS.md §1, plus per-metric GOAL_<key> rows for every
// NUMBER-type nightly metric HSPSE actually asks (no GOAL_ row for 'effort'
// — CHOICE metric, tuned via EFFORT_SCORE_TARGET instead, same as CCSM).
// MISSION_NAME is the acronym expansion pending official confirmation from
// the mission (ONBOARDING_READINESS.md §5 — "Exact official mission name"
// still needed).
// ==================================================================
var HSPSEM_AGENT_CONFIG_ROWS = [
  ['MISSION_NAME', 'Honduras San Pedro Sula East Mission'], // confirmed official 2026-08-29 (readiness §5)
  ['MISSION_LANGUAGE', 'ES'],
  ['MISSION_TIMEZONE', 'America/Tegucigalpa'],
  ['MISSION_LOCALE', 'es_HN'],
  ['TEST_MODE', 'TRUE'],
  ['TEST_INBOX_EMAIL', 'hspsem.pmg.compass@gmail.com'],
  ['SEND_FROM_EMAIL', 'hspsem.pmg.compass@gmail.com'],
  ['SYSTEM_START_DATE', '2026-09-09'],
  ['NIGHTLY_FORM_LINK', ''],
  ['WEEKLY_FORM_LINK', ''],
  ['RELAY_1_URL', ''],
  ['RELAY_2_URL', ''],
  ['RELAY_SECRET', ''],
  ['GEMINI_QA_MODEL', 'gemini-flash-latest'],
  ['GEMINI_MODEL', 'gemini-flash-latest'], // callGemini() (HSPSEM_Helpers.gs) reads this — was missing entirely, only worked via its now-dead hardcoded default
  ['MISSED_DAYS_LOOKBACK', '3'],
  ['WEEKLY_REMINDER_OWNER', 'AGENT_ESCALATION'],
  ['CONTACT_RATE_TARGET', '0.50'],
  ['MC_RATE_TARGET', '0.50'],
  ['LESSON_RATE_TARGET', '0.20'],
  ['CLOSE_RATE_TARGET', '0.25'],
  ['EFFORT_SCORE_TARGET', '2.75'],
  ['TRANSFER_START_DATE', '2026-09-09'], // provisional — real transfer-cycle start date not yet known (readiness §4.5)
  ['GOAL_new_people_found', ''],
  ['GOAL_contacts_attempted', ''],
  ['GOAL_contacts_made', ''],
  ['GOAL_meaningful_conversations', ''],
  ['GOAL_friend_lessons', ''],
  ['GOAL_lessons_member_present', ''],
  ['GOAL_rc_lessons', ''],
  ['GOAL_church_invites', ''],
  ['GOAL_bom_shared', ''],
  ['GOAL_baptismal_invitations', ''],
  ['GOAL_baptismal_calendars', '']
];

// ==================================================================
// MISSION_ORG — same header shape as CCSM's. Names/zones/districts/areas
// and leadership flags are populated from the IMOS roster export
// (roster_staging/roster.tsv, 2026-08-29); Companion*_Email is
// intentionally BLANK on every row — the IMOS export has no email column
// (roster_staging/README.md "THE BLOCKER"), so nothing here was guessed or
// constructed. Do not fill an email in without a real source.
//
// Row 1 (A000) is the Mission President — not a real teaching area, flagged
// Is_MP=TRUE. Companion2 (spouse) name/email intentionally blank pending
// that info. All other rows (A001-A081) are the 81 real teaching areas;
// Companion1/Companion2 assignment follows roster.tsv's senior/junior slot,
// except the two 3-missionary anomalies (La Paz/La Paz, Palermo/William
// Hall/William Hall — see roster_staging/anomalies.txt), where the extra
// name is appended into Companion2 joined by ' / ', mirroring CCSM's own
// precedent for a trio companionship.
// ==================================================================
var HSPSEM_MISSION_ORG_HEADERS = ['Area_Code','Area_Name','Zone','District','Companion1_Name','Companion1_Email',
   'Companion2_Name','Companion2_Email','Is_DL','Is_ZL','Is_STL','Is_AP','Is_MP','Active'];

var HSPSEM_MISSION_ORG_ROWS = [
  ['A000', 'Presidencia de Misión', '', '', 'Christensen, Kirt', 'kirt.christensen@churchofjesuschrist.org', '', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE', 'TRUE'],
  ['A001', 'El Carmen', 'El Carmen', 'La Aldea', 'Dominguez Zurita, Elied Vanesa', '', 'Peralta Estrada, Cindy Junieth', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A002', 'La Aldea 1', 'El Carmen', 'La Aldea', 'Zaldivar Leiva, Leonardo Alexander', '', 'Brown, Hudson Ron', '', 'FALSE', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A003', 'Ocotillo', 'El Carmen', 'La Aldea', 'Saunders, Mason Jonathan', '', 'Valle Limachi, Rafael Matias', '', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A004', 'Calpules', 'El Carmen', 'Las Lomas', 'Alonso Monroy, Sebastián', '', 'Logans Zabala, Mijael', '', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A005', 'Las Lomas', 'El Carmen', 'Las Lomas', 'Hansen, Miles William', '', 'Vásquez González, Diego José', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A006', 'San Juan', 'El Carmen', 'Las Lomas', 'Ortega, Elizabeth Nina', '', 'Carvajal, Sophia Isabella', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A007', 'Acacias', 'La Ceiba', 'Acasias', 'López Véliz, Pablo David', '', 'Tau\'ataina, Manisela Dwayne', '', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A008', 'Jutiapa', 'La Ceiba', 'Acasias', 'Rodas Estrada, José Antonio', '', 'Williams, Benjamin Bryan', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A009', 'Pizzaty 1', 'La Ceiba', 'Acasias', 'Echegaray, Ania Carolina', '', 'Adams, Kaleigh Joy', '', 'FALSE', 'FALSE', 'TRUE', 'FALSE', 'FALSE', 'TRUE'],
  ['A010', 'Pizzaty 2', 'La Ceiba', 'Acasias', 'Ramirez Suarez, Cristina', '', 'Fuentes Meléndez, Alisson Belén', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A011', 'El Imán', 'La Ceiba', 'Lempira', 'Garcia Pérez, Luis Antonio', '', 'Fields, Brody Owen', '', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A012', 'Independencia', 'La Ceiba', 'Lempira', 'Sac Rodríguez, Ryan Oliver', '', 'Tambito Lopez, Emerson Aníbal', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A013', 'Lempira 1', 'La Ceiba', 'Lempira', 'Najarro Aguilar, Jorge Eli', '', 'Call, Ethan Mcarthur', '', 'FALSE', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A014', 'Lempira 2', 'La Ceiba', 'Lempira', 'Jimenez Alvaradejo, Alfredo', '', 'Leonor Urbina, Audelio Isaac', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A015', 'Flowers Bay', 'La Ceiba', 'Roatán', 'Nielson, Jacob Gail', '', 'Smith Yanes, Armando Roy', '', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A016', 'Los Fuertes', 'La Ceiba', 'Roatán', 'Carmona González, Belkan Olivier', '', 'Calderón Cosiguá, Luis Rodrigo', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A017', 'Roatán', 'La Ceiba', 'Roatán', 'Poulsen, Braxton K', '', 'Baczuk, Andrew Joseph', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A018', 'Sandy Bay', 'La Ceiba', 'Roatán', 'Barton, Aidan William', '', 'Grissom, Kimball W', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A019', 'Utila', 'La Ceiba', 'Roatán', 'Kelly, Kekoa Kapono', '', 'Jimenez Parra, Helam', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A020', 'Flores de Oriente', 'La Paz', 'La Paz', 'Pérez Ajucúm, Victor José', '', 'Lemus, Ixcayau, Dallin', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A021', 'La Paz', 'La Paz', 'La Paz', 'Crane, Jace Ryan', '', 'Ortega Rosales, Jose Samuel / Wolff, Carsen Mathew', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A022', 'Pineda', 'La Paz', 'La Paz', 'Nicoll, William Bentley', '', 'Nova Santizo, David Ricardo', '', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A023', 'El Porvenir', 'La Paz', 'La Sabana', 'Oviedo Garcia, Aaron Efraín', '', 'Gingras, Keegan Joseph', '', 'FALSE', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A024', 'La Sabana', 'La Paz', 'La Sabana', 'Flint, Aiden Harrison', '', 'Diaz Oscal, Jersson Pablo Abinadi', '', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A025', 'San Manuel 2', 'La Paz', 'La Sabana', 'Wood, Trux Harker', '', 'Calixto Avila, Zahid Arturo', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A026', 'Buenos Aires', 'Miramar', 'Confite', 'Castellanos Gálvez, Dulce Rebeca', '', 'Espinoza Espinoza, Luz Amparo', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A027', 'Confite 1', 'Miramar', 'Confite', 'Nailati, Timoci Egbert', '', 'Green Chay, Jorge Juan José', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A028', 'Confite 2', 'Miramar', 'Confite', 'Alger, Jackson D', '', 'McNaughtan, Nolan George', '', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A029', 'La Masica', 'Miramar', 'La Masica', 'Hernandez Carreto, Jeffrey Efrain', '', 'Rodas Fonseca, Jose Mario', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A030', 'Mezapita', 'Miramar', 'La Masica', 'Baker, David Dean', '', 'Salanic Colop, Yunior Emanuel', '', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A031', 'San Juan Pueblo', 'Miramar', 'La Masica', 'Smith, Seth Nicholas', '', 'Abelar Escobar, Guillermo Adolfo', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A032', 'Miramar', 'Miramar', 'Montecristo', 'Delgado Davis, Angeline Victoria', '', 'Cordova Toscano, Estrella Mía', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A033', 'Montecristo 1', 'Miramar', 'Montecristo', 'Gornichec, Evan Isaac', '', 'Jones, Tate Aaron', '', 'FALSE', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A034', 'Montecristo 2', 'Miramar', 'Montecristo', 'Rhoades, Trey Adam', '', 'Salarayan, Thiago Bautista', '', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A035', 'Bellavista', 'Olanchito', 'Olanchito', 'Solis Pérez, Delfinencio Adicaliler', '', 'Zamora Ramirez, Himni Leonardo', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A036', 'Coyoles 1', 'Olanchito', 'Olanchito', 'Castillo Madrid, Joel Antonio', '', 'Voth, Graysen Glenn', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A037', 'Coyoles 2', 'Olanchito', 'Olanchito', 'McDowell, Cooper James', '', 'Rodriguez Llanes, Carlos Andres', '', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A038', 'Olanchito', 'Olanchito', 'Olanchito', 'QUEJ CÚ, KEVIN YOBANI', '', 'Coleman, Aden Victor', '', 'FALSE', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A039', 'Sabá 1', 'Olanchito', 'Sabá', 'Peck, Jaden Carter', '', 'Starkes, Eric Andrew', '', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A040', 'Sabá 2', 'Olanchito', 'Sabá', 'Steadman, McKay Marlin', '', 'Barnes, Jayce Walker', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A041', 'Isletas Central', 'Olanchito', 'Sonaguera', 'Faiese, Tony Andre', '', 'Escobar Salazar, Diego Roberto', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A042', 'Sonaguera 1', 'Olanchito', 'Sonaguera', 'Cumatz Roquel, Edgar Israel', '', 'Gòmez Garcìa, Edward Amós', '', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A043', 'Sonaguera 2', 'Olanchito', 'Sonaguera', 'Camacho Gonzalez, Juan Sebastián', '', 'Padilla Aragon, Dallin Samir', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A044', 'Tocoa 1', 'Olanchito', 'Tocoa', 'Centeno Miranda, Josué Yunerly', '', 'Leal Macz, Rodrigo Marcoandrés', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A045', 'Tocoa 2', 'Olanchito', 'Tocoa', 'Mitchell, Brett Nephi', '', 'Jones, Cade McCoy', '', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A046', 'Trujillo 1', 'Olanchito', 'Trujillo', 'Cadavid, Daniel Smith', '', 'García Reyes, Michael Steven', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A047', 'Trujillo 2', 'Olanchito', 'Trujillo', 'Rednour, Luke Archibald', '', 'Morillo Molina, Angel Vicente', '', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A048', 'Palermo', 'Palermo', 'Palermo', 'Juarez Orozco, Yordy Geancarlo', '', 'McCune, Spencer Weston', '', 'FALSE', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A049', 'Sarrosa 1', 'Palermo', 'Palermo', 'Dodds, Ryan Asa', '', 'Cordova Melendez, Aldo Sebastian', '', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A050', 'Sarrosa 2', 'Palermo', 'Palermo', 'Conde Salgado, Parley Yair', '', 'Bravo Xelhuantzi, Samuel', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A051', 'Bendeck', 'Palermo', 'William Hall', 'Reese, Noah Miller', '', 'Pacheco Panta, Alexander', '', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A052', 'Palmeras', 'Palermo', 'William Hall', 'Navarro Canizalez, Wendy Ivette', '', 'Perlaza Ibarra, Darla', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A053', 'William Hall', 'Palermo', 'William Hall', 'Munguia Rosas, Angie Mariel', '', 'Castellanos Fuentes, Génesis María / Viera Mesa, Belkis Carolina', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A054', 'Jerusalén 1', 'Planeta', 'Jerusalén', 'Douglass, Chance Tyler', '', 'Trythall, Cannon Drew', '', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A055', 'La Mesa', 'Planeta', 'Jerusalén', 'Epifania Moquillaza, Fiorella Anthuanet', '', 'Foreman, Sydnee Davelle', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A056', 'La Lima 1', 'Planeta', 'Planeta', 'Griffiths, Keira Marie', '', 'García Beltrán, Hazel Dayanara', '', 'FALSE', 'FALSE', 'TRUE', 'FALSE', 'FALSE', 'TRUE'],
  ['A057', 'La Lima 2', 'Planeta', 'Planeta', 'Da Cunha, José Luiz Silva', '', 'Williams, Jack Richard', '', 'FALSE', 'FALSE', 'FALSE', 'TRUE', 'FALSE', 'TRUE'],
  ['A058', 'Planeta 1', 'Planeta', 'Planeta', 'Berg, Noah Gordon', '', 'Fernandez Hidalgo, Jose Leonardo', '', 'FALSE', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A059', 'Planeta 2', 'Planeta', 'Planeta', 'Jurca, Joseph Hank', '', 'Montero Aguirre, Carlos Eduardo', '', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A060', 'Berlín 1', 'Progreso', 'Berlín', 'Steinheiser, Michael Paul', '', 'Bejarano Vacaflor, Ebrajan Uriel', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A061', 'Berlín 2', 'Progreso', 'Berlín', 'Paul, Samuel Gunner', '', 'Chuni Chuni., Oscar Emanuel', '', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A062', 'Mezapa', 'Progreso', 'Berlín', 'Avila, Benjamin Ignacio', '', 'Pizarro, Johan Esteban', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A063', 'Corocol', 'Progreso', 'Progreso', 'Wilson, Brayden Marlow', '', 'Fajardo Zambrano, Adán Matías', '', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A064', 'El Centro', 'Progreso', 'Progreso', 'González Escobedo, Dillan Daniel', '', 'Cevallos Indio, Abraham Wilfrido', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A065', 'Jazmines', 'Progreso', 'Progreso', 'Castillo Flores, Obryan Ernesto', '', 'Cook, Nathan McKay', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A066', 'Progreso', 'Progreso', 'Progreso', 'Axtell, Landon Joseph', '', 'Benítez Martínez, Inmer Omar', '', 'FALSE', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A067', 'Tela', 'Progreso', 'Tela', 'Chadwick, Karsyn Ray', '', 'Barrios García, Gustavo Eliú', '', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A068', 'Telamar', 'Progreso', 'Tela', 'Villaseñor Esteban, André Juan Abinadí', '', 'Sánchez Flores, Henry David', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A069', 'El Negrito', 'Santa Rita', 'Morazán', 'Barclay, William Campbell', '', 'Brown, Soren Thomas Grant', '', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A070', 'Morazán 1', 'Santa Rita', 'Morazán', 'De los Santos Inoa, Wilmer Michael', '', 'Jimenez Abrego, Efrain', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A071', 'Aguablanca', 'Santa Rita', 'Santa Rita', 'Alvarez Espinoza, ERVIN MARIANO', '', 'Milflores Sevilla, Jose Armando', '', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A072', 'Santa Rita', 'Santa Rita', 'Santa Rita', 'Caal Lemus, Benjamín Isaí', '', 'Huber, Luke Walton', '', 'FALSE', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A073', 'Yoro 1', 'Santa Rita', 'Yoro', 'Baer, Spencer Joseph', '', 'Ibañez Alfaro, Brayan Alexander', '', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A074', 'Yoro 2', 'Santa Rita', 'Yoro', 'Cocón Tum, Jeffrey David', '', 'Ballantyne, Michael Adam', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A075', 'Central', 'Satélite', 'Central', 'Garcia Alcantara, Axel Augusto', '', 'Amacio López, Yael Lenos', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A076', 'Los Ángeles', 'Satélite', 'Central', 'Centeno Salgado, Andrés Ismael', '', 'Maravilla Cerón, Vitner Abinadi', '', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A077', 'Seis de Mayo 1', 'Satélite', 'Central', 'Rosales Tiul, Edwin Rene', '', 'Garcia Vega, Moises Aaron', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A078', 'Luisiana 1', 'Satélite', 'Satelite', 'Tatlow, Kael Robert', '', 'Videa Ramirez, William Samuel', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A079', 'Planes', 'Satélite', 'Satelite', 'López Vásquez, Marvin Antulio', '', 'Morales Rodriguez, Saul Zadrack', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A080', 'Satelite 1', 'Satélite', 'Satelite', 'Adanaque Arriaga, Christian Edwin', '', 'Thompson, Spencer John', '', 'FALSE', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'TRUE'],
  ['A081', 'Satelite 2', 'Satélite', 'Satelite', 'Rodriguez, Martin Ignacio', '', 'Santana Villacreses, Helamen', '', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'FALSE', 'TRUE']
];

// ==================================================================
// TRANSFER_SCHEDULE — the President's transfer calendar, given 2026-08-29.
// All 6-week/42-day cycles (verified: every consecutive pair below is
// exactly 42 days apart). SYSTEM_START_DATE and TRANSFER_START_DATE are
// both 2026-09-09 (AGENT_CONFIG) — that row is HSPSE's first tracked
// transfer, but three earlier transfers the mission already ran are
// included too so HSPSEM_Agent2.gs's a2_loadRealTransferHistory_() has
// real 'Actual' history to compute Previous/2-Ago boundaries from on day
// one, instead of falling back to a flat 42-day guess.
//
// Status vocabulary is CCSM's real one (not invented — CCSM's own
// TRANSFER_SCHEDULE row spec ships with prefill: null, no example rows, so
// there was nothing to copy directly; this is reverse-engineered from how
// CCSM's own code actually reads/writes the column):
//   - HSPSEM_Agent2.gs's a2_loadRealTransferHistory_() only counts rows
//     with Status === 'Actual' (exact string, case-sensitive) as real
//     history — verified against CCSM_Agent2.gs, byte-identical logic.
//   - dashboard/app/ingestion/transfer_engine.py's a5-side counterpart
//     (transfer_apply_service.py) flips the earliest still-'Planned' row to
//     'Actual' once a transfer actually happens — 'Planned' is CCSM's own
//     term for a not-yet-started future transfer.
// Applied here using the session date (2026-08-29) as "today": the three
// dates already in the past (2026-05-06, 2026-06-17, 2026-07-29) are
// 'Actual'; 2026-09-09 onward (not yet started) are 'Planned'.
//
// Transfer_Number is a plain sequential label (1-11, oldest first) — it is
// never read by any agent logic (HSPSEM_Agent2.gs keys off Start_Date/
// Status only) and the dashboard's 12_Traslados.py displays it as opaque
// text, so there is no "official" church-wide numbering to reverse-engineer
// or reason to invent one.
// ==================================================================
var HSPSEM_TRANSFER_SCHEDULE_ROWS = [
  ['1',  '2026-05-06', '6', 'Actual'],
  ['2',  '2026-06-17', '6', 'Actual'],
  ['3',  '2026-07-29', '6', 'Actual'],
  ['4',  '2026-09-09', '6', 'Planned'],
  ['5',  '2026-10-21', '6', 'Planned'],
  ['6',  '2026-12-02', '6', 'Planned'],
  ['7',  '2027-01-13', '6', 'Planned'],
  ['8',  '2027-02-24', '6', 'Planned'],
  ['9',  '2027-04-07', '6', 'Planned'],
  ['10', '2027-05-19', '6', 'Planned'],
  ['11', '2027-06-30', '6', 'Planned']
];

// ==================================================================
// TAB_SPECS — one entry per sheet tab the builder creates. Identical shape
// to CCSM's CCSM_TAB_SPECS; see CcsmData.gs (CCSM repo) for the full
// per-tab schema-reconciliation notes this was verified against — those
// notes are about shared Provo-derived agent code (Helpers.gs col_(),
// Agent1C.gs, AgentQA.gs, etc.) and apply unchanged to HSPSE.
// ==================================================================
var HSPSEM_TAB_SPECS = [
  { name: 'MISSION_ORG',       headers: HSPSEM_MISSION_ORG_HEADERS, prefill: 'HSPSEM_MISSION_ORG_ROWS' },
  { name: 'AGENT_CONFIG',      headers: ['Key', 'Value'],         prefill: 'HSPSEM_AGENT_CONFIG_ROWS' },
  { name: 'QUESTIONS_CONFIG',  headers: ['Question_ID','Form_Type','Form_Column_Header','Metric_Key','Metric_Display_Name','Data_Type','Include_In_Daily_Log','Include_In_Live_Snapshot','Include_In_Weekly_Breakdown','Display_Order','Active'], prefill: 'derived' },
  { name: 'GOALS_CONFIG',      headers: null, prefill: null },   // real schema is wide (Area + one col/metric); see CCSM_TAB_SPECS note
  { name: 'SCORE_CONFIG',      headers: null, prefill: null },   // seeded by HSPSEM_AgentScores setup fn
  { name: 'MESSAGE_BANK',      headers: ['Message_ID','Category','Metric','Subcategory','Subject_Line','Body_Text','PMG_Chapter','PMG_Description','Scripture','Scripture_Text','Active'], prefill: null }, // content not yet written
  { name: 'KNOWLEDGE_BASE',    headers: ['ID','Category','Question','Answer','Keywords','Source','DateAdded','UseCount'], prefill: null },
  { name: 'TRANSFER_SCHEDULE', headers: ['Transfer_Number','Start_Date','Weeks','Status'], prefill: 'HSPSEM_TRANSFER_SCHEDULE_ROWS' },
  { name: 'DAILY_LOG',         headers: null, prefill: null },
  { name: 'LIVE_SNAPSHOT',     headers: null, prefill: null },
  { name: 'WEEKLY_KI',         headers: null, prefill: null },
  { name: 'DASHBOARD_SUMMARY', headers: null, prefill: null },
  { name: 'WEEKLY_BREAKDOWNS', headers: null, prefill: null },
  { name: 'SCORES',            headers: null, prefill: null },
  { name: 'GOAL_RECALIBRATION',headers: null, prefill: null },
  { name: 'AGENT_RUN_LOG',     headers: ['Timestamp','Agent','Status','Duration_Sec','Records_Processed','Emails_Sent','Error','Notes'], prefill: null },
  { name: 'AUDIT_LOG',         headers: null, prefill: null },
  { name: 'MISSING_LOG',       headers: null, prefill: null },
  { name: 'FEEDBACK_HISTORY',  headers: ['Area_ID','Area_Name','Category','Last_Message_ID','Last_Sent_Date','Previous_Message_ID','Previous_Sent_Date','Last_Growth_Metric'], prefill: null },
  { name: 'ENCOURAGEMENT_HISTORY', headers: null, prefill: null },
  { name: 'SUGGESTIONS',       headers: null, prefill: null },
  { name: 'SUGGESTIONS_REVIEW',headers: null, prefill: null },
  { name: 'NOTES',             headers: ['Note_ID','Area_Code','Area_Name','Author_Email','Note_Text','Created_At','Reminder_DateTime','Reminder_Sent','Resolved','Resolved_At'], prefill: null }
];
