"""Per-group translation gates.

A group is done only when BOTH hold:

  * every user-facing literal is routed through t()  - otherwise the page
    renders English no matter how complete ES is; and
  * every routed literal has a Spanish entry in ES.

Checking only the second against widget arguments would pass vacuously: t()
wrapping removes a string from that scan, so "nothing missing" would really
mean "nothing left to look at". Both assertions are needed.

GROUPS mirrors the plan's Tasks 9-12 file split, plus `leftovers` - strings in
app/breakdowns_engine.py and app/auth/auth.py that no planned group reached.
Without that group the suite could go green while the "Access denied" and
"session expired" messages stayed English-only, which is exactly the text a
Spanish-speaking user sees when they are locked out and therefore cannot reach
the language switch to fix it.
"""

from app.i18n.es import ES
from tools.extract_ui_strings import extract, extract_unwrapped

GROUPS = {
    # Home.py's page content moved to app_pages/00_Home.py when Home.py
    # became the st.navigation router (see [[project-hspse-mission-onboarding]]
    # 2026-09-04) — task9 follows the content, not the filename.
    "task9":  ["app_pages/00_Home.py", "app_pages/01_Panel.py", "app_pages/04_Desgloses.py"],
    "task10": ["app_pages/07_Embudo_de_Búsqueda.py", "app_pages/10_Notas.py",
               "app_pages/15_Sugerencias.py", "app_pages/17_Centro_de_Acción.py"],
    "task11": ["app_pages/06_Puntajes.py", "app/components/design_system.py",
               "app/components/scope_selector.py"],
    "task12": ["app_pages/02_Metas.py", "app_pages/18_Mantenimiento.py"],
    "leftovers": ["app/breakdowns_engine.py", "app/auth/auth.py"],
    # Query modules render their own st.error/st.warning on failure, so their
    # messages are user-facing even though they live in the data layer.
    "queries": ["app/db/goals_queries.py", "app/db/sheets_client.py"],
    # Home.py's sidebar nav titles deliberately do NOT go through t() — see
    # app.nav.nav_label()'s docstring — so this AST-based scanner has nothing
    # to find there. Coverage for those labels lives in
    # test_nav_and_locale_rendered.py instead, driven directly off
    # app.nav.NAV_ENTRIES + nav_label() rather than a source-text extractor.
}


def _missing(files):
    return [s for s in extract(files) if s not in ES or not ES[s].strip()]


def test_group_fully_translated():
    for name, files in GROUPS.items():
        assert _missing(files) == [], f"{name} untranslated: {_missing(files)[:10]}"


def test_group_fully_wrapped():
    for name, files in GROUPS.items():
        todo = extract_unwrapped(files)
        assert todo == [], f"{name} literals not routed through t(): {todo[:10]}"
