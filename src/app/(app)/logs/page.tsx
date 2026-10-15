"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { MemberAvatar } from "@/components/garden/member-avatar";
import {
  DropIcon,
  FertilizerIcon,
  ImagePlaceholderIcon,
  NoteIcon,
  PotIcon,
  ScissorsIcon,
} from "@/components/garden/icons";
import { useGarden } from "@/components/garden/garden-provider";
import { fullDate, timeOfDay, toDateKey, weekdayName } from "@/lib/garden/date";
import type { LocaleCode } from "@/lib/i18n/locale";
import type { CareLogType } from "@/lib/garden/types";

const TYPE_ICON: Record<CareLogType, typeof DropIcon> = {
  water: DropIcon,
  fertilize: FertilizerIcon,
  repot: PotIcon,
  prune: ScissorsIcon,
  note: NoteIcon,
};

const FILTERS: Array<{ key: "all" | CareLogType; labelKey: string }> = [
  { key: "all", labelKey: "garden.logs.filterAll" },
  { key: "water", labelKey: "garden.logType.water" },
  { key: "fertilize", labelKey: "garden.logType.fertilize" },
  { key: "repot", labelKey: "garden.logType.repot" },
  { key: "prune", labelKey: "garden.logType.prune" },
  { key: "note", labelKey: "garden.logType.note" },
];

export default function LogsPage() {
  const { t, i18n } = useTranslation();
  const { snapshot, memberById } = useGarden();
  const locale = (i18n.resolvedLanguage as LocaleCode) ?? "zh-CN";
  const [filter, setFilter] = useState<"all" | CareLogType>("all");
  const [monthOffset, setMonthOffset] = useState(0);

  const allLogs = useMemo(
    () =>
      [...(snapshot?.logs ?? [])].sort(
        (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
      ),
    [snapshot?.logs],
  );

  const plants = useMemo(
    () => new Map((snapshot?.plants ?? []).map((plant) => [plant.id, plant])),
    [snapshot?.plants],
  );

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 1);
  const monthLogs = allLogs.filter((log) => {
    const at = new Date(log.createdAt);
    return at >= monthStart && at < monthEnd;
  });

  const visible = (monthOffset === 0 ? allLogs : monthLogs).filter(
    (log) => filter === "all" || log.type === filter,
  );

  const groups = useMemo(() => {
    const map = new Map<string, typeof visible>();
    for (const log of visible) {
      const key = toDateKey(log.createdAt);
      const list = map.get(key);
      if (list) list.push(log);
      else map.set(key, [log]);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [visible]);

  const stats = useMemo(() => {
    const counts = { water: 0, fertilize: 0, repot: 0, prune: 0, note: 0 } as Record<
      CareLogType,
      number
    >;
    for (const log of monthLogs) counts[log.type] += 1;
    return counts;
  }, [monthLogs]);

  const busiest = useMemo(() => {
    const tally = new Map<string, number>();
    for (const log of monthLogs) {
      tally.set(log.memberId, (tally.get(log.memberId) ?? 0) + 1);
    }
    const top = [...tally.entries()].sort((a, b) => b[1] - a[1])[0];
    return top ? { member: memberById(top[0]), count: top[1] } : null;
  }, [monthLogs, memberById]);

  return (
    <div className="pt-2">
      <header className="flex items-end justify-between">
        <h1 className="font-heading text-[1.5rem] leading-none">{t("garden.logs.title")}</h1>
        <div className="flex items-center gap-1 rounded-full border border-border p-0.5">
          <button
            type="button"
            onClick={() => setMonthOffset((value) => value - 1)}
            className="grid size-7 place-items-center rounded-full text-muted-foreground"
            aria-label={t("garden.logs.prevMonth")}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setMonthOffset(0)}
            className="px-1 text-[0.72rem] text-foreground"
          >
            {monthStart.getFullYear()}.{monthStart.getMonth() + 1}
          </button>
          <button
            type="button"
            onClick={() => setMonthOffset((value) => Math.min(0, value + 1))}
            disabled={monthOffset === 0}
            className="grid size-7 place-items-center rounded-full text-muted-foreground disabled:opacity-30"
            aria-label={t("garden.logs.nextMonth")}
          >
            ›
          </button>
        </div>
      </header>

      <section
        className="mt-4 rounded-xl border border-border bg-card/70 px-4 py-3"
        data-el="logs-month-stats"
      >
        <div className="flex items-baseline justify-between">
          <p className="text-[0.72rem] text-muted-foreground">
            {t("garden.logs.monthTotal")}
          </p>
          <p className="font-heading text-[1.6rem] leading-none">{monthLogs.length}</p>
        </div>
        <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {(["water", "fertilize", "repot", "prune", "note"] as CareLogType[]).map((type) => {
            const Icon = TYPE_ICON[type];
            return (
              <li key={type} className="flex flex-col items-center gap-1 text-center">
                <Icon className="size-4 text-accent" />
                <span className="text-[0.62rem] text-muted-foreground">
                  {t(`garden.logType.${type}`)}
                </span>
                <span className="text-[0.8rem]">{stats[type]}</span>
              </li>
            );
          })}
        </ul>
        {busiest?.member ? (
          <p className="mt-3 flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
            <MemberAvatar member={busiest.member} size={18} />
            {t("garden.logs.busiest", {
              name: busiest.member.displayName,
              count: busiest.count,
            })}
          </p>
        ) : null}
      </section>

      <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:px-0">
        {FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key)}
            className={[
              "min-h-8 shrink-0 rounded-full border px-3 text-[0.72rem] transition-colors",
              filter === item.key
                ? "border-primary bg-primary/12 text-primary"
                : "border-border text-muted-foreground",
            ].join(" ")}
          >
            {t(item.labelKey)}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <p className="py-16 text-center text-[0.82rem] text-muted-foreground">
          {t("garden.logs.empty")}
        </p>
      ) : (
        <div className="mt-5 flex flex-col gap-7 pb-6">
          {groups.map(([dateKey, entries]) => (
            <section key={dateKey}>
              <header className="flex items-baseline gap-2 border-b border-border pb-2">
                <h2 className="font-heading text-[1.1rem]">{fullDate(dateKey, locale)}</h2>
                <span className="text-[0.65rem] text-muted-foreground">
                  {weekdayName(dateKey, locale)}
                </span>
                <span className="ml-auto font-heading text-[1.05rem] text-muted-foreground">
                  {entries.length}
                </span>
              </header>
              <ul className="mt-3 flex flex-col gap-3">
                {entries.map((log) => {
                  const Icon = TYPE_ICON[log.type];
                  const plant = plants.get(log.plantId);
                  return (
                    <li key={log.id} className="flex items-center gap-3">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full border border-border">
                        <Icon className="size-3.5 text-accent" />
                      </span>
                      <Link
                        href={`/plants/${log.plantId}`}
                        className="size-11 shrink-0 overflow-hidden rounded-lg bg-secondary/40"
                      >
                        {plant?.illustrationUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={plant.illustrationUrl}
                            alt={plant.nickname}
                            className="size-full object-contain"
                          />
                        ) : (
                          <ImagePlaceholderIcon className="size-full p-3 text-border" />
                        )}
                      </Link>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.85rem]">
                          {plant?.nickname ?? "—"}
                          <span className="ml-2 text-[0.7rem] text-muted-foreground">
                            {t(`garden.logType.${log.type}`)}
                          </span>
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-[0.68rem] text-muted-foreground">
                          <MemberAvatar member={memberById(log.memberId)} size={16} />
                          {memberById(log.memberId)?.displayName ?? t("garden.family.you")}
                          <span>·</span>
                          {timeOfDay(log.createdAt, locale)}
                        </p>
                        {log.note ? (
                          <p className="mt-1.5 rounded-lg bg-secondary/50 px-2.5 py-1.5 text-[0.72rem] text-foreground/80">
                            {log.note}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
