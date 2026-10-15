"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { CareSheet } from "@/components/garden/care-sheet";
import { PlantCard } from "@/components/garden/plant-card";
import { useGarden } from "@/components/garden/garden-provider";
import { currentGreetingKey } from "@/lib/garden/date";
import { needsWater, sortPlantsForHome } from "@/lib/garden/care-plan";
import type { LocaleCode } from "@/lib/i18n/locale";
import type { PlantDto } from "@/lib/garden/types";

export default function BalconyPage() {
  const { t, i18n } = useTranslation();
  const { snapshot } = useGarden();
  const [menuPlant, setMenuPlant] = useState<PlantDto | null>(null);
  const locale = (i18n.resolvedLanguage as LocaleCode) ?? "zh-CN";

  const today = useMemo(() => new Date(), []);
  const plants = useMemo(
    () => sortPlantsForHome(snapshot?.plants ?? [], today),
    [snapshot?.plants, today],
  );
  const thirsty = plants.filter((plant) => needsWater(plant, today)).length;

  const greeting = t(`garden.greeting.${currentGreetingKey()}`);
  const dateLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(today);
  const dayNumber = `${today.getDate()}`.padStart(2, "0");
  const monthName = new Intl.DateTimeFormat(locale, { month: "long" }).format(today);
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "long" }).format(today);

  return (
    <>
      <header className="pt-2">
        <div className="flex items-center gap-2 text-accent">
          <span className="font-heading text-[0.8rem] tracking-[0.18em]">
            {t("garden.appName")}
          </span>
        </div>
        <div className="mt-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.8rem] text-muted-foreground">{greeting}</p>
            <h1 className="font-heading mt-1 text-[1.7rem] leading-tight sm:text-[2rem]">
              {t("garden.home.title")}
            </h1>
          </div>
          <div className="flex items-baseline gap-2 text-right">
            <strong className="font-heading text-[2.6rem] leading-none font-normal">
              {dayNumber}
            </strong>
            <span className="text-[0.7rem] leading-tight text-muted-foreground">
              {monthName}
              <br />
              {weekday}
            </span>
          </div>
        </div>
        <p className="sr-only">{dateLabel}</p>

        <Link
          href="/calendar"
          data-el="balcony-summary"
          className="mt-5 flex min-h-11 w-full items-center gap-2 rounded-full border border-border bg-card/70 px-4 text-left text-[0.8rem] transition-colors hover:border-accent"
        >
          <span
            aria-hidden="true"
            className={`size-1.5 rounded-full ${thirsty > 0 ? "bg-water" : "bg-leaf"}`}
          />
          <span>
            {thirsty > 0
              ? t("garden.home.needWater", { count: thirsty })
              : t("garden.home.allGood")}
          </span>
        </Link>
      </header>

      <div className="mt-7 mb-3 flex items-center justify-between border-b border-border pb-2">
        <span className="text-[0.72rem] tracking-[0.1em] text-muted-foreground">
          {t("garden.home.collection")}
        </span>
        <span className="text-[0.72rem] text-muted-foreground">
          {t("garden.home.plantCount", { count: plants.length })}
        </span>
      </div>

      {plants.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-heading text-lg">{t("garden.home.empty")}</p>
          <p className="mt-2 text-[0.8rem] text-muted-foreground">
            {t("garden.home.emptyHint")}
          </p>
        </div>
      ) : (
        <section
          aria-label={t("garden.home.title")}
          className="grid grid-cols-2 gap-x-5 gap-y-7 md:grid-cols-3 lg:grid-cols-4"
        >
          {plants.map((plant, index) => (
            <PlantCard
              key={plant.id}
              plant={plant}
              index={index}
              onLongPress={(target) => setMenuPlant(target)}
            />
          ))}
        </section>
      )}

      <p className="mt-10 text-center font-heading text-[0.8rem] tracking-[0.08em] text-muted-foreground">
        A little care, every day.
      </p>

      <CareSheet
        plant={menuPlant}
        open={Boolean(menuPlant)}
        onOpenChange={(open) => {
          if (!open) setMenuPlant(null);
        }}
      />
    </>
  );
}
