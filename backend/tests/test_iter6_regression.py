"""Iteration 6 regression smoke tests — backend unchanged this iteration."""
import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://canine-cycle.preview.emergentagent.com").rstrip("/")


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- Health / root
def test_root_returns_version(client):
    r = client.get(f"{BASE_URL}/api/")
    assert r.status_code == 200
    body = r.json()
    assert body.get("version") == "1.0.0"
    assert "Doggy" in body.get("message", "")


# --- Cytology calculator
def test_cytology_estrus_payload(client):
    payload = {"pc": 20, "ic": 0, "sic": 0, "sc": 80, "cc": 0}
    r = client.post(f"{BASE_URL}/api/calc/cytology", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert data["stage"] == "Estrus"
    assert data["stage_key"] == "ESTRUS"
    assert data["cornification_index"] == 80.0
    assert "breeding_status" in data
