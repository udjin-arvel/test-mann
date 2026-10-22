import sqlite3
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app import tickets
from app.database import connect, init_db
from app.orders import create_order
from app.schemas import (
    CatalogOut,
    CreateOrderRequest,
    EventOut,
    OrderDetailOut,
    OrderParticipantOut,
    RulesOut,
    SessionOut,
)

_conn: sqlite3.Connection | None = None


def get_conn() -> sqlite3.Connection:
    global _conn
    if _conn is None:
        _conn = connect()
        init_db(_conn)
    return _conn


@asynccontextmanager
async def lifespan(_app: FastAPI):
    get_conn()
    yield
    global _conn
    if _conn is not None:
        _conn.close()
        _conn = None


app = FastAPI(title="Sqoch Tickets API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/catalog", response_model=CatalogOut)
def get_catalog():
    conn = get_conn()
    event_row = conn.execute("SELECT * FROM events LIMIT 1").fetchone()
    if not event_row:
        raise HTTPException(500, "Каталог не инициализирован")
    event = event_row
    sessions = conn.execute(
        "SELECT id, date_label, weekday, time, seats_left FROM sessions ORDER BY date_label, time"
    ).fetchall()
    return CatalogOut(
        event=EventOut(
            id=event["id"],
            title=event["title"],
            subtitle=event["subtitle"],
            venue=event["venue"],
            address=event["address"],
            duration=event["duration"],
            ageRating=event["age_rating"],
        ),
        rules=RulesOut(
            minParticipants=tickets.MIN_PARTICIPANTS,
            maxParticipants=tickets.MAX_PARTICIPANTS,
            childAgeLimit=tickets.CHILD_AGE_LIMIT,
            adultAge=tickets.ADULT_AGE,
            prices=dict(tickets.PRICES),
        ),
        sessions=[
            SessionOut(
                id=s["id"],
                dateLabel=s["date_label"],
                weekday=s["weekday"],
                time=s["time"],
                seatsLeft=s["seats_left"],
            )
            for s in sessions
        ],
    )


@app.post("/api/orders")
def post_order(body: CreateOrderRequest):
    conn = get_conn()
    parsed: list[tuple[str, int]] = []
    for p in body.participants:
        age = tickets.parse_age(p.age)
        if age is None:
            raise HTTPException(422, detail=f"Некорректный возраст: {p.age}")
        parsed.append((p.name, age))

    payload, status = create_order(
        conn,
        body.sessionId,
        body.email,
        parsed,
        body.scenario,
    )
    if status == 201:
        from fastapi.responses import JSONResponse

        return JSONResponse(status_code=201, content=payload)
    if status == 409:
        from fastapi.responses import JSONResponse

        return JSONResponse(status_code=409, content=payload)
    if status == 404:
        raise HTTPException(404, detail=payload.get("detail", "Not found"))
    raise HTTPException(status, detail=payload.get("detail", "Ошибка валидации"))


@app.get("/api/orders/{order_id}", response_model=OrderDetailOut)
def get_order(order_id: str):
    conn = get_conn()
    order = conn.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
    if not order:
        raise HTTPException(404, "Заказ не найден")
    parts = conn.execute(
        """
        SELECT name, age, ticket_type, price FROM order_participants
        WHERE order_id = ? ORDER BY id
        """,
        (order_id,),
    ).fetchall()
    return OrderDetailOut(
        orderId=order["id"],
        sessionId=order["session_id"],
        email=order["email"],
        total=order["total"],
        participants=[
            OrderParticipantOut(
                name=p["name"],
                age=p["age"],
                ticketType=p["ticket_type"],
                price=p["price"],
            )
            for p in parts
        ],
    )

