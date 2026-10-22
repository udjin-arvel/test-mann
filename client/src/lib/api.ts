import type { Participant } from "./tickets";

export interface EventInfo {
  id: string;
  title: string;
  subtitle: string;
  venue: string;
  address: string;
  duration: string;
  ageRating: string;
}

export interface Session {
  id: string;
  dateLabel: string;
  weekday: string;
  time: string;
  seatsLeft: number;
}

export interface Catalog {
  event: EventInfo;
  rules: {
    minParticipants: number;
    maxParticipants: number;
    childAgeLimit: number;
    adultAge: number;
    prices: { full: number; child: number };
  };
  sessions: Session[];
}

export type DemoScenario = "success" | "sold_out";

export interface ConfirmRequest {
  sessionId: string;
  participants: Participant[];
  email: string;
  scenario: DemoScenario;
}

export type ConfirmResult =
  | { ok: true; orderId: string; total: number; seatsLeft: number }
  | { ok: false; reason: "sold_out"; seatsLeft: number };

export async function fetchCatalog(): Promise<Catalog> {
  const res = await fetch("/api/catalog");
  if (!res.ok) {
    throw new Error("Не удалось загрузить каталог. Проверьте, что бэкенд запущен.");
  }
  return res.json() as Promise<Catalog>;
}

export async function confirmOrder(req: ConfirmRequest): Promise<ConfirmResult> {
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: req.sessionId,
      email: req.email.trim(),
      participants: req.participants.map((p) => ({
        name: p.name,
        age: Number(p.age.trim()),
      })),
      scenario: req.scenario,
    }),
  });

  const body = (await res.json()) as ConfirmResult & { detail?: string };

  if (res.status === 201 && body.ok === true) {
    return {
      ok: true,
      orderId: body.orderId,
      total: body.total,
      seatsLeft: body.seatsLeft,
    };
  }
  if (res.status === 409 && body.ok === false && body.reason === "sold_out") {
    return { ok: false, reason: "sold_out", seatsLeft: body.seatsLeft };
  }

  const message =
    typeof body.detail === "string"
      ? body.detail
      : Array.isArray(body.detail)
        ? body.detail.map((d: { msg?: string }) => d.msg).join(", ")
        : "Не удалось оформить заказ";
  throw new Error(message);
}
