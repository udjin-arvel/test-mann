import type { ReactNode } from "react";
import { CalendarDays, CircleCheck, Mail, RotateCcw, TicketX, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EventInfo, Session } from "@/lib/api";
import {
  TICKET_LABELS,
  formatPrice,
  parseAge,
  priceForAge,
  ticketTypeForAge,
  type Participant,
} from "@/lib/tickets";
import { pluralSeats } from "./SessionStep";

interface SuccessProps {
  event: EventInfo;
  orderId: string;
  session: Session;
  participants: Participant[];
  email: string;
  total: number;
  onRestart: () => void;
}

export function SuccessResult({ event, orderId, session, participants, email, total, onRestart }: SuccessProps) {
  return (
    <section aria-labelledby="success-title" className="mx-auto max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="overflow-hidden rounded-3xl bg-card shadow-float">
        <div className="flex flex-col items-center px-6 pb-6 pt-8 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-success-soft text-success">
            <CircleCheck className="size-9" />
          </span>
          <h2 id="success-title" className="mt-4 text-2xl font-bold tracking-tight md:text-3xl">
            Заказ оформлен!
          </h2>
          <p className="mt-2 text-muted-foreground">
            Билеты отправлены на <span className="break-all font-semibold text-foreground">{email.trim()}</span>
          </p>
          <div className="mt-4 rounded-full bg-secondary px-4 py-1.5 text-sm font-semibold text-secondary-foreground">
            Заказ № {orderId}
          </div>
        </div>

        {/* «Линия отрыва» билета */}
        <div className="relative flex items-center" aria-hidden>
          <span className="absolute -left-3 size-6 rounded-full bg-background" />
          <span className="mx-5 w-full border-t-2 border-dashed border-border" />
          <span className="absolute -right-3 size-6 rounded-full bg-background" />
        </div>

        <div className="flex flex-col gap-4 px-6 py-6">
          <InfoRow icon={<CalendarDays className="size-5" />} title={event.title}>
            {session.dateLabel}, {session.weekday} · {session.time} · {event.venue}
          </InfoRow>
          <InfoRow icon={<Users className="size-5" />} title="Участники">
            <ul className="mt-1 flex flex-col gap-1">
              {participants.map((p) => {
                const age = parseAge(p.age) ?? 0;
                return (
                  <li key={p.id} className="flex justify-between gap-3">
                    <span className="truncate">
                      {p.name.trim()} · {TICKET_LABELS[ticketTypeForAge(age)].toLowerCase()}
                    </span>
                    <span className="shrink-0 tabular">{formatPrice(priceForAge(age))}</span>
                  </li>
                );
              })}
            </ul>
          </InfoRow>
          <div className="flex items-center justify-between border-t border-border pt-4 text-lg font-bold">
            <span>Оплачено</span>
            <span className="tabular">{formatPrice(total)}</span>
          </div>
        </div>
      </div>
      <Button variant="soft" size="xl" className="mt-4 w-full" onClick={onRestart}>
        <RotateCcw /> Оформить ещё один заказ
      </Button>
    </section>
  );
}

interface SoldOutProps {
  session: Session;
  seatsLeft: number;
  participantsCount: number;
  onReduce: () => void;
  onChangeSession: () => void;
}

export function SoldOutResult({ session, seatsLeft, participantsCount, onReduce, onChangeSession }: SoldOutProps) {
  const canReduce = seatsLeft > 0 && seatsLeft < participantsCount;
  return (
    <section aria-labelledby="soldout-title" className="mx-auto max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-3xl bg-card px-6 py-8 text-center shadow-float">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-warning-soft text-warning">
          <TicketX className="size-8" />
        </span>
        <h2 id="soldout-title" className="mt-4 text-2xl font-bold tracking-tight md:text-3xl">
          {seatsLeft === 0 ? "Места закончились" : "Мест осталось меньше"}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          Пока вы оформляли заказ, билеты на {session.dateLabel}, {session.time} раскупили.{" "}
          {seatsLeft === 0
            ? "Свободных мест на этот сеанс нет."
            : `Осталось ${pluralSeats(seatsLeft)}, а в заказе участников: ${participantsCount}.`}
        </p>
        <div className="mx-auto mt-5 flex max-w-md items-start gap-3 rounded-2xl bg-secondary p-4 text-left text-sm text-secondary-foreground">
          <Mail className="mt-0.5 size-5 shrink-0" />
          <p>Деньги не списаны. Данные участников и email сохранены — заново вводить не придётся.</p>
        </div>
        <div className="mt-6 flex flex-col gap-2">
          <Button variant="cta" size="xl" onClick={onChangeSession}>
            Выбрать другой сеанс
          </Button>
          {canReduce && (
            <Button variant="soft" size="xl" onClick={onReduce}>
              Уменьшить состав до {seatsLeft}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

function InfoRow({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}
