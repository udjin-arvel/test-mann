import { Mail } from "lucide-react";
import { Field } from "./Field";
import { StepHeading } from "./SessionStep";

interface ContactStepProps {
  email: string;
  onChange: (email: string) => void;
  error: string | null;
}

export function ContactStep({ email, onChange, error }: ContactStepProps) {
  return (
    <section aria-labelledby="contact-title">
      <StepHeading
        id="contact-title"
        title="Куда отправить билеты"
        subtitle="Один email на весь заказ — пришлём билеты всех участников и чек"
      />
      <div className="mt-5 rounded-2xl bg-card p-4 shadow-card sm:p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
            <Mail className="size-5" />
          </span>
          <div className="text-sm text-muted-foreground">
            Электронные билеты можно показать с телефона на входе
          </div>
        </div>
        <Field
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="name@example.com"
          value={email}
          error={error ?? undefined}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </section>
  );
}
