"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { cn } from "@/utils/utils";
import { DropIcon } from "./icons";
import { MemberAvatar } from "./member-avatar";
import { PlantPlate } from "./plant-plate";
import { useGarden } from "./garden-provider";
import cardStyles from "./plant-card.module.css";
import { daysSinceWatering, leafStateFor, needsWater } from "@/lib/garden/care-plan";
import type { CareLogDto, PlantDto } from "@/lib/garden/types";

const STATUS_COLOR: Record<string, string> = {
  fresh: "text-leaf",
  normal: "text-muted-foreground",
  thirsty: "text-amber",
  wilted: "text-russet",
};

export function PlantCard({
  plant,
  index = 0,
  onLongPress,
  variant = "home",
}: {
  plant: PlantDto;
  index?: number;
  onLongPress?: (plant: PlantDto) => void;
  variant?: "home" | "mini";
}) {
  const { t } = useTranslation();
  const { water, undo, memberById, snapshot } = useGarden();
  const [justWatered, setJustWatered] = useState(false);
  const [pendingLog, setPendingLog] = useState<CareLogDto | null>(null);
  const [busy, setBusy] = useState(false);
  const longPressTimer = useRef<number | null>(null);
  const undoTimer = useRef<number | null>(null);

  const leafState = leafStateFor(plant);
  const days = daysSinceWatering(plant);
  const overdue = needsWater(plant);
  const waterer = memberById(plant.lastWateredBy);
  const mine = snapshot?.me.id === plant.lastWateredBy;

  const statusLabel = justWatered
    ? t("garden.status.wateredJustNow")
    : days === 0
      ? t("garden.status.todayWatered")
      : overdue
        ? t("garden.status.overdue", { days })
        : t("garden.status.daysAgo", { days });

  useEffect(() => {
    return () => {
      if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
      if (undoTimer.current) window.clearTimeout(undoTimer.current);
    };
  }, []);

  const handleWater = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setJustWatered(true);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.(12);
    }
    try {
      const result = await water(plant.id);
      if (result) {
        setPendingLog(result.log);
        if (undoTimer.current) window.clearTimeout(undoTimer.current);
        undoTimer.current = window.setTimeout(() => setPendingLog(null), 5000);
      }
    } catch {
      setJustWatered(false);
      toast.error(t("errors.description"));
    } finally {
      setBusy(false);
    }
  }, [busy, plant.id, t, water]);

  const handleUndo = useCallback(async () => {
    if (!pendingLog) return;
    const logId = pendingLog.id;
    setPendingLog(null);
    setJustWatered(false);
    try {
      await undo(logId);
      toast.success(t("garden.action.undoDone"));
    } catch {
      toast.error(t("errors.description"));
    }
  }, [pendingLog, t, undo]);

  const startPress = () => {
    if (!onLongPress) return;
    longPressTimer.current = window.setTimeout(() => onLongPress(plant), 500);
  };
  const cancelPress = () => {
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  };

  const isMini = variant === "mini";

  return (
    <article
      data-el="plant-card"
      className={cn("group relative flex flex-col", cardStyles.arrive, justWatered && "watered")}
      onPointerDown={startPress}
      onPointerUp={cancelPress}
      onPointerLeave={cancelPress}
      onPointerCancel={cancelPress}
      style={{ ["--arrive-delay" as string]: `${index * 60}ms` }}
    >
      <div className="relative">
        <Link
          href={`/plants/${plant.id}`}
          className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          aria-label={plant.nickname}
          data-el="plant-plate-link"
        >
          <PlantPlate
            illustrationUrl={plant.illustrationUrl}
            alt={`${plant.nickname} · ${plant.species}`}
            leafState={leafState}
            breatheIndex={index}
            justWatered={justWatered}
            size={isMini ? "mini" : "card"}
            className={isMini ? "h-[104px] sm:h-[120px]" : "h-[168px] sm:h-[200px] lg:h-[188px]"}
          />
        </Link>
        <span className="pointer-events-none absolute top-0 left-0" aria-hidden="true">
          <MemberAvatar member={waterer} size={isMini ? 18 : 22} />
        </span>
      </div>

      <h2
        className={cn(
          "font-heading mt-2 leading-snug text-foreground",
          isMini ? "text-[0.9rem]" : "text-[1.02rem] sm:text-[1.1rem]",
        )}
      >
        {plant.nickname}
      </h2>
      <p className="mt-0.5 text-[0.7rem] text-muted-foreground">{plant.species}</p>

      <div className="mt-2 flex min-h-11 items-center justify-between gap-2">
        <span
          className={cn(
            "text-[0.72rem] tabular-nums",
            justWatered ? "text-leaf" : STATUS_COLOR[leafState],
          )}
        >
          {statusLabel}
          {mine && !justWatered ? ` · ${t("garden.family.you")}` : ""}
        </span>
        {pendingLog ? (
          <button
            type="button"
            onClick={handleUndo}
            className="rounded-full border border-border px-3 text-[0.72rem] text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("garden.action.undo")}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleWater}
            disabled={busy}
            aria-label={`${t("garden.action.water")} · ${plant.nickname}`}
            data-el="water-button"
            className={cn(
              "grid size-11 shrink-0 place-items-center rounded-full border border-border bg-secondary text-accent transition-all duration-200",
              "hover:bg-primary/12 active:scale-90 disabled:opacity-60",
            )}
          >
            <DropIcon className="size-[18px]" />
          </button>
        )}
      </div>
    </article>
  );
}
