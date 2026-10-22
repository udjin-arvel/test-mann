import { CalendarDays } from "lucide-react";
import type { Session } from "@/lib/api";
import { cn } from "@/lib/utils";

interface SessionStepProps {
  sessions: Session[];
  selectedId: string | null;
  participantsCount: number;
  onSelect: (id: string) => void;
}

export function pluralSeats(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} место`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} места`;
  return `${n} мест`;
}

export function SessionStep({ sessions, selectedId, participantsCount, onSelect }: SessionStepProps) {
  return (
    <section aria-labelledby="session-title">
      <StepHeading id="session-title" title="Выберите сеанс" subtitle="Свободные места обновляются в реальном времени" />
      <div role="radiogroup" aria-labelledby="session-title" className="mt-5 grid gap-3 sm:grid-cols-2">
        {sessions.map((s) => {
          const soldOut = s.seatsLeft === 0;
          const notEnough = !soldOut && s.seatsLeft < participantsCount;
          const disabled = soldOut || notEnough;
          const selected = s.id === selectedId;
          const few = s.seatsLeft > 0 && s.seatsLeft <= 5;
          return (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onSelect(s.id)}
              className={cn(
                "group relative flex items-center justify-between gap-3 rounded-2xl border-2 bg-card p-4 text-left shadow-card transition-all",
                selected ? "border-primary" : "border-transparent hover:border-accent",
                disabled && "cursor-not-allowed opacity-55 shadow-none",
                !disabled && "cursor-pointer",
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-xl",
                    selected ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
                  )}
                >
                  <CalendarDays className="size-5" />
                </span>
                <div>
                  <div className="text-sm text-muted-foreground">
                    {s.dateLabel}, {s.weekday}
                  </div>
                  <div className="text-2xl font-bold tabular">{s.time}</div>
                </div>
              </div>
              <div className="text-right text-sm font-semibold">
                {soldOut ? (
                  <span className="text-muted-foreground">Мест нет</span>
                ) : notEnough ? (
                  <span className="text-warning">
                    Только {pluralSeats(s.seatsLeft)}
                    <span className="block text-xs font-normal text-muted-foreground">
                      а участников {participantsCount}
                    </span>
                  </span>
                ) : few ? (
                  <span className="rounded-full bg-warning-soft px-2.5 py-1 text-warning">
                    Осталось {pluralSeats(s.seatsLeft)}
                  </span>
                ) : (
                  <span className="rounded-full bg-success-soft px-2.5 py-1 text-success">Есть места</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function StepHeading({ id, title, subtitle }: { id: string; title: string; subtitle?: string }) {
  return (
    <div>
      <h2 id={id} className="text-2xl font-bold tracking-tight md:text-[28px]">
        {title}
      </h2>
      {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
