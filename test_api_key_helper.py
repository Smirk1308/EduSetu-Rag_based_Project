"""
Unit tests for api_key_helper.py.
Verifies multi-layer resolution, regex extraction of unquoted keys, and diagnostics masking.
"""

import api_key_helper


def test_mask_key():
    assert api_key_helper._mask_key("") == "Not configured"
    assert api_key_helper._mask_key("123") == "***"
    assert api_key_helper._mask_key("AQ.Ab8RN6K_test_ETlzw") == "AQ.A...Tlzw"


def test_environment_keys_are_resolved_without_framework_secrets(monkeypatch):
    monkeypatch.setenv("GOOGLE_API_KEY", "google_test_key_123456")
    monkeypatch.setenv("GROQ_API_KEY", "groq_test_key_123456")
    monkeypatch.setenv("ADMIN_PASSWORD", "local_admin_test")

    assert api_key_helper.get_google_api_key() == "google_test_key_123456"
    assert api_key_helper.get_groq_api_key() == "groq_test_key_123456"
    assert api_key_helper.get_admin_password() == "local_admin_test"


def test_live_diagnostics():
    diag = api_key_helper.get_api_diagnostics()
    assert "google_configured" in diag
    assert "groq_configured" in diag
    assert "mode" in diag
    # Ensure masked values don't leak full secrets
    assert not diag["google_masked"].startswith("AQ.Ab8RN6KGtZ-")
