import { describe, expect, it } from "vitest";
import {
  calcTotals,
  parseAge,
  priceForAge,
  validateComposition,
  validateEmail,
  validateParticipant,
  type Participant,
} from "./tickets";

const p = (age: string, name = "Анна"): Participant => ({ id: Math.random().toString(), name, age });

describe("цены билетов", () => {
  it("полный билет от 14 лет стоит 2000 ₽", () => {
    expect(priceForAge(14)).toBe(2000);
    expect(priceForAge(35)).toBe(2000);
  });

  it("детский билет младше 14 лет стоит 1000 ₽", () => {
    expect(priceForAge(13)).toBe(1000);
    expect(priceForAge(0)).toBe(1000);
  });

  it("итог складывается из билетов всех участников", () => {
    expect(calcTotals([p("40"), p("10"), p("15")]).total).toBe(5000);
  });
});

describe("состав заказа", () => {
  it("в заказе от 1 до 4 участников", () => {
    expect(validateComposition([])).not.toBeNull();
    expect(validateComposition([p("30")])).toBeNull();
    expect(validateComposition([p("30"), p("30"), p("30"), p("30")])).toBeNull();
    expect(validateComposition([p("30"), p("30"), p("30"), p("30"), p("30")])).not.toBeNull();
  });

  it("ребёнок без участника от 18 лет не допускается", () => {
    expect(validateComposition([p("8")])).not.toBeNull();
    expect(validateComposition([p("8"), p("17")])).not.toBeNull();
  });

  it("ребёнок с участником от 18 лет допускается", () => {
    expect(validateComposition([p("8"), p("18")])).toBeNull();
  });
});

describe("данные участника и email", () => {
  it("имя и возраст обязательны", () => {
    expect(validateParticipant({ id: "1", name: "", age: "" })).toEqual({
      name: expect.any(String),
      age: expect.any(String),
    });
    expect(validateParticipant(p("20"))).toEqual({});
  });

  it("возраст — целое число от 0 до 120", () => {
    expect(parseAge("abc")).toBeNull();
    expect(parseAge("121")).toBeNull();
    expect(parseAge("7")).toBe(7);
  });

  it("email проверяется по формату", () => {
    expect(validateEmail("test@mail")).not.toBeNull();
    expect(validateEmail("test@mail.ru")).toBeNull();
  });
});
