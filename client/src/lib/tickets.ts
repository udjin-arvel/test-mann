/**
 * Бизнес-правила оформления билетов. Чистые функции без React —
 * покрыты тестами в tickets.test.ts.
 */

export const MIN_PARTICIPANTS = 1;
export const MAX_PARTICIPANTS = 4;

/** Младше этого возраста — детский билет. */
export const CHILD_AGE_LIMIT = 14;
/** Минимальный возраст сопровождающего. */
export const ADULT_AGE = 18;
/** Участники младше этого возраста могут прийти только с сопровождающим. */
export const NEEDS_ESCORT_BELOW_AGE = CHILD_AGE_LIMIT;

export const MAX_AGE = 120;

export const PRICES = {
  full: 2000,
  child: 1000,
} as const;

export type TicketType = keyof typeof PRICES;

export const TICKET_LABELS: Record<TicketType, string> = {
  full: "Полный",
  child: "Детский",
};

export interface Participant {
  id: string;
  name: string;
  /** Храним как строку из поля ввода, парсим через parseAge. */
  age: string;
}

export interface ParticipantErrors {
  name?: string;
  age?: string;
}

export function parseAge(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d{1,3}$/.test(trimmed)) return null;
  const age = Number(trimmed);
  if (age < 0 || age > MAX_AGE) return null;
  return age;
}

export function ticketTypeForAge(age: number): TicketType {
  return age < CHILD_AGE_LIMIT ? "child" : "full";
}

export function priceForAge(age: number): number {
  return PRICES[ticketTypeForAge(age)];
}

export interface OrderTotals {
  fullCount: number;
  childCount: number;
  unknownCount: number;
  total: number;
}

export function calcTotals(participants: Participant[]): OrderTotals {
  let fullCount = 0;
  let childCount = 0;
  let unknownCount = 0;
  for (const p of participants) {
    const age = parseAge(p.age);
    if (age === null) unknownCount++;
    else if (ticketTypeForAge(age) === "child") childCount++;
    else fullCount++;
  }
  return {
    fullCount,
    childCount,
    unknownCount,
    total: fullCount * PRICES.full + childCount * PRICES.child,
  };
}

export function validateParticipant(p: Participant): ParticipantErrors {
  const errors: ParticipantErrors = {};
  const name = p.name.trim();
  if (!name) errors.name = "Укажите имя";
  else if (name.length < 2) errors.name = "Слишком короткое имя";

  if (!p.age.trim()) errors.age = "Укажите возраст";
  else if (parseAge(p.age) === null) errors.age = `Возраст от 0 до ${MAX_AGE}`;
  return errors;
}

/**
 * Проверка состава заказа: количество участников и правило
 * «ребёнок только вместе с участником от 18 лет».
 * Возвращает текст ошибки или null.
 */
export function validateComposition(participants: Participant[]): string | null {
  if (participants.length < MIN_PARTICIPANTS) return "Добавьте хотя бы одного участника";
  if (participants.length > MAX_PARTICIPANTS)
    return `В одном заказе не больше ${MAX_PARTICIPANTS} участников`;

  const ages = participants.map((p) => parseAge(p.age));
  const hasChild = ages.some((a) => a !== null && a < NEEDS_ESCORT_BELOW_AGE);
  const hasAdult = ages.some((a) => a !== null && a >= ADULT_AGE);
  if (hasChild && !hasAdult) {
    return `Дети младше ${NEEDS_ESCORT_BELOW_AGE} лет могут пройти только вместе с участником от ${ADULT_AGE} лет в этом же заказе`;
  }
  return null;
}

export function isParticipantsStepValid(participants: Participant[]): boolean {
  return (
    participants.every((p) => Object.keys(validateParticipant(p)).length === 0) &&
    validateComposition(participants) === null
  );
}

export function validateEmail(email: string): string | null {
  const value = email.trim();
  if (!value) return "Укажите email";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return "Проверьте формат email";
  return null;
}

export function formatPrice(value: number): string {
  return `${new Intl.NumberFormat("ru-RU").format(value).replace(/\u00a0|\u202f/g, "\u00a0")}\u00a0₽`;
}

export function pluralTickets(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} билет`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} билета`;
  return `${n} билетов`;
}
