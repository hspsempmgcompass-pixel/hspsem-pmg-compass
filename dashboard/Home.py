"""Router entry point. Streamlit always runs this file first; it defines the
sidebar navigation and hands off to whichever page is selected.

Deliberately does NOT call st.set_page_config() here — every page in
app_pages/ already calls it itself (that's how each page keeps its own
browser-tab title), and set_page_config() may only be called once per script
run. Calling it here too raises StreamlitSetPageConfigMustBeFirstCommandError
the moment a page is opened — verified empirically against a throwaway
st.navigation spike, not assumed.

Sidebar labels are resolved through app.nav.nav_label() on every rerun (a
narrower stand-in for t() — see its docstring for why calling t() itself
here would crash the very first load of a new session), so they follow the
Language / Idioma toggle live: choosing English or Español sets
st.session_state and calls st.rerun() (render_language_switch), which
re-executes this file top to bottom and rebuilds the list with the new
language's titles before st.navigation ever draws the sidebar.
"""

import streamlit as st

from app.nav import NAV_ENTRIES, nav_label

pages = [
    st.Page(path, title=nav_label(key), default=path.endswith("00_Home.py"))
    for path, key in NAV_ENTRIES
]
st.navigation(pages).run()
