"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { CareSheet } from "@/components/garden/care-sheet";
import { EditPlantSheet } from "@/components/garden/edit-plant-sheet";
import { MemberAvatar } from "@/components/garden/member-avatar";
import { PlantPlate } from "@/components/garden/plant-plate";
import {
  ChevronLeftIcon,
  DropIcon,
  FertilizerIcon,
  NoteIcon,
  PotIcon,
  ScissorsIcon,
  SunIcon,
  ThermometerIcon,
} from "@/components/garden/icons";
import { useGarden } from "@/components/garden/garden-provider";
import {
  addDays,
  dayDiff,
  dayOfMonth,
  fullDate,
  timeOfDay,
  toDateKey,
} from "@/lib/garden/date";
import { leafStateFor } from "@/lib/garden/care-plan";
import type { LocaleCode } from "@/lib/i18n/locale";
import type { CareLogType } from "@/lib/garden/types";

const TYPE_ICON: Record<CareLogType, typeof DropIcon> = {
  water: DropIcon,
  fertilize: FertilizerIcon,
  repot: PotIcon,
  prune: ScissorsIcon,
  note: NoteIcon,
};

export default function PlantDetailPage() {
  const params = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { snapshot, memberById, water, undo } = useGarden();
  const [careOpen, setCareOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [justWatered, setJustWatered] = useState(false);
  const [lastLogId, setLastLogId] = useState<string | null>(null);
  const locale = (i18n.resolvedLanguage as LocaleCode) ?? "zh-CN";
  const now = useMemo(() => new Date(), []);

  const plant = snapshot?.plants.find((item) => item.id === params.id);
  const logs = useMemo(
    () =>
      (snapshot?.logs ?? [])
        .filter((log) => log.plantId === params.id)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [snapshot?.logs, params.id],
  );

  if (!plant) {
    return (
      <div className="py-24 text-center">
        <p className="font-heading text-lg">{t("errors.title")}</p>
        <Link href="/" className="mt-3 inline-block text-sm text-accent underline">
          {t("errors.backHome")}
        </Link>
      </div>
    );
  }

  const leafState = leafStateFor(plant, now);
  const dueDates = [1, 2, 3].map((step) =>
    addDays(
      plant.lastWateredAt,
      plant.waterIntervalDays * (Math.floor(dayDiff(plant.lastWateredAt, now) / plant.waterIntervalDays) + step + 1),
    ),
  );
  const lightLevel = plant.lightNeed === "full" ? 2 : plant.lightNeed === "indirect" ? 1 : 0;

  const handleWater = async () => {
    setJustWatered(true);
    const result = await water(plant.id);
    if (result) {
      setLastLogId(result.log.id);
      window.setTimeout(() => setLastLogId(null), 5000);
    }
  };

  return (
    <>
      <div className="pt-2">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex min-h-11 items-center gap-1 text-[0.78rem] text-muted-foreground"
          >
            <ChevronLeftIcon className="size-4" />
            {t("garden.nav.balcony")}
          </Link>
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="min-h-11 rounded-full border border-border px-4 text-[0.78rem]"
          >
            {t("garden.detail.edit")}
          </button>
        </div>

        <div
          className="mt-2 rounded-[18px] border border-border/60 px-4 pt-4"
          style={{
            background: "linear-gradient(180deg, rgba(233,238,229,0.9), rgba(244,241,233,0))",
          }}
        >
          <PlantPlate
            illustrationUrl={plant.illustrationUrl}
            alt={plant.nickname}
            leafState={leafState}
            justWatered={justWatered}
            className="h-[240px] sm:h-[300px]"
          />
        </div>

        <header className="mt-5">
          <h1 className="font-heading text-[1.75rem] leading-tight">{plant.nickname}</h1>
          <p className="mt-1 text-[0.82rem] text-muted-foreground">{plant.species}</p>
          {plant.latinName ? (
            <p className="mt-0.5 font-heading text-[0.9rem] italic text-muted-foreground">
              {plant.latinName}
            </p>
          ) : null}
          <p className="mt-3 text-[0.75rem] text-muted-foreground">
            {plant.location} · {fullDate(plant.createdAt, locale)}
          </p>
        </header>

        <section className="mt-6 grid grid-cols-3 gap-2" aria-label={t("garden.detail.careNeeds")}>
          <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card/70 px-2 py-3 text-center">
            <DropIcon className="size-5 text-water" />
            <span className="text-[0.68rem] text-muted-foreground">
              {t("garden.detail.waterInterval")}
            </span>
            <span className="text-[0.82rem]">
              {t("garden.detail.days", { count: plant.waterIntervalDays })}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card/70 px-2 py-3 text-center">
            <SunIcon className="size-5 text-amber" level={lightLevel as 0 | 1 | 2} />
            <span className="text-[0.68rem] text-muted-foreground">
              {t("garden.detail.light")}
            </span>
            <span className="text-[0.82rem]">
              {t(
                plant.lightNeed === "full"
                  ? "garden.detail.lightFull"
                  : plant.lightNeed === "indirect"
                    ? "garden.detail.lightIndirect"
                    : "garden.detail.lightShade",
              )}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card/70 px-2 py-3 text-center">
            <ThermometerIcon className="size-5 text-accent" />
            <span className="text-[0.68rem] text-muted-foreground">
              {t("garden.detail.temperature")}
            </span>
            <span className="text-[0.82rem]">{plant.tempRange}</span>
          </div>
        </section>

        <section className="mt-8" aria-label={t("garden.detail.careStrip")}>
          <h2 className="font-heading text-[1.05rem]">{t("garden.detail.careStrip")}</h2>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
            {logs.slice(0, 4).map((log) => {
              const Icon = TYPE_ICON[log.type];
              return (
                <Link
                  key={log.id}
                  href={`/calendar?date=${toDateKey(log.createdAt)}`}
                  className="flex min-w-[86px] flex-col items-center gap-1 rounded-xl border border-border bg-card/80 px-3 py-3 text-center"
                >
                  <span className="font-heading text-[1.4rem] leading-none">
                    {dayOfMonth(log.createdAt)}
                  </span>
                  <Icon className="size-4 text-accent" />
                  <MemberAvatar member={memberById(log.memberId)} size={18} />
                </Link>
              );
            })}
            <span
              aria-hidden="true"
              className="mx-1 w-px shrink-0 self-stretch bg-primary/60"
              title={t("garden.detail.today")}
            />
            {dueDates.map((due) => (
              <Link
                key={+due}
                href={`/calendar?date=${toDateKey(due)}`}
                className="flex min-w-[86px] flex-col items-center gap-1 rounded-xl border border-dashed border-border/80 bg-card/40 px-3 py-3 text-center opacity-80"
              >
                <span className="font-heading text-[1.4rem] leading-none">
                  {dayOfMonth(due)}
                </span>
                <DropIcon className="size-4 text-water" />
                <span className="text-[0.62rem] text-muted-foreground">
                  {t("garden.calendar.plannedWater")}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 pb-28" aria-label={t("garden.detail.history")}>
          <h2 className="font-heading text-[1.05rem]">{t("garden.detail.history")}</h2>
          {logs.length === 0 ? (
            <p className="mt-3 text-[0.8rem] text-muted-foreground">
              {t("garden.detail.noHistory")}
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-4 border-l border-border pl-5">
              {logs.map((log) => {
                const Icon = TYPE_ICON[log.type];
                const member = memberById(log.memberId);
                return (
                  <li key={log.id} className="relative">
                    <span className="absolute top-1.5 -left-[26px] grid size-3 place-items-center rounded-full bg-background">
                      <Icon className="size-3 text-accent" />
                    </span>
                    <p className="text-[0.82rem]">
                      {member?.displayName ?? t("garden.family.you")} ·{" "}
                      {t(`garden.logType.${log.type}`)}
                    </p>
                    <p className="mt-0.5 text-[0.7rem] text-muted-foreground">
                      {fullDate(log.createdAt, locale)} · {timeOfDay(log.createdAt, locale)}
                    </p>
                    {log.note ? (
                      <p className="mt-1 rounded-lg bg-secondary/50 px-3 py-2 text-[0.75rem] text-foreground/80">
                        {log.note}
                      </p>
                    ) : null}
                    {lastLogId === log.id ? (
                      <button
                        type="button"
                        onClick={() => {
                          void undo(log.id);
                          setLastLogId(null);
                          setJustWatered(false);
                        }}
                        className="mt-2 text-[0.72rem] text-accent underline"
                      >
                        {t("garden.action.undo")}
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-[calc(max(var(--safe-bottom),0.4rem)+4.7rem)] z-20 flex items-center gap-2 px-5 lg:bottom-8 lg:left-[190px] lg:right-8 lg:w-auto">
        <button
          type="button"
          onClick={handleWater}
          data-el="detail-water"
          className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary text-sm text-primary-foreground transition-transform active:scale-[0.98]"
        >
          <DropIcon className="size-5" />
          {t("garden.action.water")}
        </button>
        <button
          type="button"
          onClick={() => setCareOpen(true)}
          className="min-h-12 rounded-full border border-border bg-card px-5 text-sm"
        >
          {t("garden.detail.more")}
        </button>
      </div>

      <CareSheet plant={plant} open={careOpen} onOpenChange={setCareOpen} />
      <EditPlantSheet plant={plant} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}
