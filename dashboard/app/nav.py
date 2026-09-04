"""Navigation entries for the multipage app.

st.navigation()/st.Page() replaced Streamlit's classic `pages/` auto-discovery
(see [[feedback-st-navigation-conflicts-with-pages-dir]]) so sidebar labels
can be translated at runtime instead of being frozen to each file's Spanish
filename. This list is the single source of truth for Home.py's router and
for the nav-coverage tests, so the two can never drift apart.

Each entry is (script path relative to the dashboard root, i18n lookup key
for the sidebar label — resolved through app.i18n.t() on every rerun, so it
follows the Language / Idioma toggle).
"""

NAV_ENTRIES = [
    ("app_pages/00_Home.py", "Home"),
    ("app_pages/01_Panel.py", "Panel"),
    ("app_pages/02_Metas.py", "Goals"),
    ("app_pages/04_Desgloses.py", "Breakdowns"),
    ("app_pages/06_Puntajes.py", "Scores"),
    ("app_pages/07_Embudo_de_Búsqueda.py", "Finding Funnel"),
    ("app_pages/10_Notas.py", "Notes"),
    ("app_pages/11_Informes.py", "Reports"),
    ("app_pages/12_Traslados.py", "Transfers"),
    ("app_pages/14_Referencias.py", "Referrals"),
    ("app_pages/15_Sugerencias.py", "Suggestions"),
    ("app_pages/17_Centro_de_Acción.py", "Action Center"),
    ("app_pages/18_Mantenimiento.py", "Maintenance"),
    ("app_pages/19_Editar_Envíos.py", "Edit Submissions"),
]


def nav_label(key: str) -> str:
    """Sidebar label for a NAV_ENTRIES key — resolved WITHOUT calling
    app.i18n.t() directly.

    t() calls get_lang(), which falls back to mission_default_lang() the
    first time any page runs in a brand new session — and that reads
    AGENT_CONFIG off the live sheet, which enqueues a render delta (the
    st.cache_data spinner on a cache miss). Doing that HERE, before
    st.navigation() hands off to the selected page, would make the
    destination page's own st.set_page_config() call the run's SECOND
    enqueued delta, and Streamlit refuses that with
    StreamlitSetPageConfigMustBeFirstCommandError — crashing the very first
    load of every new session. Verified against a live repro (a hardcoded-
    title router did not crash; switching one title back to t() reproduced
    it immediately), not assumed.

    Peeking at session_state instead avoids the network round trip. Once any
    page has rendered once this session, its own t() call already resolved
    and cached the mission's default language (pmg_lang_default), so this
    becomes an exact cache hit on every later rerun — including every later
    navigation click, since st.navigation reruns this whole router from the
    top each time. The only approximation is the literal first render of a
    brand new session: it shows English until a page finishes resolving the
    real default, matching mission_default_lang()'s own "English is the safe
    degrade" fallback rather than guessing this mission's language here.

    Reimplements t()'s lookup rather than importing its private _lookup()
    helper. That's safe for nav labels specifically: every NAV_ENTRIES key is
    a short, whitespace-free string, so t()'s stripped-key fallback (built
    for triple-quoted blocks with surrounding newlines) never applies here.
    """
    import streamlit as st
    from app.i18n import _DEFAULT_KEY, _KEY, _LANGS
    from app.i18n.es import ES

    lang = st.session_state.get(_KEY)
    if lang not in _LANGS:
        lang = st.session_state.get(_DEFAULT_KEY, "en")
    return ES.get(key, key) if lang == "es" else key
