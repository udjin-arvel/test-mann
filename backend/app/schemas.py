from typing import Literal

from pydantic import BaseModel, Field


class ParticipantIn(BaseModel):
    name: str
    age: int | str


class CreateOrderRequest(BaseModel):
    sessionId: str = Field(alias="sessionId")
    email: str
    participants: list[ParticipantIn]
    scenario: Literal["success", "sold_out"] = "success"

    model_config = {"populate_by_name": True}


class EventOut(BaseModel):
    id: str
    title: str
    subtitle: str
    venue: str
    address: str
    duration: str
    ageRating: str


class SessionOut(BaseModel):
    id: str
    dateLabel: str
    weekday: str
    time: str
    seatsLeft: int


class RulesOut(BaseModel):
    minParticipants: int
    maxParticipants: int
    childAgeLimit: int
    adultAge: int
    prices: dict[str, int]


class CatalogOut(BaseModel):
    event: EventOut
    rules: RulesOut
    sessions: list[SessionOut]


class OrderSuccess(BaseModel):
    ok: Literal[True] = True
    orderId: str
    total: int
    seatsLeft: int


class OrderSoldOut(BaseModel):
    ok: Literal[False] = False
    reason: Literal["sold_out"] = "sold_out"
    seatsLeft: int


class OrderParticipantOut(BaseModel):
    name: str
    age: int
    ticketType: str
    price: int


class OrderDetailOut(BaseModel):
    orderId: str
    sessionId: str
    email: str
    total: int
    participants: list[OrderParticipantOut]
