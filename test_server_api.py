"""
Integration tests for FastAPI server endpoints in server.py.
Tests all catalogue, health, readiness, model fleet, and SSE streaming chat endpoints.
"""

import json
import unittest
from fastapi.testclient import TestClient
from server import app


class TestServerEndpoints(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_root(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "online")
        self.assertIn("version", data)

    def test_02_health(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")

    def test_03_ready(self):
        response = self.client.get("/api/ready")
        self.assertIn(response.status_code, [200, 503])
        if response.status_code == 200:
            self.assertEqual(response.json()["status"], "ready")

    def test_04_models(self):
        response = self.client.get("/api/models")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("fleet", data)
        self.assertGreaterEqual(len(data["fleet"]), 5)
        self.assertIn("default_model", data)
        self.assertIn("fallback_pool", data)

    def test_05_scholarship_catalog(self):
        response = self.client.get("/api/catalog/scholarships")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("items", data)
        self.assertGreater(len(data["items"]), 0)
        first = data["items"][0]
        self.assertIn("name", first)
        self.assertIn("portal_url", first)

    def test_06_scholarship_match(self):
        payload = {
            "domicile": "J&K",
            "income": 200000,
            "percentage": 85.0,
            "category": "All",
            "gender": "female",
            "stream": "PCM"
        }
        response = self.client.post("/api/catalog/scholarships/match", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("items", data)
        self.assertIn("documents_checklist", data)
        self.assertGreater(len(data["documents_checklist"]), 0)

    def test_07_colleges_catalog(self):
        response = self.client.get("/api/catalog/colleges?district=Srinagar")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("items", data)
        self.assertIn("total", data)
        for c in data["items"]:
            self.assertEqual(c["district"], "Srinagar")

    def test_08_colleges_options(self):
        response = self.client.get("/api/catalog/colleges/options")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("districts", data)
        self.assertIn("types", data)
        self.assertIn("Srinagar", data["districts"])

    def test_09_college_detail(self):
        response = self.client.get("/api/catalog/colleges/nit_srinagar")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("item", data)
        self.assertEqual(data["item"]["id"], "nit_srinagar")

    def test_10_chat_offline_streaming(self):
        payload = {
            "message": "What is PMSSS?",
            "history": [],
            "language": "English",
            "offline_mode": True
        }
        response = self.client.post("/api/chat", json=payload)
        self.assertEqual(response.status_code, 200)
        self.assertIn("text/event-stream", response.headers.get("content-type", ""))
        content = response.text
        self.assertIn("data: ", content)
        self.assertIn('"done": true', content.lower())


if __name__ == "__main__":
    unittest.main()
