import random
import sqlite3
from typing import Literal

from app import tickets


def generate_order_id() -> str:
    return f"SQ-{random.randint(100000, 999999)}"


def create_order(
    conn: sqlite3.Connection,
    session_id: str,
    email: str,
    participants: list[tuple[str, int]],
    scenario: Literal["success", "sold_out"],
) -> tuple[dict, int]:
    """
    Returns (response_body, http_status).
    Uses BEGIN IMMEDIATE for seat locking.
    """
    ages = [p[1] for p in participants]
    count = len(participants)

    email_err = tickets.validate_email(email)
    if email_err:
        return {"detail": email_err}, 422

    for name, age in participants:
        name_err = tickets.validate_participant_name(name)
        if name_err:
            return {"detail": name_err}, 422

    comp_err = tickets.validate_composition(ages)
    if comp_err:
        return {"detail": comp_err}, 422

    total = tickets.calc_total(ages)

    conn.execute("BEGIN IMMEDIATE")
    try:
        session = conn.execute(
            "SELECT id, seats_left FROM sessions WHERE id = ?",
            (session_id,),
        ).fetchone()
        if not session:
            conn.execute("ROLLBACK")
            return {"detail": "Сеанс не найден"}, 404

        seats_left = session["seats_left"]

        if scenario == "sold_out":
            # Simulate race: seats taken while user filled the form
            new_seats = max(0, count - 2)
            conn.execute(
                "UPDATE sessions SET seats_left = ? WHERE id = ?",
                (new_seats, session_id),
            )
            conn.commit()
            return {
                "ok": False,
                "reason": "sold_out",
                "seatsLeft": new_seats,
            }, 409

        if seats_left < count:
            conn.execute("ROLLBACK")
            return {
                "ok": False,
                "reason": "sold_out",
                "seatsLeft": seats_left,
            }, 409

        order_id = generate_order_id()
        while conn.execute("SELECT 1 FROM orders WHERE id = ?", (order_id,)).fetchone():
            order_id = generate_order_id()

        conn.execute(
            "UPDATE sessions SET seats_left = seats_left - ? WHERE id = ?",
            (count, session_id),
        )
        conn.execute(
            "INSERT INTO orders (id, session_id, email, total) VALUES (?, ?, ?, ?)",
            (order_id, session_id, email.strip(), total),
        )
        for name, age in participants:
            ttype = tickets.ticket_type_for_age(age)
            price = tickets.price_for_age(age)
            conn.execute(
                """
                INSERT INTO order_participants (order_id, name, age, ticket_type, price)
                VALUES (?, ?, ?, ?, ?)
                """,
                (order_id, name.strip(), age, ttype, price),
            )

        updated = conn.execute(
            "SELECT seats_left FROM sessions WHERE id = ?",
            (session_id,),
        ).fetchone()
        conn.commit()
        return {
            "ok": True,
            "orderId": order_id,
            "total": total,
            "seatsLeft": updated["seats_left"] if updated else 0,
        }, 201
    except Exception:
        conn.execute("ROLLBACK")
        raise
