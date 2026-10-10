"""
Unit Tests for Gemini 3.x Fleet Model Router & Dynamic Quota Balancer.
Tests:
1. MODEL_FLEET specifications and quotas (500 RPD for lites, 20 RPD for reasoning models).
2. Query complexity classification (simple, medium, complex).
3. Dynamic model selection and round-robin load balancing.
4. Auto-bypass of exhausted models (e.g. on 429 quota exhaustion).
5. Multilingual token floor guarantee (>= 4000 tokens for Urdu/Hindi/Kashmiri).
6. GEMINI_FALLBACK_POOL completeness.
"""

import unittest
import model_router
from model_router import (
    MODEL_FLEET,
    MODELS,
    TIER_CANDIDATE_POOLS,
    GEMINI_FALLBACK_POOL,
    classify_complexity,
    is_multilingual_query,
    get_routed_model_info,
    mark_model_cooldown,
    mark_provider_cooldown,
    provider_is_available,
    record_model_usage,
    reset_router_state,
)


class TestModelRouterFleet(unittest.TestCase):

    def setUp(self):
        reset_router_state()

    def test_01_fleet_catalog_specifications(self):
        """Verify all 6 active Gemini 3.x models are defined with correct quotas."""
        expected_models = [
            "gemini-3.8-flash",
            "gemini-3.6-flash",
            "gemini-3.5-flash",
            "gemini-3.7-flash",
            "gemini-3.5-flash-lite",
            "gemini-3.1-flash-lite",
        ]
        for m in expected_models:
            self.assertIn(m, MODEL_FLEET, f"Model {m} must be in MODEL_FLEET")
            cfg = MODEL_FLEET[m]
            self.assertIn("daily_limit", cfg)
            self.assertIn("rpm_limit", cfg)
            self.assertIn("max_tokens", cfg)
            self.assertIn("tier", cfg)

        # Lite models must have 500 RPD quota
        self.assertEqual(MODEL_FLEET["gemini-3.5-flash-lite"]["daily_limit"], 500)
        self.assertEqual(MODEL_FLEET["gemini-3.1-flash-lite"]["daily_limit"], 500)

        # Reasoning / Flash models must have 20 RPD quota
        for m in ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.7-flash"]:
            self.assertEqual(MODEL_FLEET[m]["daily_limit"], 20)

    def test_02_query_complexity_classification(self):
        """Test classification into simple, medium, and complex tiers."""
        # Simple
        self.assertEqual(classify_complexity("Hello"), "simple")
        self.assertEqual(classify_complexity("Where is NIT Srinagar located?"), "simple")

        # Medium
        self.assertEqual(classify_complexity("What are the eligibility documents for JKCET?"), "medium")
        self.assertEqual(classify_complexity("Compare SMVDU vs IUST for computer engineering"), "medium")

        # Complex
        self.assertEqual(
            classify_complexity("Based on my profile: PCM with 79%, income 3.5 Lakh, OM category, list all scholarships"),
            "complex"
        )
        self.assertEqual(
            classify_complexity("Complete step by step plan for PMSSS and college admission"),
            "complex"
        )

    def test_03_load_balancing_simple_tier(self):
        """Test that simple queries balance across 3.5-lite and 3.1-lite."""
        info1 = get_routed_model_info("Hi")
        self.assertIn(info1["model_id"], ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"])

        # Routing itself must not consume quota; record usage only after a provider accepts a request.
        self.assertEqual(model_router._runtime_state()["model_usage"][info1["model_id"]], 0)
        record_model_usage(info1["model_id"], info1["tier"])

        # Next query should choose the other model because the first one has higher usage.
        info2 = get_routed_model_info("What is EduSetu?")
        self.assertIn(info2["model_id"], ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"])
        self.assertNotEqual(info1["model_id"], info2["model_id"], "Simple queries should balance across both lite models")

    def test_04_complex_tier_routing_and_headroom(self):
        """Test complex queries select flagship models."""
        query = "Based on my profile (PCM, OM, income 3L), give me a comprehensive plan for all scholarships"
        info = get_routed_model_info(query)
        self.assertEqual(info["tier"], "complex")
        self.assertIn(info["model_id"], ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.7-flash", "gemini-3.5-flash"])
        self.assertEqual(info["max_tokens"], 4500)

    def test_05_exhausted_model_auto_bypass(self):
        """Test that models in an active cooldown are bypassed immediately."""
        import time
        model_router._runtime_state()["model_cooldowns"] = {
            "gemini-3.8-flash": time.time() + 60,
            "gemini-3.7-flash": time.time() + 60,
        }

        query = "Based on my profile, analyze all scholarships"
        info = get_routed_model_info(query)
        self.assertNotIn(info["model_id"], ["gemini-3.8-flash", "gemini-3.7-flash"])
        self.assertIn(info["model_id"], ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"])

    def test_06_all_flash_models_exhausted_smooth_degradation(self):
        """Test that if all 20 RPD models are cooling down, complex queries degrade smoothly to lite models with full token budget."""
        import time
        expiry = time.time() + 60
        for m in ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.7-flash"]:
            model_router._runtime_state()["model_cooldowns"][m] = expiry

        query = "Based on my profile, full analysis of PMSSS and Pragati"
        info = get_routed_model_info(query)
        self.assertIn(info["model_id"], ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"])
        # Crucial: Must maintain 4500 tokens for complex queries even on lite models so output is not cut off!
        self.assertEqual(info["max_tokens"], 4500)

    def test_07_multilingual_token_floor(self):
        """Test that non-English queries (Urdu, Hindi, Kashmiri) receive at least 4,000 tokens."""
        urdu_query = "مجھے وزیر اعظم خصوصی اسکالرشپ اسکیم (PMSSS) کے بارے میں بتائیں"
        self.assertTrue(is_multilingual_query(urdu_query))
        info = get_routed_model_info(urdu_query)
        self.assertGreaterEqual(info["max_tokens"], 4000)

        hindi_query = "छात्रवृत्ति के लिए कौन से दस्तावेज चाहिए?"
        self.assertTrue(is_multilingual_query(hindi_query))
        info_hi = get_routed_model_info(hindi_query)
        self.assertGreaterEqual(info_hi["max_tokens"], 4000)

        # The API must honor the selected language even when the query is English.
        selected_hindi = get_routed_model_info("Where can I apply?", language="Hindi")
        self.assertGreaterEqual(selected_hindi["max_tokens"], 4000)

    def test_08_fallback_pool_completeness(self):
        """Verify all 6 active models exist in GEMINI_FALLBACK_POOL."""
        self.assertEqual(len(GEMINI_FALLBACK_POOL), 6)
        expected = [
            "gemini-3.8-flash",
            "gemini-3.6-flash",
            "gemini-3.5-flash",
            "gemini-3.5-flash-lite",
            "gemini-3.1-flash-lite",
            "gemini-3.7-flash",
        ]
        for m in expected:
            self.assertIn(m, GEMINI_FALLBACK_POOL)

    def test_09_rate_limits_expire_instead_of_disabling_a_model_for_the_session(self):
        model_id = "gemini-3.8-flash"
        mark_model_cooldown(model_id, "429: retry after 30 seconds", now=1000)
        self.assertIn(model_id, model_router._runtime_state()["exhausted_models"])

        # A later routing decision automatically clears the expired cooldown.
        model_router._clear_expired_cooldowns(now=1031)
        self.assertNotIn(model_id, model_router._runtime_state()["exhausted_models"])

    def test_10_provider_quota_cooldown_honors_retry_hints(self):
        mark_provider_cooldown("groq", "429: rate limit, retry after 30 seconds", now=1000)

        self.assertFalse(provider_is_available("groq", now=1010))
        self.assertTrue(provider_is_available("groq", now=1031))

    def test_11_daily_quota_cools_provider_and_model_404_does_not(self):
        mark_provider_cooldown(
            "google",
            "RESOURCE_EXHAUSTED: GenerateRequestsPerDayPerProjectPerModel exceeded",
            now=1000,
        )
        self.assertFalse(provider_is_available("google", now=1500))

        reset_router_state()
        mark_provider_cooldown("google", "404 model not found", now=1000)
        self.assertTrue(provider_is_available("google", now=1000))


if __name__ == "__main__":
    unittest.main()
