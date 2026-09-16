import sys
from pathlib import Path

# Add dashboard directory to path so app.* imports work from parent directory
dashboard_dir = Path(__file__).resolve().parent.parent
if str(dashboard_dir) not in sys.path:
    sys.path.insert(0, str(dashboard_dir))

from app.auth.auth import _ALWAYS_ALLOWED

PROVO_ACCOUNTS = {
    "jason.ellis2@churchofjesuschrist.org",
    "naomi.ellis@churchofjesuschrist.org",
    "pmg.compass@gmail.com",
}


def test_no_provo_accounts_in_allowlist():
    """Assert against the real set, not its source text. A source-text check
    is fooled by quote style, spacing and line wrapping - and would have been
    fooled here, since "pmg.compass@gmail.com" is a substring of the HSPSE
    account "hspsem.pmg.compass@gmail.com"."""
    normalized = {e.strip().lower() for e in _ALWAYS_ALLOWED}
    leaked = normalized & PROVO_ACCOUNTS
    assert leaked == set(), f"Provo accounts in HSPSE allowlist: {leaked}"


def test_hspse_account_present():
    normalized = {e.strip().lower() for e in _ALWAYS_ALLOWED}
    assert "hspsem.pmg.compass@gmail.com" in normalized


def test_no_ccsm_account_leaked_in():
    """Fixed 2026-09-04: this allowlist was unmodified CCSM content — its
    system account and its real president's real email were both still
    here. Pin that neither survives a future fork/copy again."""
    normalized = {e.strip().lower() for e in _ALWAYS_ALLOWED}
    assert "ccsm.pmg.compass@gmail.com" not in normalized
    assert "gutierrezsaucedom@churchofjesuschrist.org" not in normalized


def test_no_ccsm_missionaries_leaked_in():
    """Fixed 2026-09-16: 3 real CCSM missionaries' real emails sat in this
    allowlist unmodified since the 2026-09-04 fork, on the mistaken belief
    that _ALWAYS_ALLOWED membership "doesn't grant access to anything real"
    — it does: require_auth() unions this set straight into the sign-in
    allowlist, and is_leadership() treats membership alone as leadership.
    Pin that no CCSM personal address survives a future fork/copy again."""
    normalized = {e.strip().lower() for e in _ALWAYS_ALLOWED}
    leaked = normalized & {
        "zackary.butterfield@missionary.org",
        "hyrum.turner@missionary.org",
        "anderson.phillips@missionary.org",
    }
    assert leaked == set(), f"CCSM missionary accounts in HSPSE allowlist: {leaked}"


def test_hspse_president_present():
    normalized = {e.strip().lower() for e in _ALWAYS_ALLOWED}
    assert "kirt.christensen@churchofjesuschrist.org" in normalized
