import { Clock, MapPin, Ticket } from "lucide-react";
import heroImage from "@/assets/event-hero.jpg";
import type { EventInfo } from "@/lib/api";
import { CHILD_AGE_LIMIT, MAX_PARTICIPANTS, PRICES, formatPrice } from "@/lib/tickets";

interface EventHeaderProps {
  event: EventInfo;
}

export function EventHeader({ event }: EventHeaderProps) {
  return (
    <header className="bg-header text-primary-foreground">
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-4 sm:px-6 md:pb-24">
        <div className="flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary-foreground text-primary">
              <Ticket className="size-5" />
            </span>
            sqoch
          </a>
          <span className="text-sm font-medium text-primary-foreground/80">Поддержка 24/7</span>
        </div>

        <div className="mt-8 grid items-center gap-6 md:mt-10 md:grid-cols-[1fr_400px] md:gap-10">
          <div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-primary-foreground/20 px-3 py-1">{event.ageRating}</span>
              <span className="rounded-full bg-primary-foreground/20 px-3 py-1">Научное шоу</span>
            </div>
            <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              {event.title}
            </h1>
            <p className="mt-2 max-w-lg text-base text-primary-foreground/85 md:text-lg">
              {event.subtitle}
            </p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-primary-foreground/90">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" /> {event.venue}, {event.address}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-4" /> {event.duration}
              </span>
            </div>
            <dl className="mt-6 grid grid-cols-3 gap-2 sm:max-w-md">
              <PriceChip value={formatPrice(PRICES.full)} label={`от ${CHILD_AGE_LIMIT} лет`} />
              <PriceChip value={formatPrice(PRICES.child)} label={`до ${CHILD_AGE_LIMIT} лет`} />
              <PriceChip value={`1–${MAX_PARTICIPANTS}`} label="в заказе" />
            </dl>
          </div>
          <img
            src={heroImage}
            alt="Зрители в планетарии смотрят научное шоу под звёздным куполом"
            width={1600}
            height={912}
            className="hidden aspect-[16/10] w-full rounded-2xl object-cover shadow-float md:block"
          />
        </div>
      </div>
    </header>
  );
}

function PriceChip({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-primary-foreground/15 px-3 py-2">
      <dt className="sr-only">{label}</dt>
      <dd className="text-base font-bold tabular sm:text-lg">{value}</dd>
      <dd className="text-xs text-primary-foreground/80">{label}</dd>
    </div>
  );
}
