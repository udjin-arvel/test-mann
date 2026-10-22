import os
import sqlite3
from pathlib import Path
from typing import Any

DEFAULT_DB = Path(__file__).resolve().parent.parent / "data" / "app.db"


def get_database_path() -> Path:
    raw = os.environ.get("DATABASE_PATH")
    return Path(raw) if raw else DEFAULT_DB


def connect() -> sqlite3.Connection:
    path = get_database_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            subtitle TEXT NOT NULL,
            venue TEXT NOT NULL,
            address TEXT NOT NULL,
            duration TEXT NOT NULL,
            age_rating TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            event_id TEXT NOT NULL REFERENCES events(id),
            date_label TEXT NOT NULL,
            weekday TEXT NOT NULL,
            time TEXT NOT NULL,
            seats_left INTEGER NOT NULL CHECK(seats_left >= 0)
        );

        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL REFERENCES sessions(id),
            email TEXT NOT NULL,
            total INTEGER NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS order_participants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            age INTEGER NOT NULL,
            ticket_type TEXT NOT NULL,
            price INTEGER NOT NULL
        );
        """
    )
    row = conn.execute("SELECT COUNT(*) AS c FROM events").fetchone()
    if row and row["c"] == 0:
        seed(conn)
    conn.commit()


def seed(conn: sqlite3.Connection) -> None:
    conn.execute(
        """
        INSERT INTO events (id, title, subtitle, venue, address, duration, age_rating)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            "e1",
            "Космос рядом",
            "Научное шоу под куполом планетария для всей семьи",
            "Планетарий «Орбита», Томск",
            "пр. Ленина, 1",
            "1 ч 20 мин",
            "0+",
        ),
    )
    sessions = [
        ("s1", "e1", "14 ноября", "сб", "12:00", 46),
        ("s2", "e1", "14 ноября", "сб", "16:00", 3),
        ("s3", "e1", "15 ноября", "вс", "12:00", 0),
        ("s4", "e1", "15 ноября", "вс", "18:30", 21),
    ]
    conn.executemany(
        """
        INSERT INTO sessions (id, event_id, date_label, weekday, time, seats_left)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        sessions,
    )


def row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    return {k: row[k] for k in row.keys()}


def reset_db_for_tests(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        DELETE FROM order_participants;
        DELETE FROM orders;
        DELETE FROM sessions;
        DELETE FROM events;
        """
    )
    seed(conn)
    conn.commit()
