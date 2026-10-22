import { ChevronLeft, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/event-hero.jpg";
import type { Session } from "@/lib/api";
import { PRICES, TICKET_LABELS, formatPrice, pluralTickets, type OrderTotals } from "@/lib/tickets";

export interface PrimaryAction {
  label: string;
  /** Короткая подпись для узкой нижней панели. */
  mobileLabel?: string | undefined;
  onClick: () => void;
  loading?: boolean | undefined;
  disabled?: boolean | undefined;
}

interface SummaryProps {
  eventTitle: string;
  session: Session | null;
  totals: OrderTotals;
  count: number;
  action: PrimaryAction;
  onBack?: (() => void) | undefined;
  footnote?: string | undefined;
}

/** Сводка заказа: боковая колонка на десктопе. */
export function OrderSummary({ eventTitle, session, totals, count, action, onBack, footnote }: SummaryProps) {
  return (
    <aside className="sticky top-6 hidden rounded-2xl bg-card p-5 shadow-card lg:block" aria-label="Ваш заказ">
      <div className="flex gap-3">
        <img src={heroImage} alt="" width={1600} height={912} loading="lazy" className="size-16 rounded-xl object-cover" />
        <div className="min-w-0">
          <div className="font-bold">{eventTitle}</div>
          <div className="text-sm text-muted-foreground">
            {session ? `${session.dateLabel}, ${session.weekday} · ${session.time}` : "Сеанс не выбран"}
          </div>
        </div>
      </div>

      <dl className="mt-5 flex flex-col gap-2 border-t border-border pt-4 text-sm">
        <Line label={`${TICKET_LABELS.full} × ${totals.fullCount}`} value={formatPrice(totals.fullCount * PRICES.full)} muted={!totals.fullCount} />
        <Line label={`${TICKET_LABELS.child} × ${totals.childCount}`} value={formatPrice(totals.childCount * PRICES.child)} muted={!totals.childCount} />
        {totals.unknownCount > 0 && (
          <Line label={`Без возраста × ${totals.unknownCount}`} value="—" muted />
        )}
      </dl>

      <div className="mt-4 flex items-end justify-between border-t border-border pt-4">
        <div>
          <div className="text-sm text-muted-foreground">Итого · {pluralTickets(count)}</div>
          <div className="text-3xl font-bold tabular">{formatPrice(totals.total)}</div>
        </div>
      </div>

      <Button variant="cta" size="xl" className="mt-5 w-full" onClick={action.onClick} disabled={action.disabled || action.loading}>
        {action.loading && <LoaderCircle className="animate-spin" />}
        {action.label}
      </Button>
      {onBack && (
        <Button variant="ghost" className="mt-2 w-full text-muted-foreground" onClick={onBack} disabled={action.loading}>
          <ChevronLeft /> Назад
        </Button>
      )}
      {footnote && <p className="mt-3 text-center text-xs text-muted-foreground">{footnote}</p>}
    </aside>
  );
}

function Line({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={muted ? "flex justify-between text-muted-foreground" : "flex justify-between"}>
      <dt>{label}</dt>
      <dd className="font-medium tabular">{value}</dd>
    </div>
  );
}

/** Нижняя панель с итогом и кнопкой — на телефоне и планшете. */
export function MobileActionBar({
  totals,
  count,
  action,
  onBack,
}: Omit<SummaryProps, "session" | "footnote" | "eventTitle">) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-2xl items-center gap-3">
        {onBack && (
          <Button variant="soft" size="icon" className="size-14 shrink-0 rounded-xl" onClick={onBack} disabled={action.loading} aria-label="Назад">
            <ChevronLeft className="!size-5" />
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-xs text-muted-foreground">{pluralTickets(count)}</div>
          <div className="text-xl font-bold leading-tight tabular">{formatPrice(totals.total)}</div>
        </div>
        <Button variant="cta" size="xl" className="shrink-0 px-5" onClick={action.onClick} disabled={action.disabled || action.loading}>
          {action.loading && <LoaderCircle className="animate-spin" />}
          {action.mobileLabel ?? action.label}
        </Button>
      </div>
    </div>
  );
}
