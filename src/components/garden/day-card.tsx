"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import styles from "./day-card.module.css";
import { MemberAvatar } from "./member-avatar";
import {
  DropIcon,
  FertilizerIcon,
  ImagePlaceholderIcon,
  NoteIcon,
  WateringCanIcon,
} from "./icons";
import { useGarden } from "./garden-provider";
import { fullDate, weekdayName, timeOfDay } from "@/lib/garden/date";
import type { DayPlan, DayTaskType } from "@/lib/garden/care-plan";
import type { LocaleCode } from "@/lib/i18n/locale";

const TYPE_ICON: Record<DayTaskType, typeof DropIcon> = {
  water: DropIcon,
  fertilize: FertilizerIcon,
};

const GROUPS: Array<{ titleKey: string; type: DayTaskType }> = [
  { titleKey: "garden.calendar.groupWater", type: "water" },
  { titleKey: "garden.calendar.groupFertilize", type: "fertilize" },
];

export function DayCard({
  plan,
  locale,
  side,
  onActive,
}: {
  plan: DayPlan;
  locale: LocaleCode;
  side: "past" | "today" | "future";
  onActive: (dateKey: string) => void;
}) {
  const { t } = useTranslation();
  const { snapshot, water, care, memberById } = useGarden();
  const pressTimer = useRef<number | null>(null);
  const isToday = side === "today";

  const items = useMemo(() => {
    const plants = new Map((snapshot?.plants ?? []).map((plant) => [plant.id, plant]));
    const logs = new Map((snapshot?.logs ?? []).map((log) => [log.id, log]));
    return plan.tasks
      .map((task) => ({
        task,
        plant: plants.get(task.plantId),
        log: logs.get(task.id),
      }))
      .filter((item) => Boolean(item.plant));
  }, [plan.tasks, snapshot?.plants, snapshot?.logs]);

  const done = items.filter((item) => item.task.kind === "done").length;
  const total = items.length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  const allDone = total > 0 && done === total;

  const cardClass = [
    styles.card,
    isToday ? styles.today : "",
    side === "past" ? styles.pastCard : "",
    side === "future" ? styles.futureCard : "",
  ]
    .filter(Boolean)
    .join(" ");

  const act = async (plantId: string, type: DayTaskType) => {
    if (type !== "water") return;
    if (side === "today") {
      await water(plantId);
      return;
    }
    if (side === "future") {
      await care(plantId, "water", t("garden.calendar.movedEarly"));
      toast.success(t("garden.calendar.movedEarlyToast"));
    }
  };

  const startPress = (plantId: string, type: DayTaskType) => {
    pressTimer.current = window.setTimeout(() => {
      void act(plantId, type);
    }, 600);
    onActive(plan.dateKey);
  };
  const endPress = () => {
    if (pressTimer.current) window.clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };

  return (
    <section
      className="slot-shape flex h-full flex-col"
      data-side={side}
      aria-label={fullDate(plan.date, locale)}
      data-el={`day-card-${plan.dateKey}`}
      onPointerDown={() => onActive(plan.dateKey)}
    >
      <div className={cardClass}>
        <header className="flex items-start justify-between">
          <div>
            <p className="font-heading text-[2rem] leading-none">{plan.date.getDate()}</p>
            <p className="mt-1 text-[0.72rem] text-muted-foreground">
              {weekdayName(plan.date, locale)}
            </p>
          </div>
          {isToday ? (
            <span className="rounded-full bg-primary/12 px-2.5 py-1 text-[0.65rem] text-primary">
              {t("garden.calendar.today")}
            </span>
          ) : (
            <span className="text-[0.65rem] text-muted-foreground">
              {plan.date.getMonth() + 1} / {plan.date.getDate()}
            </span>
          )}
        </header>

        <div className="mt-4">
          <div className="h-[3px] w-full rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-1.5 text-[0.68rem] text-muted-foreground">
            {total === 0
              ? isToday
                ? t("garden.calendar.rest")
                : t("garden.calendar.restOthers")
              : t("garden.calendar.progress", { done, total })}
          </p>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto pr-0.5">
          {total === 0 ? (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 text-center">
              <WateringCanIcon className="size-16 text-border" />
              <p className="text-[0.8rem] text-muted-foreground">
                {t("garden.calendar.restDay")}
              </p>
            </div>
          ) : (
            GROUPS.map((group) => {
              const groupItems = items.filter((item) => item.task.type === group.type);
              if (groupItems.length === 0) return null;
              return (
                <div key={group.type} className="mb-4">
                  <h3 className="mb-2 text-[0.7rem] tracking-[0.12em] text-muted-foreground">
                    {t(group.titleKey)}
                  </h3>
                  <ul className="flex flex-col gap-3" style={{ perspective: "1000px" }}>
                    {groupItems.map(({ task, plant, log }) => {
                      const Icon = TYPE_ICON[task.type] ?? NoteIcon;
                      const flipped = task.kind === "done" && task.type === "water";
                      const member = memberById(
                        log?.memberId ?? task.memberId ?? plant!.lastWateredBy ?? plant!.createdBy,
                      );
                      const canAct =
                        task.type === "water" && task.kind !== "done" && side !== "past";
                      return (
                        <li
                          key={task.id}
                          className={[
                            styles.flip,
                            flipped ? styles.flipped : "",
                            task.kind === "missed" ? styles.missed : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          <div className={styles.face} aria-hidden={flipped}>
                            <div
                              className={[
                                "flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5",
                                canAct ? "pr-14" : "",
                                task.kind === "planned" ? styles.plannedCard : "",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                            >
                              <Link
                                href={`/plants/${plant!.id}`}
                                className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-secondary/40"
                              >
                                {plant!.illustrationUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={plant!.illustrationUrl}
                                    alt={plant!.nickname}
                                    className={`${styles.miniImage} size-full object-contain`}
                                  />
                                ) : (
                                  <ImagePlaceholderIcon className="size-full p-3 text-border" />
                                )}
                              </Link>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[0.85rem]">{plant!.nickname}</p>
                                <p className="mt-0.5 flex flex-wrap items-center gap-1 text-[0.68rem] text-muted-foreground">
                                  <Icon className="size-3" />
                                  {task.type === "water"
                                    ? task.kind === "missed"
                                      ? t("garden.calendar.missed")
                                      : task.kind === "planned"
                                        ? t("garden.calendar.plannedWater")
                                        : t("garden.status.needWater")
                                    : t("garden.calendar.plannedFertilize")}
                                  {task.delayedDays ? (
                                    <span className="text-russet">
                                      {t("garden.calendar.delayed", { count: task.delayedDays })}
                                    </span>
                                  ) : null}
                                </p>
                              </div>
                              {task.kind === "planned" && side === "future" ? (
                                <span className="shrink-0 text-center text-[0.6rem] leading-tight text-muted-foreground">
                                  {t("garden.calendar.pressToMove")}
                                </span>
                              ) : task.kind === "missed" ? (
                                <span className={styles.missedBadge}>
                                  {t("garden.calendar.missed")}
                                </span>
                              ) : null}
                            </div>
                            {canAct ? (
                              <button
                                type="button"
                                aria-label={t("garden.action.water")}
                                onPointerDown={() => startPress(plant!.id, task.type)}
                                onPointerUp={endPress}
                                onPointerLeave={endPress}
                                onClick={() => {
                                  if (side !== "future") void act(plant!.id, task.type);
                                }}
                                className="absolute right-2 bottom-2 grid size-11 place-items-center rounded-full border border-primary bg-card text-primary"
                              >
                                <DropIcon className="size-5" />
                              </button>
                            ) : null}
                          </div>
                          <div className={styles.back} aria-hidden={!flipped}>
                            <span className={styles.stamp}>{t("garden.calendar.done")}</span>
                            <MemberAvatar member={member} size={22} />
                            <p className="text-[0.65rem] text-muted-foreground">
                              {log
                                ? `${timeOfDay(log.createdAt, locale)} · ${
                                    member?.displayName ?? t("garden.family.you")
                                  }`
                                : t("garden.calendar.done")}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })
          )}
        </div>

        {isToday && allDone ? (
          <span className={styles.dayStamp}>{t("garden.calendar.allDone")}</span>
        ) : null}
      </div>
    </section>
  );
}
