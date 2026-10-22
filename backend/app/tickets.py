"""Бизнес-правила оформления билетов (зеркало client/src/lib/tickets.ts)."""

MIN_PARTICIPANTS = 1
MAX_PARTICIPANTS = 4
CHILD_AGE_LIMIT = 14
ADULT_AGE = 18
NEEDS_ESCORT_BELOW_AGE = CHILD_AGE_LIMIT
MAX_AGE = 120

PRICES = {"full": 2000, "child": 1000}


def parse_age(value: str | int) -> int | None:
    if isinstance(value, int):
        age = value
        return age if 0 <= age <= MAX_AGE else None
    trimmed = value.strip()
    if not trimmed.isdigit() or len(trimmed) > 3:
        return None
    age = int(trimmed)
    if age < 0 or age > MAX_AGE:
        return None
    return age


def ticket_type_for_age(age: int) -> str:
    return "child" if age < CHILD_AGE_LIMIT else "full"


def price_for_age(age: int) -> int:
    return PRICES[ticket_type_for_age(age)]


def calc_total(ages: list[int]) -> int:
    return sum(price_for_age(a) for a in ages)


def validate_participant_name(name: str) -> str | None:
    n = name.strip()
    if not n:
        return "Укажите имя"
    if len(n) < 2:
        return "Слишком короткое имя"
    return None


def validate_email(email: str) -> str | None:
    value = email.strip()
    if not value:
        return "Укажите email"
    if "@" not in value or "." not in value.split("@")[-1]:
        return "Проверьте формат email"
    parts = value.split("@")
    if len(parts) != 2 or not parts[0] or len(parts[1]) < 3:
        return "Проверьте формат email"
    return None


def validate_composition(ages: list[int]) -> str | None:
    if len(ages) < MIN_PARTICIPANTS:
        return "Добавьте хотя бы одного участника"
    if len(ages) > MAX_PARTICIPANTS:
        return f"В одном заказе не больше {MAX_PARTICIPANTS} участников"
    has_child = any(a < NEEDS_ESCORT_BELOW_AGE for a in ages)
    has_adult = any(a >= ADULT_AGE for a in ages)
    if has_child and not has_adult:
        return (
            f"Дети младше {NEEDS_ESCORT_BELOW_AGE} лет могут пройти только вместе "
            f"с участником от {ADULT_AGE} лет в этом же заказе"
        )
    return None
