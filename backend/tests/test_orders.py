import os
import tempfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Isolate DB per test module run
_tmp = tempfile.mkdtemp()
os.environ["DATABASE_PATH"] = str(Path(_tmp) / "test.db")

from app.database import reset_db_for_tests  # noqa: E402
from app.main import app, get_conn  # noqa: E402

client = TestClient(app)


@pytest.fixture(autouse=True)
def fresh_db():
    conn = get_conn()
    reset_db_for_tests(conn)
    yield


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_catalog():
    r = client.get("/api/catalog")
    assert r.status_code == 200
    data = r.json()
    assert data["event"]["title"] == "Космос рядом"
    assert len(data["sessions"]) == 4
    assert data["rules"]["prices"]["full"] == 2000


def test_create_order_success():
    r = client.post(
        "/api/orders",
        json={
            "sessionId": "s1",
            "email": "test@example.com",
            "participants": [{"name": "Иван", "age": 30}],
            "scenario": "success",
        },
    )
    assert r.status_code == 201
    body = r.json()
    assert body["ok"] is True
    assert body["orderId"].startswith("SQ-")
    assert body["total"] == 2000
    assert body["seatsLeft"] == 45

    cat = client.get("/api/catalog").json()
    s1 = next(s for s in cat["sessions"] if s["id"] == "s1")
    assert s1["seatsLeft"] == 45


def test_child_without_adult_rejected():
    r = client.post(
        "/api/orders",
        json={
            "sessionId": "s1",
            "email": "test@example.com",
            "participants": [{"name": "Петя", "age": 10}],
            "scenario": "success",
        },
    )
    assert r.status_code == 422


def test_sold_out_scenario():
    r = client.post(
        "/api/orders",
        json={
            "sessionId": "s2",
            "email": "test@example.com",
            "participants": [{"name": "Иван", "age": 30}],
            "scenario": "sold_out",
        },
    )
    assert r.status_code == 409
    body = r.json()
    assert body["ok"] is False
    assert body["reason"] == "sold_out"
    assert body["seatsLeft"] == 0


def test_real_sold_out_insufficient_seats():
    r = client.post(
        "/api/orders",
        json={
            "sessionId": "s3",
            "email": "test@example.com",
            "participants": [{"name": "Иван", "age": 30}],
            "scenario": "success",
        },
    )
    assert r.status_code == 409
    assert r.json()["seatsLeft"] == 0


def test_server_calculates_child_price():
    r = client.post(
        "/api/orders",
        json={
            "sessionId": "s1",
            "email": "test@example.com",
            "participants": [
                {"name": "Мама", "age": 35},
                {"name": "Сын", "age": 8},
            ],
            "scenario": "success",
        },
    )
    assert r.status_code == 201
    assert r.json()["total"] == 3000


def test_get_order():
    created = client.post(
        "/api/orders",
        json={
            "sessionId": "s1",
            "email": "user@mail.ru",
            "participants": [{"name": "Анна", "age": 25}],
            "scenario": "success",
        },
    ).json()
    r = client.get(f"/api/orders/{created['orderId']}")
    assert r.status_code == 200
    assert r.json()["email"] == "user@mail.ru"
    assert len(r.json()["participants"]) == 1
