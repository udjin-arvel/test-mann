import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type FormStep = "session" | "participants" | "contact" | "review";

export const STEPS: { id: FormStep; label: string }[] = [
  { id: "session", label: "Сеанс" },
  { id: "participants", label: "Участники" },
  { id: "contact", label: "Контакты" },
  { id: "review", label: "Проверка" },
];

interface StepperProps {
  current: FormStep;
  /** Индекс самого дальнего шага, до которого пользователь уже дошёл. */
  reachedIndex: number;
  onSelect: (step: FormStep) => void;
}

export function Stepper({ current, reachedIndex, onSelect }: StepperProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);
  return (
    <nav aria-label="Шаги оформления" className="rounded-2xl bg-card p-2 shadow-float">
      <ol className="grid grid-cols-4 gap-1">
        {STEPS.map((step, i) => {
          const isCurrent = i === currentIndex;
          const isDone = !isCurrent && i < reachedIndex;
          const clickable = i <= reachedIndex && !isCurrent;
          return (
            <li key={step.id}>
              <button
                type="button"
                disabled={!clickable}
                onClick={() => onSelect(step.id)}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex w-full flex-col items-center gap-1.5 rounded-xl px-1 py-2 text-center transition-colors sm:flex-row sm:justify-center sm:gap-2 sm:px-3 sm:py-3",
                  isCurrent && "bg-secondary",
                  clickable && "cursor-pointer hover:bg-muted",
                  !clickable && !isCurrent && "cursor-default",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    isCurrent && "bg-primary text-primary-foreground",
                    isDone && !isCurrent && "bg-success text-primary-foreground",
                    !isCurrent && !isDone && "bg-muted text-muted-foreground",
                  )}
                >
                  {isDone && !isCurrent ? <Check className="size-4" strokeWidth={3} /> : i + 1}
                </span>
                <span
                  className={cn(
                    "text-[11px] font-semibold leading-tight sm:text-sm",
                    isCurrent ? "text-secondary-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
