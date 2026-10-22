import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { ContactStep } from "@/components/checkout/ContactStep";
import { EventHeader } from "@/components/checkout/EventHeader";
import { MobileActionBar, OrderSummary, type PrimaryAction } from "@/components/checkout/OrderSummary";
import { ParticipantsStep } from "@/components/checkout/ParticipantsStep";
import { SoldOutResult, SuccessResult } from "@/components/checkout/Results";
import { ReviewStep } from "@/components/checkout/ReviewStep";
import { SessionStep } from "@/components/checkout/SessionStep";
import { STEPS, Stepper, type FormStep } from "@/components/checkout/Stepper";
import {
  confirmOrder,
  fetchCatalog,
  type DemoScenario,
  type Session,
} from "@/lib/api";
import {
  MAX_PARTICIPANTS,
  calcTotals,
  isParticipantsStepValid,
  validateComposition,
  validateEmail,
  type Participant,
} from "@/lib/tickets";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Билеты на мероприятие — Sqoch" },
      {
        name: "description",
        content: "Оформите билеты для 1–4 участников за пару минут.",
      },
      { property: "og:title", content: "Билеты на мероприятие — Sqoch" },
      {
        property: "og:description",
        content: "Полный билет 2 000 ₽, детский 1 000 ₽.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CheckoutPage,
});

type Result = { kind: "success"; orderId: string } | { kind: "sold_out"; seatsLeft: number };

let idCounter = 1;
const newParticipant = (): Participant => ({ id: `p${++idCounter}`, name: "", age: "" });

function CheckoutPage() {
  const catalogQuery = useQuery({
    queryKey: ["catalog"],
    queryFn: fetchCatalog,
    staleTime: 30_000,
  });

  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([{ id: "p1", name: "", age: "" }]);
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<FormStep>("session");
  const [reachedIndex, setReachedIndex] = useState(0);
  const [returnToReview, setReturnToReview] = useState(false);
  const [showErrors, setShowErrors] = useState({ participants: false, contact: false });
  const [scenario, setScenario] = useState<DemoScenario>("success");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);
  const catalogSynced = useRef(false);

  const event = catalogQuery.data?.event;

  useEffect(() => {
    if (!catalogQuery.data || catalogSynced.current) return;
    catalogSynced.current = true;
    const list = catalogQuery.data.sessions;
    setSessions(list);
    const first = list.find((s) => s.seatsLeft > 0) ?? list[0];
    setSessionId(first?.id ?? null);
  }, [catalogQuery.data]);

  const session = sessions.find((s) => s.id === sessionId) ?? null;
  const seatsLeft = session?.seatsLeft ?? 0;
  const totals = useMemo(() => calcTotals(participants), [participants]);
  const compositionError = validateComposition(participants);
  const emailError = validateEmail(email);
  const stepIndex = STEPS.findIndex((s) => s.id === step);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step, result]);

  const goTo = (next: FormStep) => {
    const idx = STEPS.findIndex((s) => s.id === next);
    setReachedIndex((r) => Math.max(r, idx));
    setStep(next);
  };

  const focusFirstError = () =>
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>('[aria-invalid="true"], [role="alert"]');
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (el instanceof HTMLInputElement) el.focus({ preventScroll: true });
    });

  const advance = (natural: FormStep) => {
    if (returnToReview) {
      setReturnToReview(false);
      goTo("review");
    } else goTo(natural);
  };

  const updateSessionSeats = (id: string, seatsLeft: number) => {
    setSessions((list) => list.map((s) => (s.id === id ? { ...s, seatsLeft } : s)));
  };

  const handleNext = async () => {
    if (step === "session") {
      if (!session || session.seatsLeft < Math.max(1, participants.length)) return;
      advance("participants");
    } else if (step === "participants") {
      setShowErrors((s) => ({ ...s, participants: true }));
      if (!isParticipantsStepValid(participants) || participants.length > seatsLeft) return focusFirstError();
      if (returnToReview && emailError) {
        setReturnToReview(false);
        return goTo("contact");
      }
      advance("contact");
    } else if (step === "contact") {
      setShowErrors((s) => ({ ...s, contact: true }));
      if (emailError) return focusFirstError();
      setReturnToReview(false);
      goTo("review");
    } else if (step === "review" && session) {
      setSubmitting(true);
      setSubmitError(null);
      try {
        const res = await confirmOrder({
          sessionId: session.id,
          participants,
          email: email.trim(),
          scenario,
        });
        if (res.ok) {
          updateSessionSeats(session.id, res.seatsLeft);
          setResult({ kind: "success", orderId: res.orderId });
        } else {
          updateSessionSeats(session.id, res.seatsLeft);
          setScenario("success");
          setResult({ kind: "sold_out", seatsLeft: res.seatsLeft });
        }
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : "Не удалось оформить заказ");
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    setReturnToReview(false);
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev.id);
  };

  const jumpTo = (target: FormStep) => {
    const idx = STEPS.findIndex((s) => s.id === target);
    if (idx <= stepIndex) {
      setReturnToReview(false);
      return setStep(target);
    }
    if (idx > 0 && (!session || session.seatsLeft < participants.length)) return;
    if (idx > 1 && (!isParticipantsStepValid(participants) || participants.length > seatsLeft)) {
      setShowErrors((s) => ({ ...s, participants: true }));
      setStep("participants");
      return focusFirstError();
    }
    if (idx > 2 && emailError) {
      setShowErrors((s) => ({ ...s, contact: true }));
      setStep("contact");
      return focusFirstError();
    }
    setReturnToReview(false);
    setStep(target);
  };

  const editFromReview = (target: FormStep) => {
    setReturnToReview(true);
    setStep(target);
  };

  const restart = () => {
    setParticipants([newParticipant()]);
    setEmail("");
    setShowErrors({ participants: false, contact: false });
    setReachedIndex(0);
    setReturnToReview(false);
    setResult(null);
    setSubmitError(null);
    setStep("session");
  };

  const leaveSoldOut = (target: FormStep) => {
    setResult(null);
    setReturnToReview(true);
    if (target === "session") {
      const firstAvailable = sessions.find((s) => s.seatsLeft >= participants.length);
      if (session && session.seatsLeft < participants.length) setSessionId(firstAvailable?.id ?? null);
    }
    setStep(target);
  };

  const action: PrimaryAction = (() => {
    if (returnToReview && step !== "review")
      return { label: "Сохранить и к заказу", mobileLabel: "Сохранить", onClick: handleNext };
    switch (step) {
      case "session":
        return {
          label: "Далее: участники",
          mobileLabel: "Далее",
          onClick: handleNext,
          disabled: !session || session.seatsLeft < participants.length,
        };
      case "participants":
        return { label: "Далее: контакты", mobileLabel: "Далее", onClick: handleNext };
      case "contact":
        return { label: "Проверить заказ", mobileLabel: "Проверить", onClick: handleNext };
      case "review":
        return {
          label: submitting ? "Бронируем места…" : "Подтвердить и оплатить",
          mobileLabel: submitting ? "Бронируем…" : "Оплатить",
          onClick: handleNext,
          loading: submitting,
        };
    }
  })();

  const onBack = stepIndex > 0 ? handleBack : undefined;

  if (catalogQuery.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <p className="text-muted-foreground">Загружаем расписание…</p>
      </div>
    );
  }

  if (catalogQuery.isError || !event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <p className="max-w-md text-muted-foreground">
          {catalogQuery.error instanceof Error
            ? catalogQuery.error.message
            : "Не удалось загрузить каталог"}
        </p>
        <Button type="button" onClick={() => catalogQuery.refetch()}>Повторить</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 lg:pb-16">
      <EventHeader event={event} />

      <main className="mx-auto -mt-12 max-w-6xl px-4 sm:px-6 md:-mt-14">
        <div ref={topRef} className="scroll-mt-4" />

        {result?.kind === "success" && session ? (
          <SuccessResult
            event={event}
            orderId={result.orderId}
            session={session}
            participants={participants}
            email={email}
            total={totals.total}
            onRestart={restart}
          />
        ) : result?.kind === "sold_out" && session ? (
          <SoldOutResult
            session={session}
            seatsLeft={result.seatsLeft}
            participantsCount={participants.length}
            onReduce={() => leaveSoldOut("participants")}
            onChangeSession={() => leaveSoldOut("session")}
          />
        ) : (
          <>
            <Stepper current={step} reachedIndex={reachedIndex} onSelect={jumpTo} />
            <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_340px]">
              <div key={step} className="min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {step === "session" && (
                  <SessionStep
                    sessions={sessions}
                    selectedId={sessionId}
                    participantsCount={participants.length}
                    onSelect={setSessionId}
                  />
                )}
                {step === "participants" && (
                  <ParticipantsStep
                    participants={participants}
                    onChange={setParticipants}
                    onAdd={() =>
                      setParticipants((list) =>
                        list.length < MAX_PARTICIPANTS ? [...list, newParticipant()] : list,
                      )
                    }
                    showErrors={showErrors.participants}
                    compositionError={compositionError}
                    seatsLeft={seatsLeft}
                  />
                )}
                {step === "contact" && (
                  <ContactStep email={email} onChange={setEmail} error={showErrors.contact ? emailError : null} />
                )}
                {step === "review" && session && (
                  <ReviewStep
                    event={event}
                    session={session}
                    participants={participants}
                    email={email}
                    total={totals.total}
                    scenario={scenario}
                    onScenarioChange={setScenario}
                    onEdit={editFromReview}
                    disabled={submitting}
                  />
                )}
                {submitError && step === "review" && (
                  <p className="mt-4 text-sm text-destructive" role="alert">{submitError}</p>
                )}
              </div>

              <OrderSummary
                eventTitle={event.title}
                session={session}
                totals={totals}
                count={participants.length}
                action={action}
                onBack={onBack}
                footnote={step === "review" ? "Оплата в прототипе имитируется" : undefined}
              />
            </div>
            <MobileActionBar totals={totals} count={participants.length} action={action} onBack={onBack} />
          </>
        )}
      </main>
    </div>
  );
}
