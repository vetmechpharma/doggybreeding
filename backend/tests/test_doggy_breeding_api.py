"""Backend API tests for Doggy Breeding App.
Covers: root, auth/google, users CRUD, dogs, calc/cytology, calc/progesterone,
evaluations CRUD/search, stats, feedback, calc/combined.
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://canine-cycle.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="session")
def user(s):
    r = s.post(f"{API}/users", json={
        "name": "TEST_Vet",
        "mobile": "9999000000",
        "email": "TEST_vet@example.com",
        "category": "Doctor",
    })
    assert r.status_code == 200, r.text
    return r.json()


@pytest.fixture(scope="session")
def dog(s, user):
    r = s.post(f"{API}/dogs", json={
        "user_id": user["id"],
        "dog_name": "TEST_Bella",
        "owner_name": "TEST_Owner",
        "owner_mobile": "9000111222",
        "breed": "Labrador",
        "age": "3y",
        "sex": "Female",
        "weight": "25kg",
        "proestrus_bleeding_date": "2026-01-01",
    })
    assert r.status_code == 200, r.text
    return r.json()


# ---------------- Root / Health ----------------
class TestRoot:
    def test_root_version(self, s):
        r = s.get(f"{API}/")
        assert r.status_code == 200
        body = r.json()
        assert body.get("version") == "1.0.0"
        assert "Doggy" in body.get("message", "")


# ---------------- Auth ----------------
class TestAuth:
    def test_google_auth_creates_user(self, s):
        gid = f"quick-{int(time.time()*1000)}"
        r = s.post(f"{API}/auth/google", json={
            "google_id": gid, "name": "TEST_GoogleUser", "email": "TEST_g@example.com",
        })
        assert r.status_code == 200, r.text
        u = r.json()
        assert u["google_id"] == gid
        assert "id" in u and u["name"] == "TEST_GoogleUser"

    def test_google_auth_idempotent(self, s):
        gid = f"quick-idem-{int(time.time()*1000)}"
        r1 = s.post(f"{API}/auth/google", json={"google_id": gid, "name": "TEST_X"})
        r2 = s.post(f"{API}/auth/google", json={"google_id": gid, "name": "TEST_X"})
        assert r1.json()["id"] == r2.json()["id"]

    def test_google_auth_requires_id(self, s):
        r = s.post(f"{API}/auth/google", json={})
        assert r.status_code == 400


# ---------------- Users CRUD ----------------
class TestUsers:
    def test_create_and_get(self, s):
        r = s.post(f"{API}/users", json={"name": "TEST_U", "mobile": "9111111111", "category": "Breeder"})
        assert r.status_code == 200
        uid = r.json()["id"]
        g = s.get(f"{API}/users/{uid}")
        assert g.status_code == 200
        assert g.json()["name"] == "TEST_U"
        assert g.json()["category"] == "Breeder"

    def test_update_user(self, s):
        r = s.post(f"{API}/users", json={"name": "TEST_PreUpd", "mobile": "9222222222"})
        uid = r.json()["id"]
        up = s.put(f"{API}/users/{uid}", json={"name": "TEST_PostUpd", "mobile": "9333333333", "category": "Student"})
        assert up.status_code == 200
        g = s.get(f"{API}/users/{uid}")
        assert g.json()["name"] == "TEST_PostUpd"
        assert g.json()["mobile"] == "9333333333"

    def test_get_user_not_found(self, s):
        assert s.get(f"{API}/users/nonexistent-xyz").status_code == 404


# ---------------- Dogs ----------------
class TestDogs:
    def test_create_and_list(self, s, user):
        r = s.post(f"{API}/dogs", json={
            "user_id": user["id"], "dog_name": "TEST_Luna",
            "owner_name": "TEST_Owner2", "owner_mobile": "9001",
            "breed": "Poodle",
        })
        assert r.status_code == 200
        lst = s.get(f"{API}/dogs", params={"user_id": user["id"]})
        assert lst.status_code == 200
        names = [d["dog_name"] for d in lst.json()]
        assert "TEST_Luna" in names


# ---------------- Cytology calculator ----------------
class TestCytology:
    @pytest.mark.parametrize("inputs,expected_key", [
        ({"pc": 0, "ic": 0, "sic": 10, "sc": 50, "cc": 40}, "ESTRUS"),         # SC+CC=90 >=80
        ({"pc": 0, "ic": 5, "sic": 25, "sc": 40, "cc": 30}, "LATE_PROESTRUS"), # SC+CC=70
        ({"pc": 10, "ic": 20, "sic": 30, "sc": 20, "cc": 20}, "MID_PROESTRUS"),# SC+CC=40
        ({"pc": 30, "ic": 30, "sic": 25, "sc": 10, "cc": 5}, "EARLY_PROESTRUS"),# SC+CC=15
        ({"pc": 85, "ic": 10, "sic": 5, "sc": 0, "cc": 0}, "ANESTRUS"),        # pc>=80, ic<=20
        ({"pc": 40, "ic": 50, "sic": 5, "sc": 3, "cc": 2}, "DIESTRUS"),        # pc<80, ic>20, SC+CC=5
    ])
    def test_stages(self, s, inputs, expected_key):
        r = s.post(f"{API}/calc/cytology", json=inputs)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["stage_key"] == expected_key
        assert body["cornification_index"] == round(inputs["sc"] + inputs["cc"], 1)

    def test_total_not_100(self, s):
        r = s.post(f"{API}/calc/cytology", json={"pc": 50, "ic": 10, "sic": 10, "sc": 10, "cc": 10})
        assert r.status_code == 400


# ---------------- Progesterone calculator ----------------
class TestProgesterone:
    @pytest.mark.parametrize("value,key", [
        (0.2, "ANESTRUS"),
        (0.8, "EARLY_PROESTRUS"),
        (1.5, "LATE_PROESTRUS"),
        (3.0, "ESTRUS"),
        (10.0, "ESTRUS_OVULATION"),
        (25.0, "DIESTRUS"),
    ])
    def test_ranges(self, s, value, key):
        r = s.post(f"{API}/calc/progesterone", json={"value": value})
        assert r.status_code == 200, r.text
        assert r.json()["stage_key"] == key


# ---------------- Evaluations ----------------
class TestEvaluations:
    def test_create_search_get_delete(self, s, user, dog):
        # Compute a cytology result first
        calc = s.post(f"{API}/calc/cytology", json={"pc": 0, "ic": 0, "sic": 10, "sc": 50, "cc": 40}).json()
        cr = s.post(f"{API}/evaluations", json={
            "user_id": user["id"], "dog_id": dog["id"], "type": "cytology",
            "inputs": {"pc": 0, "ic": 0, "sic": 10, "sc": 50, "cc": 40},
            "result": calc,
        })
        assert cr.status_code == 200, cr.text
        eid = cr.json()["id"]

        # search by dog name
        lst = s.get(f"{API}/evaluations", params={"user_id": user["id"], "q": "TEST_Bella"})
        assert lst.status_code == 200
        assert any(e["id"] == eid for e in lst.json())

        # get bundle
        g = s.get(f"{API}/evaluations/{eid}")
        assert g.status_code == 200
        bundle = g.json()
        assert bundle["evaluation"]["id"] == eid
        assert bundle["dog"]["id"] == dog["id"]
        assert bundle["user"]["id"] == user["id"]

        # delete
        d = s.delete(f"{API}/evaluations/{eid}")
        assert d.status_code == 200
        g2 = s.get(f"{API}/evaluations/{eid}")
        assert g2.status_code == 404


# ---------------- Stats ----------------
class TestStats:
    def test_stats_aggregation(self, s, user, dog):
        # create one evaluation of each main stage
        for inputs in [
            {"pc": 0, "ic": 0, "sic": 10, "sc": 50, "cc": 40},  # ESTRUS
            {"pc": 85, "ic": 10, "sic": 5, "sc": 0, "cc": 0},   # ANESTRUS
            {"pc": 40, "ic": 50, "sic": 5, "sc": 3, "cc": 2},   # DIESTRUS
            {"pc": 30, "ic": 30, "sic": 25, "sc": 10, "cc": 5}, # EARLY_PROESTRUS
        ]:
            calc = s.post(f"{API}/calc/cytology", json=inputs).json()
            s.post(f"{API}/evaluations", json={
                "user_id": user["id"], "dog_id": dog["id"], "type": "cytology",
                "inputs": inputs, "result": calc,
            })
        r = s.get(f"{API}/stats/{user['id']}")
        assert r.status_code == 200
        body = r.json()
        assert body["total"] >= 4
        assert body["estrus"] >= 1
        assert body["anestrus"] >= 1
        assert body["diestrus"] >= 1
        assert body["proestrus"] >= 1


# ---------------- Feedback ----------------
class TestFeedback:
    def test_feedback(self, s, user):
        r = s.post(f"{API}/feedback", json={"user_id": user["id"], "rating": 5, "comments": "TEST_great"})
        assert r.status_code == 200
        assert r.json()["rating"] == 5


# ---------------- Combined ----------------
class TestCombined:
    def test_combined_higher_confidence_wins(self, s):
        r = s.post(f"{API}/calc/combined", json={
            "cytology": {"pc": 0, "ic": 0, "sic": 10, "sc": 50, "cc": 40},  # ESTRUS conf 92
            "progesterone_value": 10.0,  # ESTRUS_OVULATION conf 95
        })
        assert r.status_code == 200
        body = r.json()
        assert body["primary"]["stage_key"] == "ESTRUS_OVULATION"
        assert body["cytology"]["stage_key"] == "ESTRUS"
        assert body["progesterone"]["stage_key"] == "ESTRUS_OVULATION"

    def test_combined_requires_input(self, s):
        r = s.post(f"{API}/calc/combined", json={})
        assert r.status_code == 400
