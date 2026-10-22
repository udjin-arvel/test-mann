import { CalendarDays, Mail, MapPin, Pencil, Users } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { DemoScenario, EventInfo, Session } from "@/lib/api";
import {
  TICKET_LABELS,
  formatPrice,
  parseAge,
  priceForAge,
  ticketTypeForAge,
  type Participant,
} from "@/lib/tickets";
import { cn } from "@/lib/utils";
import { StepHeading } from "./SessionStep";
import type { FormStep } from "./Stepper";

interface ReviewStepProps {
  event: EventInfo;
  session: Session;
  participants: Participant[];
  email: string;
  total: number;
  scenario: DemoScenario;
  onScenarioChange: (s: DemoScenario) => void;
  onEdit: (step: FormStep) => void;
  disabled: boolean;
}

export function ReviewStep({
  event,
  session,
  participants,
  email,
  total,
  scenario,
  onScenarioChange,
  onEdit,
  disabled,
}: ReviewStepProps) {
  return (
    <section aria-labelledby="review-title">
      <StepHeading
        id="review-title"
        title="Проверьте заказ"
        subtitle="Всё можно изменить до подтверждения"
      />

      <div className="mt-5 flex flex-col gap-3">
        <ReviewCard
          icon={<CalendarDays className="size-5" />}
          title="Мероприятие"
          onEdit={() => onEdit("session")}
          disabled={disabled}
        >
          <div className="font-semibold">{event.title}</div>
          <div className="text-muted-foreground">
            {session.dateLabel}, {session.weekday} · {session.time}
          </div>
          <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5" /> {event.venue}, {event.address}
          </div>
        </ReviewCard>

        <ReviewCard
          icon={<Users className="size-5" />}
          title={`Участники · ${participants.length}`}
          onEdit={() => onEdit("participants")}
          disabled={disabled}
        >
          <ul className="divide-y divide-border">
            {participants.map((p) => {
              const age = parseAge(p.age) ?? 0;
              const type = ticketTypeForAge(age);
              return (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{p.name.trim()}</div>
                    <div className="text-sm text-muted-foreground">
                      {age} {ageWord(age)} · {TICKET_LABELS[type].toLowerCase()} билет
                    </div>
                  </div>
                  <div className="shrink-0 font-semibold tabular">{formatPrice(priceForAge(age))}</div>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-lg font-bold">
            <span>Итого</span>
            <span className="tabular">{formatPrice(total)}</span>
          </div>
        </ReviewCard>

        <ReviewCard
          icon={<Mail className="size-5" />}
          title="Контакты"
          onEdit={() => onEdit("contact")}
          disabled={disabled}
        >
          <div className="break-all font-medium">{email.trim()}</div>
          <div className="text-sm text-muted-foreground">Сюда придут билеты и чек</div>
        </ReviewCard>

        <fieldset className="rounded-2xl border-2 border-dashed border-input p-4" disabled={disabled}>
          <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Демо-режим
          </legend>
          <p className="mb-3 text-sm text-muted-foreground">Что ответит сервер при подтверждении:</p>
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
            {(
              [
                ["success", "Успешно"],
                ["sold_out", "Места закончились"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={scenario === value}
                onClick={() => onScenarioChange(value)}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                  scenario === value ? "bg-card text-foreground shadow-card" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
    </section>
  );
}

function ReviewCard({
  icon,
  title,
  onEdit,
  disabled,
  children,
}: {
  icon: ReactNode;
  title: string;
  onEdit: () => void;
  disabled: boolean;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-card sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <span className="text-primary">{icon}</span>
          {title}
        </div>
        <Button type="button" variant="link" size="sm" onClick={onEdit} disabled={disabled} className="px-0 font-semibold">
          <Pencil /> Изменить
        </Button>
      </div>
      {children}
    </div>
  );
}

export function ageWord(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "год";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "года";
  return "лет";
}
