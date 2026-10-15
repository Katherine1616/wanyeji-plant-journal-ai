"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGarden } from "./garden-provider";
import type { LightNeed, PlantDto } from "@/lib/garden/types";

const LOCATION_KEYS = [
  "livingRoom",
  "balconyLeft",
  "balconyRight",
  "bedroom",
  "study",
  "kitchen",
];

export function EditPlantSheet({
  plant,
  open,
  onOpenChange,
}: {
  plant: PlantDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[86dvh] max-w-[24rem] overflow-y-auto"
        data-el="edit-plant-sheet"
      >
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">{t("garden.edit.title")}</DialogTitle>
        </DialogHeader>
        {open && plant ? (
          <EditForm
            key={plant.id}
            plant={plant}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/** Mounted fresh for each plant, so the fields start from the record itself. */
function EditForm({ plant, onDone }: { plant: PlantDto; onDone: () => void }) {
  const { t } = useTranslation();
  const { savePlant } = useGarden();
  const [nickname, setNickname] = useState(plant.nickname);
  const [species, setSpecies] = useState(plant.species);
  const [location, setLocation] = useState(plant.location);
  const [waterInterval, setWaterInterval] = useState(plant.waterIntervalDays);
  const [fertilizeInterval, setFertilizeInterval] = useState(plant.fertilizeIntervalDays);
  const [lightNeed, setLightNeed] = useState<LightNeed>(plant.lightNeed);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await savePlant(plant.id, {
        nickname: nickname.trim() || plant.nickname,
        species,
        location,
        waterIntervalDays: waterInterval,
        fertilizeIntervalDays: fertilizeInterval,
        lightNeed,
      });
      toast.success(t("garden.edit.saved"));
      onDone();
    } catch {
      toast.error(t("errors.description"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-[0.72rem] text-muted-foreground">{t("garden.edit.nickname")}</span>
        <input
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          maxLength={24}
          className="min-h-11 rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:border-accent"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[0.72rem] text-muted-foreground">{t("garden.edit.species")}</span>
        <input
          value={species}
          onChange={(event) => setSpecies(event.target.value)}
          maxLength={30}
          className="min-h-11 rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:border-accent"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[0.72rem] text-muted-foreground">{t("garden.edit.location")}</span>
        <select
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          className="min-h-11 rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:border-accent"
        >
          {LOCATION_KEYS.map((key) => (
            <option key={key} value={t(`garden.locations.${key}`)}>
              {t(`garden.locations.${key}`)}
            </option>
          ))}
          {LOCATION_KEYS.every((key) => t(`garden.locations.${key}`) !== location) ? (
            <option value={location}>{location}</option>
          ) : null}
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[0.72rem] text-muted-foreground">
          {t("garden.edit.waterInterval")} · {waterInterval}
        </span>
        <input
          type="range"
          min={1}
          max={30}
          value={waterInterval}
          onChange={(event) => setWaterInterval(Number(event.target.value))}
          className="h-11 accent-[var(--primary)]"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[0.72rem] text-muted-foreground">
          {t("garden.edit.fertilizeInterval")} · {fertilizeInterval}
        </span>
        <input
          type="range"
          min={7}
          max={60}
          value={fertilizeInterval}
          onChange={(event) => setFertilizeInterval(Number(event.target.value))}
          className="h-11 accent-[var(--primary)]"
        />
      </label>
      <div className="flex flex-col gap-1.5">
        <span className="text-[0.72rem] text-muted-foreground">{t("garden.edit.light")}</span>
        <div className="grid grid-cols-3 gap-2">
          {(["shade", "indirect", "full"] as LightNeed[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setLightNeed(option)}
              className={[
                "min-h-11 rounded-xl border text-[0.75rem]",
                lightNeed === option
                  ? "border-primary bg-primary/12 text-foreground"
                  : "border-border text-muted-foreground",
              ].join(" ")}
            >
              {t(
                option === "shade"
                  ? "garden.detail.lightShade"
                  : option === "indirect"
                    ? "garden.detail.lightIndirect"
                    : "garden.detail.lightFull",
              )}
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className="mt-1 min-h-12 rounded-full bg-primary text-sm text-primary-foreground disabled:opacity-60"
      >
        {busy ? t("common.loading") : t("common.save")}
      </button>
    </div>
  );
}
