import type { ReactNode } from "react";
import { CircleAlert, Info, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ADULT_AGE,
  CHILD_AGE_LIMIT,
  MAX_PARTICIPANTS,
  NEEDS_ESCORT_BELOW_AGE,
  TICKET_LABELS,
  formatPrice,
  parseAge,
  priceForAge,
  ticketTypeForAge,
  validateParticipant,
  type Participant,
} from "@/lib/tickets";
import { cn } from "@/lib/utils";
import { Field } from "./Field";
import { StepHeading, pluralSeats } from "./SessionStep";

interface ParticipantsStepProps {
  participants: Participant[];
  onChange: (next: Participant[]) => void;
  onAdd: () => void;
  showErrors: boolean;
  compositionError: string | null;
  seatsLeft: number;
}

export function ParticipantsStep({
  participants,
  onChange,
  onAdd,
  showErrors,
  compositionError,
  seatsLeft,
}: ParticipantsStepProps) {
  const limit = Math.min(MAX_PARTICIPANTS, seatsLeft);
  const overSeats = participants.length > seatsLeft;
  const allAgesFilled = participants.every((p) => parseAge(p.age) !== null);
  const showComposition = compositionError && (showErrors || allAgesFilled);

  const update = (id: string, patch: Partial<Participant>) =>
    onChange(participants.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const remove = (id: string) => onChange(participants.filter((p) => p.id !== id));

  return (
    <section aria-labelledby="participants-title">
      <StepHeading
        id="participants-title"
        title="Кто идёт"
        subtitle={`Укажите имя и возраст каждого — тип билета определим сами. До ${MAX_PARTICIPANTS} участников в заказе.`}
      />

      <div className="mt-5 flex gap-3 rounded-2xl bg-secondary p-4 text-sm text-secondary-foreground">
        <Info className="mt-0.5 size-5 shrink-0" />
        <p>
          Дети младше {NEEDS_ESCORT_BELOW_AGE} лет проходят только вместе с участником от {ADULT_AGE} лет
          из этого же заказа. Детский билет — до {CHILD_AGE_LIMIT} лет.
        </p>
      </div>

      <ol className="mt-4 flex flex-col gap-3">
        {participants.map((p, i) => {
          const errors = showErrors ? validateParticipant(p) : {};
          const age = parseAge(p.age);
          const type = age !== null ? ticketTypeForAge(age) : null;
          return (
            <li key={p.id} className="rounded-2xl bg-card p-4 shadow-card sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">Участник {i + 1}</span>
                  {type ? (
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        type === "child" ? "bg-warning-soft text-warning" : "bg-secondary text-secondary-foreground",
                      )}
                    >
                      {TICKET_LABELS[type]} · {formatPrice(priceForAge(age!))}
                    </span>
                  ) : (
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      Билет по возрасту
                    </span>
                  )}
                </div>
                {participants.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(p.id)}
                    aria-label={`Удалить участника ${i + 1}`}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 />
                    <span className="hidden sm:inline">Удалить</span>
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-[1fr_96px] gap-3 sm:grid-cols-[1fr_140px]">
                <Field
                  label="Имя"
                  placeholder="Например, Анна"
                  autoComplete="off"
                  value={p.name}
                  maxLength={60}
                  error={errors.name}
                  onChange={(e) => update(p.id, { name: e.target.value })}
                />
                <Field
                  label="Возраст"
                  placeholder="лет"
                  inputMode="numeric"
                  maxLength={3}
                  value={p.age}
                  error={errors.age}
                  onChange={(e) => update(p.id, { age: e.target.value.replace(/\D/g, "") })}
                />
              </div>
            </li>
          );
        })}
      </ol>

      {showComposition && (
        <Alert>{compositionError}</Alert>
      )}
      {overSeats && (
        <Alert>
          На этом сеансе осталось {pluralSeats(seatsLeft)}. Удалите лишних участников или выберите другой сеанс.
        </Alert>
      )}

      {participants.length < limit && (
        <Button type="button" variant="dashed" size="xl" onClick={onAdd} className="mt-3 w-full">
          <Plus className="!size-5" /> Добавить участника
          <span className="font-normal text-muted-foreground">
            {participants.length} из {limit}
          </span>
        </Button>
      )}
    </section>
  );
}

function Alert({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" className="mt-3 flex gap-3 rounded-2xl bg-destructive-soft p-4 text-sm text-destructive">
      <CircleAlert className="mt-0.5 size-5 shrink-0" />
      <p>{children}</p>
    </div>
  );
}
