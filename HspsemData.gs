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
 * TODO(roster): HSPSEM_AREAS_ROWS and HSPSEM_MISSION_ORG_ROWS are
 * intentionally empty — the HSPSE zone/area/companionship roster has not
 * been provided yet (ONBOARDING_READINESS.md §5). Populate both from the
 * mission's roster export (see tools/emit_mission_org.py) before running
 * BuildHspsemSheet.gs. Keep HSPSEM_AREAS_ROWS in sync with config/AREAS.csv
 * AND with the standalone form builders' own copies (HSPSEM_DailyReportForm_ES.gs /
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
// AREAS — HSPSE zone/area roster, sourced from config/AREAS.csv (Zone,Area
// columns). NOT YET POPULATED (see file header TODO). Replaces the old
// HSPSEM_ZONES map — group into per-zone sections via the same
// findRowSection_()-style lookup the form builders use (resolve columns by
// name once, never headers.indexOf()).
// ==================================================================
var HSPSEM_AREAS_HEADERS = ['Zone', 'Area'];
var HSPSEM_AREAS_ROWS = []; // TODO(roster): fill from config/AREAS.csv once received

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
  ['MISSION_NAME', 'Honduras San Pedro Sula East Mission'], // TODO(confirm): provisional — exact official name still needed (readiness §5)
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
  ['GEMINI_QA_MODEL', 'gemini-2.5-flash'],
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
// MISSION_ORG — same header shape as CCSM's. NOT YET POPULATED: HSPSE's
// roster has not been provided (readiness §5). Do NOT copy CCSM's roster
// rows here — those are real CCSM missionaries' names/data and do not
// belong to a different mission's sheet.
// ==================================================================
var HSPSEM_MISSION_ORG_HEADERS = ['Area_Code','Area_Name','Zone','District','Companion1_Name','Companion1_Email',
   'Companion2_Name','Companion2_Email','Is_DL','Is_ZL','Is_STL','Is_AP','Is_MP','Active'];

var HSPSEM_MISSION_ORG_ROWS = []; // TODO(roster): populate from mission's roster export (tools/emit_mission_org.py)

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
  { name: 'TRANSFER_SCHEDULE', headers: ['Transfer_Number','Start_Date','Weeks','Status'], prefill: null },
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
