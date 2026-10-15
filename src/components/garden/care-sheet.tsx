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
import { FertilizerIcon, NoteIcon, PotIcon, ScissorsIcon } from "./icons";
import { useGarden } from "./garden-provider";
import type { CareLogType, PlantDto } from "@/lib/garden/types";

const ACTIONS: { type: CareLogType; icon: typeof PotIcon; labelKey: string }[] = [
  { type: "fertilize", icon: FertilizerIcon, labelKey: "garden.action.fertilize" },
  { type: "repot", icon: PotIcon, labelKey: "garden.action.repot" },
  { type: "prune", icon: ScissorsIcon, labelKey: "garden.action.prune" },
  { type: "note", icon: NoteIcon, labelKey: "garden.action.note" },
];

/** Long-press menu: feeding, repotting, pruning and a free-text note. */
export function CareSheet({
  plant,
  open,
  onOpenChange,
}: {
  plant: PlantDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const { care } = useGarden();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (type: CareLogType) => {
    if (!plant || busy) return;
    if (type === "note" && !note.trim()) {
      toast.error(t("garden.action.noteEmpty"));
      return;
    }
    setBusy(true);
    try {
      await care(plant.id, type, type === "note" ? note.trim() : undefined);
      toast.success(t("garden.action.saved"));
      setNote("");
      onOpenChange(false);
    } catch {
      toast.error(t("errors.description"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[22rem] gap-4" data-el="care-sheet">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">
            {plant?.nickname}
          </DialogTitle>
        </DialogHeader>
        <p className="text-[0.75rem] text-muted-foreground">
          {t("garden.action.longPressHint")}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {ACTIONS.map(({ type, icon: Icon, labelKey }) => (
            <button
              key={type}
              type="button"
              disabled={busy}
              onClick={() => run(type)}
              className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border border-border bg-secondary/60 text-[0.8rem] text-foreground transition-colors hover:bg-secondary disabled:opacity-60"
            >
              <Icon className="size-5 text-accent" />
              {t(labelKey)}
            </button>
          ))}
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-[0.72rem] text-muted-foreground">
            {t("garden.action.note")}
          </span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            maxLength={120}
            placeholder={t("garden.action.notePlaceholder")}
            className="resize-none rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:border-accent"
          />
        </label>
      </DialogContent>
    </Dialog>
  );
}
