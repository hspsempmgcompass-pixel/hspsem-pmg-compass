# HSPSE — Catálogo de Métricas (Español) — CANONICAL CONTRACT

**Mission:** Honduras San Pedro Sula East (HSPSE)
**Purpose:** single source of truth for metric keys + Spanish form wording + missionary-guide
definitions. Both workstreams (phone guide HTML, Apps Script form builders, `QUESTIONS_CONFIG.csv`)
pull from this file. Do not reword in one place without updating here.

**Wording provenance:**
- Metrics marked `[CCSM verbatim]` — Spanish title + help copied exactly from CCSM's live
  `DailyReportForm_ES.gs` / `WeeklyReportForm_ES.gs`. Do not paraphrase.
- Metrics marked `[CCSM — edited per President]` — based on CCSM wording, changed on the
  President's instruction (2026-08-29). Do not revert to CCSM's text.
- Metrics marked `[NEW]` — not in any existing mission; Spanish drafted here, **President
  signed off 2026-08-29**.

**President's answers — RESOLVED 2026-08-29** (was "open wording questions"):
1. Nightly "doors attempted" → **remove the word "doors" entirely.** Use the broad
   "Intentos de contacto con amigos" wording and strip the "no tiene que ser en una puerta"
   sentence from both `contacts_attempted` and `contacts_made`.
2. Structural nightly `exchanges` (intercambios Y/N) and `roleplays` (prácticas de enseñanza)
   → **NEITHER. Both dropped.** Nightly structural questions = date, zone, area only.
3. Weekly "Lecciones con miembros" → **KEEP**, but reword to **lessons with a member
   *participating actively*** (helping teach / testifying / supporting), not merely present.
   Key `ki_member_lessons`, title "Lecciones con miembros participando".
4. Nightly "Baptismal Date Set" count → **DROPPED from the nightly form.** The President only
   wants baptismal-date tracking on the **weekly** report, which the existing standing-total
   KI `ki_baptismal_date` ("Amigos con fecha bautismal") already covers. No new metric.
5. Weekly "RC Who Could Have Attended" → **KEEP** (`ki_rc_could_attend`). Definition per the
   President: count **every** recent convert in the area, *including* those temporarily out
   of town or sick; exclude **only** RCs who have confirmed moved away and whose whereabouts
   are unknown. Help text below revised accordingly.

---

## STRUCTURAL (asked once per submission, before the metrics)

| Order | Key | ES title | ES help | Notes |
|---|---|---|---|---|
| S1 | `report_date` | ¿Qué fecha está ingresando? | Ingrese la fecha correspondiente al día que está reportando. En la mayoría de los casos, será la fecha de hoy. Si está registrando información de un día anterior, ingrese la fecha en que realmente ocurrieron las actividades, no la fecha en que está enviando el informe. | date, required, `[CCSM verbatim]` |
| S2 | `zone` | ¿En qué zona sirve? | La zona en la que usted sirve. Seleccione su zona cada vez que envíe el informe nocturno. | list, required. Choices = HSPSE zones (roster pending) `[CCSM verbatim]` |
| S3 | `area` | ¿En qué área sirve? | El área en la que usted sirve. Seleccione su área cada vez que envíe el informe nocturno. | list, required, per-zone section `[CCSM verbatim]` |

~~S4 `exchanges` / S5 `roleplays`~~ — **DROPPED per President 2026-08-29.** Do not add these
to the nightly form. If HSPSEM's scoring config (`SCORE_CONFIG.csv`, `HSPSEM_AgentScores.gs`)
carries CCSM rows for `exchanges` / `roleplays`, remove them or they will read null every night.

---

## NIGHTLY METRICS — the President's list (12 after 8/29 review)

Order follows the President's intake list. All `number` type, validation "Ingrese un número
(0 o más)", required — except `effort`. Item #8 "Fechas bautismales establecidas" was
**dropped 2026-08-29** (President wants baptismal-date tracking on the weekly report only).

### 1. `new_people_found` — Nuevas personas encontradas  `[CCSM verbatim]`
> **ES help (form):** Cada persona (que no haya sido bautizada) que haya recibido una lección
> durante la semana, que no haya sido enseñada en los últimos tres meses y que haya aceptado una
> cita específica para regresar. Normalmente, una lección incluye una oración (cuando sea
> apropiado), la enseñanza de al menos un principio del evangelio y una invitación.

### 2. `contacts_attempted` — Intentos de contacto con amigos  `[CCSM — edited per President]`
> Cuente cada intento de contactar a un amigo hoy, independientemente de si la persona respondió
> o no. Si nadie respondió, igualmente cuenta aquí. Incluye los intentos realizados en cualquier
> lugar — en la calle, en lugares públicos, por referencia o de cualquier otra forma.

### 3. `contacts_made` — Contactos con amigos  `[CCSM — edited per President]`
> Cuente cada ocasión en la que una persona respondió y usted logró establecer contacto. Todo
> contacto también cuenta como un intento de contacto. Incluye los contactos hechos en cualquier
> lugar — en la calle, en lugares públicos o por referencia.

### 4. `meaningful_conversations` — Conversaciones significativas con amigos  `[CCSM verbatim]`
> Una conversación con un amigo que duró más de tres minutos e incluyó un principio o mensaje del
> evangelio. Sea honesto consigo mismo: ¿fue realmente una conversación significativa? Si la
> respuesta es sí, también cuenta como un contacto y un intento de contacto.

### 5. `friend_lessons` — Lecciones con amigos  `[CCSM verbatim]`
> Una visita con un amigo en la que usted enseñó un principio del evangelio y extendió una
> invitación. Cada lección también cuenta como una conversación significativa, un contacto y un
> intento de contacto. El número de lecciones nunca debe ser mayor que el de conversaciones
> significativas. Si lo es, revise nuevamente sus registros.

### 6. `lessons_member_present` — Lecciones con un miembro presente  `[CCSM verbatim]`
> La cantidad de lecciones dadas hoy en las que estuvieron presentes tanto un amigo como un
> miembro de la Iglesia. No corresponde al total de lecciones, sino únicamente a aquellas en las
> que también participó un miembro.

### 7. `rc_lessons` — Lecciones con conversos recientes  `[CCSM verbatim]`
> Las lecciones dadas hoy únicamente a conversos recientes. No incluya amigos en este conteo; es
> exclusivamente para conversos recientes.

### ~~8. `baptismal_dates_set` — Fechas bautismales establecidas~~  — DROPPED 2026-08-29
> **Not on the nightly form.** President: baptismal-date tracking lives on the **weekly**
> report only, via the existing standing-total KI `ki_baptismal_date` ("Amigos con fecha
> bautismal"). Do not build a nightly question for this. Do not add a new weekly "dates set
> this week" count unless the President later asks.

### 8. `church_invites` — Invitaciones a la Iglesia extendidas  `[CCSM verbatim]`
> La cantidad de amigos a quienes usted invitó personalmente a asistir a una reunión o actividad
> de la Iglesia hoy. Cuente cada invitación, independientemente de si fue aceptada o rechazada.

### 9. `bom_shared` — Copias del Libro de Mormón entregadas  `[CCSM verbatim]`
> La cantidad de copias del Libro de Mormón que entregó hoy a amigos, ya sean físicos o
> digitales. Cuente cada persona que recibió uno.

### 10. `effort` — ¿Dio todo, la mayor parte o algo de esfuerzo en el altar del sacrificio hoy?  `[CCSM verbatim]`
> Una autoevaluación personal del esfuerzo que usted dio hoy. Sea honesto: esto es entre usted y
> el Señor. Seleccione Todo si dio todo lo que tenía sin reservas, La mayor parte si trabajó
> diligentemente pero sintió que pudo haber dado un poco más, o Algo si su esfuerzo fue solo
> parcial. No se trata de ser perfecto, sino de ser honesto.
>
> **Choices:** `Todo` · `La mayor parte` · `Algo` — CHOICE metric, not numeric. Scoring must
> renormalize weights, never treat a text answer as 0.

### 11. `baptismal_invitations` — Invitaciones al bautismo extendidas  `[CCSM verbatim]`
> La cantidad de personas a quienes invitó claramente a bautizarse hoy. Cuente cada invitación,
> independientemente de si fue aceptada, rechazada o pospuesta.

### 12. `baptismal_calendars` — Calendarios bautismales entregados  `[CCSM verbatim]`
> La cantidad de calendarios bautismales o planes de preparación para el bautismo que entregó a
> personas que se están preparando para bautizarse. Cuente cada persona que recibió uno.

---

## WEEKLY METRICS — the President's 7

CCSM's weekly form renders each KI **twice**: once as `Real` (result last week), once as `Meta`
(goal set for next week). HSPSE follows the same pattern → each metric below = 2 form columns
(`_real`, `_meta`). Section headers `[CCSM verbatim]`:
- Real section: *"Indicadores Clave Semanales (Resultados)"* — "Estos indicadores representan los
  resultados obtenidos durante la semana pasada… Ingrese los mismos números que registró en los
  indicadores clave semanales de la aplicación Predicad Mi Evangelio."
- Meta section: *"Indicadores Clave Semanales (Metas)"* — "Estos indicadores representan las
  metas que usted estableció durante la planificación semanal para la semana siguiente…"

Weekly intro questions `[CCSM verbatim]`: `report_date` (same as S1), `leader_call`
("¿Recibió una llamada de sus líderes?"), `coordination_meeting` ("¿Usted y sus líderes locales
realizaron una reunión de coordinación semanal?").

| # | Key | ES title (form) | Source |
|---|---|---|---|
| 1 | `ki_pew` | Amigos en la reunión sacramental | `[CCSM verbatim]` |
| 2 | `ki_baptismal_date` | Amigos con fecha bautismal | `[CCSM verbatim]` |
| 3 | `ki_baptized_confirmed` | Bautizados y confirmados | `[CCSM verbatim]` |
| 4 | `ki_rc_at_church` | Conversos recientes en la Iglesia | `[CCSM verbatim]` |
| 5 | `ki_rc_could_attend` | Conversos recientes que podían asistir | `[NEW]` — President signed off 8/29 |
| 6 | `ki_new_people_found` | Nuevas personas encontradas | `[CCSM verbatim]` |
| 7 | `ki_first_week_church` | Amigos en la Iglesia durante su primera semana de enseñanza | `[CCSM verbatim]` |
| 8 | `ki_member_lessons` | Lecciones con miembros participando | `[CCSM — edited per President]` — KEEP |

### `ki_rc_could_attend` — help text  `[NEW — President signed off 2026-08-29]`
> El número total de conversos recientes en su área esta semana. **Incluya a todos** — también a
> quienes estaban temporalmente fuera de la ciudad o enfermos. **Excluya únicamente** a los
> conversos recientes que se han mudado de forma confirmada y de quienes no se sabe su paradero.
> Se usa junto con "Conversos recientes en la Iglesia" para calcular el porcentaje de asistencia.

### `ki_member_lessons` — Lecciones con miembros participando  `[CCSM — edited per President]`
> El número de lecciones esta semana en las que un miembro de la Iglesia **participó
> activamente** — no solo estuvo presente, sino que ayudó a enseñar, compartió su testimonio o
> apoyó de otra forma en la lección. Distinto del indicador nocturno `lessons_member_present`,
> que solo requiere que el miembro estuviera presente.

---

## Metric key summary (for `QUESTIONS_CONFIG.csv`)

**Nightly structural:** `report_date`, `zone`, `area`  *(no `exchanges`, no `roleplays`)*

**Nightly metrics (12):** `new_people_found`, `contacts_attempted`, `contacts_made`,
`meaningful_conversations`, `friend_lessons`, `lessons_member_present`, `rc_lessons`,
`church_invites`, `bom_shared`, `effort`, `baptismal_invitations`, `baptismal_calendars`
*(no `baptismal_dates_set`)*

**Weekly:** `report_date`, `leader_call`, `coordination_meeting`, then `_real` + `_meta` for:
`ki_pew`, `ki_baptismal_date`, `ki_baptized_confirmed`, `ki_rc_at_church`, `ki_rc_could_attend`,
`ki_new_people_found`, `ki_first_week_church`, `ki_member_lessons`

**Status:** v2 — 2026-08-29, President sign-off incorporated. All wording is final for the
form build. `[NEW]` and `[CCSM — edited per President]` items are approved.
