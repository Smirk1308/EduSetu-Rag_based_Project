"""Regression checks for chatbot provider routing and safe answer caching."""

import json
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

    def _engine(self, openai_client=None, google_client=None, groq_client=None):
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
        engine.get_openai_client = lambda api_key: openai_client
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

    # 1. Gemini succeeds and OpenAI is not called
    def test_gemini_succeeds_and_openai_is_not_called(self):
        openai_called = False

        def mock_openai_create(**kwargs):
            nonlocal openai_called
            openai_called = True
            raise AssertionError("OpenAI must not be called when Gemini succeeds")

        openai_client = SimpleNamespace(
            chat=SimpleNamespace(completions=SimpleNamespace(create=mock_openai_create))
        )
        google_client = SimpleNamespace(
            chats=SimpleNamespace(
                create=lambda **kwargs: SimpleNamespace(
                    send_message=lambda prompt: SimpleNamespace(text="Gemini primary answer"),
                    send_message_stream=lambda prompt: iter([SimpleNamespace(text="Gemini primary stream")]),
                )
            )
        )
        engine = self._engine(openai_client=openai_client, google_client=google_client)

        # Test non-streaming
        result = engine.generate_answer(
            "Where is NIT Srinagar located?",
            google_api_key="google-test-key",
            openai_api_key="openai-test-key",
            stream=False,
        )
        self.assertEqual(result["answer"], "Gemini primary answer")
        self.assertFalse(openai_called)

        # Test streaming
        stream_res = engine.generate_answer(
            "Tell me about PMSSS eligibility",
            google_api_key="google-test-key",
            openai_api_key="openai-test-key",
            stream=True,
        )
        chunks = list(stream_res["stream"])
        self.assertEqual(chunks, ["Gemini primary stream"])
        self.assertFalse(openai_called)

    # 2. A Gemini model-specific 503 continues to the next Gemini model
    def test_model_specific_google_503_continues_to_next_gemini_model(self):
        calls = []

        class OverloadedModelStream:
            def __iter__(self):
                return self

            def __next__(self):
                raise RuntimeError(
                    "503 UNAVAILABLE: This model is currently experiencing high demand"
                )

        def create_chat(model, **kwargs):
            calls.append(model)
            if len(calls) == 1:
                return SimpleNamespace(
                    send_message_stream=lambda prompt: OverloadedModelStream()
                )
            return SimpleNamespace(
                send_message_stream=lambda prompt: iter([SimpleNamespace(text="Gemini candidate 2 answer")])
            )

        google_client = SimpleNamespace(chats=SimpleNamespace(create=create_chat))
        engine = self._engine(openai_client=None, google_client=google_client)

        result = engine.generate_answer(
            "Where is NIT Srinagar located?",
            google_api_key="google-test-key",
            stream=True,
        )

        self.assertEqual(list(result["stream"]), ["Gemini candidate 2 answer"])
        self.assertEqual(len(calls), 2)
        self.assertNotEqual(calls[0], calls[1])
        # Crucial: 503 must cool down only that specific model, not the entire Google provider!
        self.assertTrue(model_router.provider_is_available("google"))
        self.assertFalse(model_router.model_is_available(calls[0]))

    # 3. If all Gemini candidates fail before any content, OpenAI is called
    def test_all_gemini_candidates_fail_before_content_calls_openai(self):
        def failing_gemini_chat(model, **kwargs):
            def failing_stream(prompt):
                raise RuntimeError("503 UNAVAILABLE: high demand")
            return SimpleNamespace(send_message_stream=failing_stream)

        google_client = SimpleNamespace(chats=SimpleNamespace(create=failing_gemini_chat))

        openai_chunks = [
            SimpleNamespace(choices=[SimpleNamespace(delta=SimpleNamespace(content="OpenAI fallback stream chunk"))])
        ]
        openai_calls = []

        def openai_create(**kwargs):
            openai_calls.append(kwargs)
            if kwargs.get("stream"):
                return iter(openai_chunks)
            return SimpleNamespace(
                choices=[SimpleNamespace(message=SimpleNamespace(content="OpenAI non-stream answer"))]
            )

        openai_client = SimpleNamespace(
            chat=SimpleNamespace(completions=SimpleNamespace(create=openai_create))
        )
        engine = self._engine(openai_client=openai_client, google_client=google_client)

        # Streaming test
        res_stream = engine.generate_answer(
            "Where is NIT Srinagar located?",
            google_api_key="google-test-key",
            openai_api_key="openai-test-key",
            stream=True,
        )
        tokens = list(res_stream["stream"])
        self.assertEqual(tokens, ["OpenAI fallback stream chunk"])
        self.assertGreaterEqual(len(openai_calls), 1)

        # Non-streaming test
        model_router.reset_router_state()
        def failing_gemini_chat_nonstream(model, **kwargs):
            return SimpleNamespace(send_message=lambda prompt: (_ for _ in ()).throw(RuntimeError("429 RESOURCE_EXHAUSTED")))

        google_client_ns = SimpleNamespace(chats=SimpleNamespace(create=failing_gemini_chat_nonstream))
        engine_ns = self._engine(openai_client=openai_client, google_client=google_client_ns)
        res_ns = engine_ns.generate_answer(
            "What is PMSSS?",
            google_api_key="google-test-key",
            openai_api_key="openai-test-key",
            stream=False,
        )
        self.assertEqual(res_ns["answer"], "OpenAI non-stream answer")
        self.assertIn("(OpenAI Fallback)", res_ns["model_used"])

    # 4. If OPENAI_API_KEY is missing, Gemini still works and fallback is safely skipped
    def test_missing_openai_key_gemini_works_and_fallback_safely_skipped(self):
        google_client = SimpleNamespace(
            chats=SimpleNamespace(
                create=lambda **kwargs: SimpleNamespace(
                    send_message=lambda prompt: SimpleNamespace(text="Gemini answer without openai key")
                )
            )
        )
        engine = self._engine(openai_client=None, google_client=google_client)

        # Gemini works normally when OPENAI_API_KEY is missing
        res = engine.generate_answer(
            "Where is NIT Srinagar located?",
            google_api_key="google-test-key",
            openai_api_key="",
            stream=False,
        )
        self.assertEqual(res["answer"], "Gemini answer without openai key")

        # When all Gemini models fail, OpenAI is safely skipped with a clear error
        with rag_engine._RESPONSE_CACHE_LOCK:
            rag_engine._RESPONSE_CACHE.clear()
        model_router.reset_router_state()
        failing_google_client = SimpleNamespace(
            chats=SimpleNamespace(
                create=lambda **kwargs: SimpleNamespace(
                    send_message=lambda prompt: (_ for _ in ()).throw(RuntimeError("503 UNAVAILABLE"))
                )
            )
        )
        engine_failing = self._engine(openai_client=None, google_client=failing_google_client)
        with self.assertRaisesRegex(RuntimeError, "OPENAI_API_KEY is not configured"):
            engine_failing.generate_answer(
                "Where is NIT Srinagar located?",
                google_api_key="google-test-key",
                openai_api_key="",
                stream=False,
            )

    # 5. If OpenAI fails, the backend sends the existing safe terminal error event
    def test_openai_fails_raises_safe_error_and_server_sends_terminal_event(self):
        def failing_gemini_chat(model, **kwargs):
            return SimpleNamespace(
                send_message_stream=lambda prompt: (_ for _ in ()).throw(RuntimeError("503 UNAVAILABLE"))
            )

        def failing_openai(**kwargs):
            raise RuntimeError("401 Unauthorized: Invalid OpenAI key")

        google_client = SimpleNamespace(chats=SimpleNamespace(create=failing_gemini_chat))
        openai_client = SimpleNamespace(
            chat=SimpleNamespace(completions=SimpleNamespace(create=failing_openai))
        )
        engine = self._engine(openai_client=openai_client, google_client=google_client)

        res = engine.generate_answer(
            "Where is NIT Srinagar located?",
            google_api_key="google-test-key",
            openai_api_key="invalid-key",
            stream=True,
        )
        # Consuming the generator raises the expected sanitized failure
        with self.assertRaisesRegex(RuntimeError, "OpenAI fallback failed"):
            list(res["stream"])

        self.assertFalse(model_router.provider_is_available("openai"))

    # 6. If Gemini emitted partial content before failing, OpenAI does not append a second response
    def test_gemini_partial_content_failure_does_not_call_openai_or_append_duplicate(self):
        class PartialFailureStream:
            def __init__(self):
                self.count = 0

            def __iter__(self):
                return self

            def __next__(self):
                self.count += 1
                if self.count == 1:
                    return SimpleNamespace(text="Partial Gemini text")
                raise RuntimeError("Connection dropped mid-stream")

        google_client = SimpleNamespace(
            chats=SimpleNamespace(
                create=lambda **kwargs: SimpleNamespace(
                    send_message_stream=lambda prompt: PartialFailureStream()
                )
            )
        )

        openai_called = False

        def mock_openai_create(**kwargs):
            nonlocal openai_called
            openai_called = True
            raise AssertionError("OpenAI must NEVER be called if Gemini already emitted tokens")

        openai_client = SimpleNamespace(
            chat=SimpleNamespace(completions=SimpleNamespace(create=mock_openai_create))
        )
        engine = self._engine(openai_client=openai_client, google_client=google_client)

        res = engine.generate_answer(
            "Where is NIT Srinagar located?",
            google_api_key="google-test-key",
            openai_api_key="openai-test-key",
            stream=True,
        )

        stream_gen = res["stream"]
        # First chunk was emitted
        first_chunk = next(stream_gen)
        self.assertEqual(first_chunk, "Partial Gemini text")

        # Second chunk fails: must raise and NOT call OpenAI
        with self.assertRaisesRegex(RuntimeError, "Connection dropped mid-stream"):
            next(stream_gen)

        self.assertFalse(openai_called, "OpenAI must not be called mid-stream")

    # 7. Groq is not called in the active provider path
    def test_groq_is_not_called_in_active_provider_path(self):
        def groq_fail(**kwargs):
            raise AssertionError("Groq must never be called in the active provider path")

        groq_client = SimpleNamespace(
            chat=SimpleNamespace(completions=SimpleNamespace(create=groq_fail))
        )
        google_client = SimpleNamespace(
            chats=SimpleNamespace(
                create=lambda **kwargs: SimpleNamespace(
                    send_message=lambda prompt: SimpleNamespace(text="Gemini answer"),
                    send_message_stream=lambda prompt: iter([SimpleNamespace(text="Gemini stream")]),
                )
            )
        )
        engine = self._engine(
            openai_client=None, google_client=google_client, groq_client=groq_client
        )

        # Simple query (previously intercepted by Groq): must use Gemini, NOT Groq!
        simple_res = engine.generate_answer(
            "Hi",
            api_key="groq-test-key",
            google_api_key="google-test-key",
            stream=False,
        )
        self.assertEqual(simple_res["answer"], "Gemini answer")
        self.assertNotIn("Groq", simple_res["model_used"])

        # Medium query: must use Gemini, NOT Groq!
        med_res = engine.generate_answer(
            "What are the eligibility documents for JKCET?",
            api_key="groq-test-key",
            google_api_key="google-test-key",
            stream=False,
        )
        self.assertEqual(med_res["answer"], "Gemini answer")
        self.assertNotIn("Groq", med_res["model_used"])

        # Complex query: must use Gemini, NOT Groq!
        complex_res = engine.generate_answer(
            "Based on my profile: PCM 85%, income 2L, list all scholarships",
            api_key="groq-test-key",
            google_api_key="google-test-key",
            stream=False,
        )
        self.assertEqual(complex_res["answer"], "Gemini answer")
        self.assertNotIn("Groq", complex_res["model_used"])

    # Stream caching test
    def test_streamed_answer_is_cached_for_following_first_turn(self):
        chunks = [SimpleNamespace(text="Streamed answer")]
        google_client = SimpleNamespace(
            chats=SimpleNamespace(
                create=lambda **kwargs: SimpleNamespace(
                    send_message_stream=lambda prompt: iter(chunks)
                )
            )
        )
        engine = self._engine(google_client=google_client)

        first = engine.generate_answer(
            "Where is NIT Srinagar located?", google_api_key="google-test-key", stream=True
        )
        self.assertEqual(list(first["stream"]), ["Streamed answer"])

        def should_not_call_provider(**kwargs):
            raise AssertionError("A matching first-turn answer should come from cache")

        engine.get_genai_client = lambda api_key: SimpleNamespace(
            chats=SimpleNamespace(create=should_not_call_provider)
        )
        cached = engine.generate_answer(
            "Where is NIT Srinagar located?", google_api_key="google-test-key", stream=True
        )
        self.assertEqual(list(cached["stream"]), ["Streamed answer"])
        self.assertIn("(Cached)", cached["model_used"])

    def test_empty_gemini_stream_is_not_reported_as_a_success(self):
        google_client = SimpleNamespace(
            chats=SimpleNamespace(
                create=lambda **kwargs: SimpleNamespace(
                    send_message_stream=lambda prompt: iter([])
                )
            )
        )
        engine = self._engine(google_client=google_client)

        result = engine.generate_answer(
            "Where is NIT Srinagar located?", google_api_key="google-test-key", stream=True
        )
        with self.assertRaisesRegex(RuntimeError, "empty response|failed to stream"):
            list(result["stream"])


if __name__ == "__main__":
    unittest.main()
