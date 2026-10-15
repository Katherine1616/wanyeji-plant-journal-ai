"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import dayCardStyles from "@/components/garden/day-card.module.css";
import { ChevronLeftIcon, DropIcon, FertilizerIcon } from "@/components/garden/icons";
import { DayCard } from "@/components/garden/day-card";
import { useGarden } from "@/components/garden/garden-provider";
import { addDays, toDateKey } from "@/lib/garden/date";
import { buildSchedule } from "@/lib/garden/care-plan";
import type { DayPlan } from "@/lib/garden/care-plan";
import type { LocaleCode } from "@/lib/i18n/locale";

const OFFSETS = [-3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function CalendarPage() {
  const { t, i18n } = useTranslation();
  const { snapshot } = useGarden();
  const locale = (i18n.resolvedLanguage as LocaleCode) ?? "zh-CN";
  const railRef = useRef<HTMLDivElement | null>(null);
  const slots = useRef<Array<HTMLDivElement | null>>([]);
  const didInitialScroll = useRef(false);
  const pendingIndex = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(3);
  const today = useMemo(() => new Date(), []);

  const plans: DayPlan[] = useMemo(() => {
    const schedule = buildSchedule(snapshot?.plants ?? [], snapshot?.logs ?? [], today);
    return OFFSETS.map((offset) => {
      const date = addDays(today, offset);
      const dateKey = toDateKey(date);
      const tasks = schedule.get(dateKey) ?? [];
      return {
        dateKey,
        date,
        offsetFromToday: offset,
        state: offset === 0 ? "today" : offset < 0 ? "past" : "future",
        tasks,
        doneCount: tasks.filter((task) => task.kind === "done").length,
        totalCount: tasks.length,
      } satisfies DayPlan;
    });
  }, [snapshot?.plants, snapshot?.logs, today]);

  const scrollToIndex = useCallback((index: number) => {
    const rail = railRef.current;
    const slot = slots.current[index];
    if (!rail || !slot) return;
    const left = slot.offsetLeft - (rail.clientWidth - slot.clientWidth) / 2;
    rail.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
    setActiveIndex(index);
  }, []);

  // Land on today (or the deep-linked day) the first time the rail renders.
  useEffect(() => {
    if (didInitialScroll.current) return;
    const rail = railRef.current;
    const index = pendingIndex.current ?? 3;
    const slot = slots.current[index];
    if (!rail || !slot) return;
    rail.scrollLeft = Math.max(0, slot.offsetLeft - (rail.clientWidth - slot.clientWidth) / 2);
    didInitialScroll.current = true;
  }, [plans]);

  // Deep link: /calendar?date=YYYY-MM-DD
  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get("date");
    if (!key) return;
    const index = plans.findIndex((plan) => plan.dateKey === key);
    if (index < 0) return;
    pendingIndex.current = index;
    const timer = window.setTimeout(() => scrollToIndex(index), 60);
    return () => window.clearTimeout(timer);
  }, [plans, scrollToIndex]);

  const onScroll = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const center = rail.scrollLeft + rail.clientWidth / 2;
    let best = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    slots.current.forEach((slot, index) => {
      if (!slot) return;
      const slotCenter = slot.offsetLeft + slot.clientWidth / 2;
      const distance = Math.abs(slotCenter - center);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    });
    setActiveIndex(best);
  }, []);

  const activePlan = plans[activeIndex];
  const isToday = activePlan?.offsetFromToday === 0;

  return (
    <div className="pt-2">
      <header className="flex items-end justify-between">
        <h1 className="font-heading text-[1.5rem] leading-none">
          {activePlan
            ? t("garden.calendar.monthTitle", {
                year: activePlan.date.getFullYear(),
                month: activePlan.date.getMonth() + 1,
              })
            : t("garden.nav.calendar")}
        </h1>
        {!isToday ? (
          <button
            type="button"
            onClick={() => scrollToIndex(3)}
            className="min-h-9 rounded-full border border-border px-3 text-[0.75rem] text-accent"
          >
            {t("garden.calendar.backToToday")}
          </button>
        ) : (
          <span className="text-[0.72rem] text-muted-foreground" data-el="calendar-today-hint">
            {t("garden.calendar.swipeHint")}
          </span>
        )}
      </header>

      <div className="mt-4 -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:px-0">
        {plans.map((plan, index) => {
          const isActive = index === activeIndex;
          const isDayToday = plan.offsetFromToday === 0;
          const dots = Math.min(3, plan.totalCount);
          const allDone = plan.totalCount > 0 && plan.doneCount === plan.totalCount;
          return (
            <button
              key={plan.dateKey}
              type="button"
              onClick={() => scrollToIndex(index)}
              className={[
                "flex min-w-[42px] shrink-0 flex-col items-center gap-1 rounded-full px-1.5 py-1.5 transition-colors",
                isActive
                  ? "bg-primary/12 text-primary"
                  : isDayToday
                    ? "text-foreground"
                    : "text-muted-foreground",
              ].join(" ")}
              aria-label={plan.dateKey}
            >
              <span className="text-[0.6rem] leading-none">
                {t(`garden.calendar.weekShort.${plan.date.getDay()}`)}
              </span>
              <span
                className={[
                  "grid size-7 place-items-center rounded-full font-heading text-[0.9rem] leading-none",
                  isDayToday
                    ? "border border-primary text-primary"
                    : isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/60",
                ].join(" ")}
              >
                {plan.date.getDate()}
              </span>
              <span className="flex h-1.5 items-center gap-0.5">
                {plan.totalCount === 0 ? (
                  <span className="size-1 rounded-full bg-transparent" />
                ) : allDone ? (
                  <span className="size-1 rounded-full bg-primary" />
                ) : (
                  Array.from({ length: dots }).map((_, dotIndex) => (
                    <span
                      key={dotIndex}
                      className={`size-1 rounded-full ${
                        dotIndex < plan.doneCount ? "bg-primary/50" : "bg-water"
                      }`}
                    />
                  ))
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div
        ref={railRef}
        onScroll={onScroll}
        className={`${dayCardStyles.rail} -mx-5 px-5 lg:mx-0 lg:px-0`}
        data-el="calendar-rail"
      >
        {plans.map((plan, index) => (
          <div
            key={plan.dateKey}
            ref={(node) => {
              slots.current[index] = node;
            }}
            className={dayCardStyles.slot}
            data-active={index === activeIndex}
            data-side={plan.state}
          >
            <DayCard
              plan={plan}
              locale={locale}
              side={plan.state}
              onActive={(dateKey) => {
                const target = plans.findIndex((item) => item.dateKey === dateKey);
                if (target >= 0 && target !== activeIndex) setActiveIndex(target);
              }}
            />
          </div>
        ))}
      </div>

      <section className="mt-2 mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-border bg-card/70 px-3 py-2.5">
          <p className="flex items-center gap-1 text-[0.65rem] text-muted-foreground">
            <DropIcon className="size-3" />
            {t("garden.calendar.statWeekWater")}
          </p>
          <p className="mt-1 font-heading text-[1.2rem] leading-none">
            {
              plans
                .filter((plan) => plan.state !== "future")
                .reduce((sum, plan) => sum + plan.doneCount, 0)
            }
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card/70 px-3 py-2.5">
          <p className="flex items-center gap-1 text-[0.65rem] text-muted-foreground">
            <DropIcon className="size-3" />
            {t("garden.calendar.statPending")}
          </p>
          <p className="mt-1 font-heading text-[1.2rem] leading-none">
            {plans[3] ? plans[3].totalCount - plans[3].doneCount : 0}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card/70 px-3 py-2.5">
          <p className="flex items-center gap-1 text-[0.65rem] text-muted-foreground">
            <FertilizerIcon className="size-3" />
            {t("garden.calendar.statFertilize")}
          </p>
          <p className="mt-1 font-heading text-[1.2rem] leading-none">
            {plans
              .filter((plan) => plan.offsetFromToday >= 0 && plan.offsetFromToday <= 7)
              .reduce(
                (sum, plan) =>
                  sum + plan.tasks.filter((task) => task.type === "fertilize").length,
                0,
              )}
          </p>
        </div>
      </section>

      <p className="flex items-center gap-1 pb-2 text-[0.68rem] text-muted-foreground">
        <ChevronLeftIcon className="size-3" />
        {t("garden.calendar.longPressHint")}
      </p>
    </div>
  );
}
