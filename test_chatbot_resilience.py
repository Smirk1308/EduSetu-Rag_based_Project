"""Regression checks for chatbot provider routing and safe answer caching."""

import unittest
from types import SimpleNamespace

import model_router
import rag_engine
from rag_engine import RAGEngine


class TestChatbotResilience(unittest.TestCase):
    def setUp(self):
        model_router.reset_router_state()
        with rag_engine._RESPONSE_CACHE_LOCK:
            rag_engine._RESPONSE_CACHE.clear()

    def tearDown(self):
        with rag_engine._RESPONSE_CACHE_LOCK:
            rag_engine._RESPONSE_CACHE.clear()

    def _engine(self, groq_client, google_client=None):
        engine = object.__new__(RAGEngine)
        source = {
            "id": "source-1",
            "text": "Official scholarship guidance.",
            "source": "guide.pdf",
            "page": 1,
        }
        engine.contextualize_query = lambda query, history, client=None, model=None: query
        engine.retrieve = lambda query, top_k: [source]
        engine.format_conversation_history = lambda history, max_exchanges: ""
        engine.build_prompt = lambda query, context_chunks, history_str="": "grounded prompt"
        engine.get_groq_client = lambda api_key: groq_client
        engine.get_genai_client = lambda api_key: google_client
        return engine

    def test_cache_is_source_bound_and_skips_personal_or_followup_queries(self):
        source_a = [{"id": "a", "source": "guide.pdf", "page": 1, "text": "Rule A"}]
        source_b = [{"id": "b", "source": "guide.pdf", "page": 1, "text": "Rule B"}]

        key_a = rag_engine._response_cache_key("What is PMSSS?", "English", source_a, [])
        key_b = rag_engine._response_cache_key("What is PMSSS?", "English", source_b, [])

        self.assertNotEqual(key_a, key_b)
        self.assertIsNone(rag_engine._response_cache_key("What can I get?", "English", source_a, []))
        self.assertIsNone(rag_engine._response_cache_key(
            "What is it?", "English", source_a, [{"role": "assistant", "content": "Prior answer"}]
        ))

    def test_simple_query_uses_groq_before_gemini(self):
        groq_client = SimpleNamespace(
            chat=SimpleNamespace(
                completions=SimpleNamespace(
                    create=lambda **kwargs: SimpleNamespace(
                        choices=[SimpleNamespace(message=SimpleNamespace(content="Groq answer"))]
                    )
                )
            )
        )
        engine = self._engine(groq_client)

        result = engine.generate_answer(
            "Where is NIT Srinagar located?",
            api_key="groq-test-key",
            google_api_key="",
            stream=False,
        )

        self.assertEqual(result["answer"], "Groq answer")
        self.assertIn("(Groq)", result["model_used"])

    def test_groq_quota_error_falls_back_to_gemini(self):
        def raise_quota(**kwargs):
            raise RuntimeError("429 quota exceeded")

        groq_client = SimpleNamespace(
            chat=SimpleNamespace(completions=SimpleNamespace(create=raise_quota))
        )
        google_client = SimpleNamespace(
            chats=SimpleNamespace(
                create=lambda **kwargs: SimpleNamespace(
                    send_message=lambda prompt: SimpleNamespace(text="Gemini fallback answer")
                )
            )
        )
        engine = self._engine(groq_client, google_client)

        result = engine.generate_answer(
            "Where is NIT Srinagar located?",
            api_key="groq-test-key",
            google_api_key="google-test-key",
            stream=False,
        )

        self.assertEqual(result["answer"], "Gemini fallback answer")
        self.assertEqual(result["model_used"], "gemini-3.5-flash-lite")
        self.assertFalse(model_router.provider_is_available("groq"))

    def test_streamed_answer_is_cached_for_following_first_turn(self):
        chunks = [
            SimpleNamespace(choices=[SimpleNamespace(delta=SimpleNamespace(content="Streamed answer"))]),
        ]
        groq_client = SimpleNamespace(
            chat=SimpleNamespace(
                completions=SimpleNamespace(create=lambda **kwargs: iter(chunks))
            )
        )
        engine = self._engine(groq_client)

        first = engine.generate_answer(
            "Where is NIT Srinagar located?", api_key="groq-test-key", stream=True
        )
        self.assertEqual(list(first["stream"]), ["Streamed answer"])

        def should_not_call_provider(**kwargs):
            raise AssertionError("A matching first-turn answer should come from cache")

        engine.get_groq_client = lambda api_key: SimpleNamespace(
            chat=SimpleNamespace(completions=SimpleNamespace(create=should_not_call_provider))
        )
        cached = engine.generate_answer(
            "Where is NIT Srinagar located?", api_key="groq-test-key", stream=True
        )
        self.assertEqual(list(cached["stream"]), ["Streamed answer"])
        self.assertIn("(Cached)", cached["model_used"])

    def test_empty_groq_stream_is_not_reported_as_a_success(self):
        groq_client = SimpleNamespace(
            chat=SimpleNamespace(
                completions=SimpleNamespace(create=lambda **kwargs: iter([]))
            )
        )
        engine = self._engine(groq_client)

        result = engine.generate_answer(
            "Where is NIT Srinagar located?", api_key="groq-test-key", stream=True
        )
        with self.assertRaisesRegex(RuntimeError, "empty response"):
            list(result["stream"])


if __name__ == "__main__":
    unittest.main()
