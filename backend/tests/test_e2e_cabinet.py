"""C-19 Playwright E2E cabinet — skips cleanly when FE :3000 is down."""

from __future__ import annotations

import os
import sys
from pathlib import Path

import pytest

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))

from e2e_cabinet import BASE, run_e2e, server_up  # noqa: E402

pytestmark = pytest.mark.e2e


@pytest.fixture(scope="module")
def fe_available():
    if os.environ.get("E2E_FORCE") == "1":
        if not server_up(BASE):
            pytest.fail(f"E2E_FORCE=1 but frontend not up at {BASE}")
        return True
    if not server_up(BASE):
        pytest.skip(f"frontend not up at {BASE} (set E2E_BASE_URL or start next dev)")
    return True


def test_e2e_cabinet_login_register_templates_mobile(fe_available):
    """Login brand, register → /app, /app/templates, no h-scroll at 390."""
    try:
        from playwright.sync_api import sync_playwright  # noqa: F401
    except ImportError:
        pytest.skip("playwright not installed (pip install playwright && playwright install chromium)")

    result = run_e2e()
    assert result["ok"], f"E2E issues: {result['issues']}"
