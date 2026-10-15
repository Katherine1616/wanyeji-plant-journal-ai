"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  CameraIcon,
  CheckIcon,
  ImageIcon,
  ImagePlaceholderIcon,
  LeafIcon,
  SparkIcon,
} from "@/components/garden/icons";
import { useGarden } from "@/components/garden/garden-provider";
import { runPlantAi, uploadPlantPhoto } from "@/lib/api/garden";
import type { LightNeed } from "@/lib/garden/types";

const LOCATION_KEYS = [
  "livingRoom",
  "balconyLeft",
  "balconyRight",
  "bedroom",
  "study",
  "kitchen",
];

function GrowthLoader({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10">
      <div className="flex items-end gap-1.5">
        {[0, 1, 2].map((index) => (
          <LeafIcon
            key={index}
            className="leaf-grow size-7 text-primary"
            style={{ animationDelay: `${index * 0.18}s` }}
          />
        ))}
      </div>
      <p className="text-[0.78rem] text-muted-foreground">{label}</p>
    </div>
  );
}

export default function NewPlantPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { addPlant } = useGarden();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [cutoutUrl, setCutoutUrl] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [chosen, setChosen] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "upload" | "cutout" | "illustrate" | "identify" | "save">(
    null,
  );
  const [nickname, setNickname] = useState("");
  const [species, setSpecies] = useState("");
  const [latinName, setLatinName] = useState("");
  const [location, setLocation] = useState<string>(LOCATION_KEYS[1]);
  const [waterInterval, setWaterInterval] = useState(7);
  const [fertilizeInterval, setFertilizeInterval] = useState(30);
  const [lightNeed, setLightNeed] = useState<LightNeed>("indirect");
  const [tempRange, setTempRange] = useState("15–26℃");
  const [identified, setIdentified] = useState(false);

  // Shown on the form and used as the fallback picture; the AI reference stays
  // the untouched photo, since a transparent PNG is a poor prompt for vision.
  const activePhoto = cutoutUrl ?? photoUrl;
  const referencePhoto = photoUrl ?? cutoutUrl;

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    setBusy("upload");
    try {
      const uploaded = await uploadPlantPhoto(file);
      setPhotoUrl(uploaded.url);
      setBusy("cutout");
      const result = (await runPlantAi(uploaded.url, "cutout")) as { cutoutUrl: string | null };
      setCutoutUrl(result.cutoutUrl ?? null);
      if (!result.cutoutUrl) toast.message(t("garden.add.cutoutSkipped"));
      setNickname((current) => current || t("garden.add.defaultName"));
    } catch {
      toast.error(t("errors.description"));
    } finally {
      setBusy(null);
    }
  };

  const generateIllustrations = async () => {
    const fallback = activePhoto ?? referencePhoto;
    if (!referencePhoto) return;
    setBusy("illustrate");
    try {
      const result = (await runPlantAi(referencePhoto, "illustrate", 3)) as { images: string[] };
      const next = result.images ?? [];
      if (next.length === 0) throw new Error("no_illustration");
      setImages(next);
      setChosen(next[0]);
    } catch {
      // Illustration service unavailable — the cutout (or the photo) still works
      // as the plant's picture, so the flow never dead-ends here.
      setImages(fallback ? [fallback] : []);
      setChosen(fallback);
      toast.message(t("garden.add.illustrationFallback"));
    } finally {
      setBusy(null);
    }
  };

  const identify = async () => {
    if (identified) return;
    setBusy("identify");
    try {
      const data = (await runPlantAi(referencePhoto ?? "", "identify")) as {
        species: string;
        latinName: string;
        nickname: string;
        waterIntervalDays: number;
        fertilizeIntervalDays: number;
        lightNeed: LightNeed;
        tempRange: string;
      };
      setSpecies(data.species ?? "");
      setLatinName(data.latinName ?? "");
      setNickname((current) => current || data.nickname || t("garden.add.defaultName"));
      setWaterInterval(data.waterIntervalDays || 7);
      setFertilizeInterval(data.fertilizeIntervalDays || 30);
      setLightNeed(data.lightNeed ?? "indirect");
      setTempRange(data.tempRange || "15–26℃");
      setIdentified(true);
    } catch {
      toast.error(t("errors.description"));
    } finally {
      setBusy(null);
    }
  };

  const goStep2 = async () => {
    setStep(2);
    if (images.length === 0) await generateIllustrations();
  };

  const goStep3 = async () => {
    setStep(3);
    await identify();
  };

  const submit = async () => {
    if (!chosen) {
      toast.error(t("garden.add.pickIllustration"));
      return;
    }
    setBusy("save");
    try {
      await addPlant({
        nickname: nickname.trim() || t("garden.add.defaultName"),
        species: species.trim(),
        latinName: latinName.trim() || undefined,
        location: t(`garden.locations.${location}`),
        photoUrl,
        illustrationUrl: chosen,
        waterIntervalDays: waterInterval,
        fertilizeIntervalDays: fertilizeInterval,
        lightNeed,
        tempRange,
      });
      toast.success(t("garden.add.added"));
      router.push("/");
    } catch {
      toast.error(t("errors.description"));
    } finally {
      setBusy(null);
    }
  };

  const steps = [t("garden.add.step1"), t("garden.add.step2"), t("garden.add.step3")];

  return (
    <div className="pt-2 pb-10">
      <h1 className="font-heading text-[1.5rem] leading-none">{t("garden.add.title")}</h1>

      <ol className="mt-4 flex items-center gap-2" data-el="add-steps">
        {steps.map((label, index) => {
          const value = (index + 1) as 1 | 2 | 3;
          const state = value === step ? "current" : value < step ? "done" : "todo";
          return (
            <li key={label} className="flex flex-1 items-center gap-2">
              <span
                className={[
                  "grid size-6 shrink-0 place-items-center rounded-full border text-[0.62rem]",
                  state === "current"
                    ? "border-primary bg-primary text-primary-foreground"
                    : state === "done"
                      ? "border-primary text-primary"
                      : "border-border text-muted-foreground",
                ].join(" ")}
              >
                {state === "done" ? <CheckIcon className="size-3" /> : value}
              </span>
              <span
                className={`truncate text-[0.68rem] ${
                  state === "todo" ? "text-muted-foreground" : "text-foreground"
                }`}
              >
                {label}
              </span>
              {index < steps.length - 1 ? (
                <span className="ml-1 hidden h-px flex-1 bg-border sm:block" />
              ) : null}
            </li>
          );
        })}
      </ol>

      {step === 1 ? (
        <section className="mt-6">
          <div className="rounded-2xl border border-dashed border-border bg-card/60 px-4 py-8">
            {activePhoto ? (
              <div className="flex flex-col items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activePhoto}
                  alt={t("garden.add.photo")}
                  className="max-h-[260px] rounded-xl object-contain"
                  style={
                    cutoutUrl
                      ? {
                          backgroundImage:
                            "linear-gradient(45deg, rgba(0,0,0,.05) 25%, transparent 25%, transparent 75%, rgba(0,0,0,.05) 75%), linear-gradient(45deg, rgba(0,0,0,.05) 25%, transparent 25%, transparent 75%, rgba(0,0,0,.05) 75%)",
                          backgroundSize: "16px 16px",
                          backgroundPosition: "0 0, 8px 8px",
                        }
                      : undefined
                  }
                />
                {cutoutUrl ? (
                  <p className="flex items-center gap-1.5 text-[0.72rem] text-primary">
                    <CheckIcon className="size-3.5" />
                    {t("garden.add.cutoutDone")}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="text-[0.72rem] text-accent underline"
                >
                  {t("garden.add.changePhoto")}
                </button>
              </div>
            ) : busy ? (
              <GrowthLoader
                label={busy === "upload" ? t("garden.add.uploading") : t("garden.add.cutoutRunning")}
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-center">
                <SparkIcon className="size-8 text-accent" />
                <p className="text-[0.8rem] text-muted-foreground">{t("garden.add.photoHint")}</p>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm text-primary-foreground"
                >
                  <CameraIcon className="size-4" />
                  {t("garden.add.takePhoto")}
                </button>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex min-h-9 items-center gap-1.5 text-[0.75rem] text-accent"
                >
                  <ImageIcon className="size-3.5" />
                  {t("garden.add.fromLibrary")}
                </button>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => void onPick(event.target.files?.[0])}
          />
          <button
            type="button"
            disabled={!activePhoto || busy !== null}
            onClick={() => void goStep2()}
            className="mt-4 min-h-12 w-full rounded-full bg-primary text-sm text-primary-foreground disabled:opacity-40"
          >
            {t("common.next")}
          </button>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="mt-6">
          {busy === "illustrate" ? (
            <GrowthLoader label={t("garden.add.illustrating")} />
          ) : (
            <>
              <p className="text-[0.78rem] text-muted-foreground">
                {t("garden.add.illustrationHint")}
              </p>
              <ul className="mt-4 grid grid-cols-3 gap-2">
                {images.map((url) => (
                  <li key={url}>
                    <button
                      type="button"
                      onClick={() => setChosen(url)}
                      className={[
                        "relative w-full overflow-hidden rounded-xl border bg-card p-1 transition-colors",
                        chosen === url ? "border-primary" : "border-border",
                      ].join(" ")}
                      aria-label={t("garden.add.pickIllustration")}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt=""
                        className="aspect-square w-full rounded-lg object-contain"
                      />
                      {chosen === url ? (
                        <span className="absolute top-1 right-1 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                          <CheckIcon className="size-3" />
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => void generateIllustrations()}
                className="mt-3 flex min-h-10 items-center gap-1.5 text-[0.75rem] text-accent"
              >
                <SparkIcon className="size-3.5" />
                {t("garden.add.regenerate")}
              </button>
            </>
          )}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="min-h-12 rounded-full border border-border px-5 text-sm"
            >
              {t("common.back")}
            </button>
            <button
              type="button"
              disabled={!chosen || busy !== null}
              onClick={() => void goStep3()}
              className="min-h-12 flex-1 rounded-full bg-primary text-sm text-primary-foreground disabled:opacity-40"
            >
              {t("common.next")}
            </button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="mt-6">
          {busy === "identify" ? (
            <GrowthLoader label={t("garden.add.identifying")} />
          ) : (
            <div className="flex flex-col gap-3">
              <p className="flex items-center gap-1.5 text-[0.72rem] text-primary">
                <SparkIcon className="size-3.5" />
                {identified ? t("garden.add.identifyDone") : t("garden.add.identifyManual")}
              </p>
              <label className="flex flex-col gap-1.5">
                <span className="text-[0.72rem] text-muted-foreground">
                  {t("garden.add.nickname")}
                </span>
                <input
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  maxLength={24}
                  className="min-h-11 rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:border-accent"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[0.72rem] text-muted-foreground">
                  {t("garden.add.species")}
                </span>
                <input
                  value={species}
                  onChange={(event) => setSpecies(event.target.value)}
                  maxLength={30}
                  className="min-h-11 rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:border-accent"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[0.72rem] text-muted-foreground">
                  {t("garden.add.latinName")}
                </span>
                <input
                  value={latinName}
                  onChange={(event) => setLatinName(event.target.value)}
                  maxLength={40}
                  className="min-h-11 rounded-xl border border-input bg-card px-3 font-heading text-sm italic outline-none focus-visible:border-accent"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[0.72rem] text-muted-foreground">
                  {t("garden.add.location")}
                </span>
                <select
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  className="min-h-11 rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:border-accent"
                >
                  {LOCATION_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {t(`garden.locations.${key}`)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[0.72rem] text-muted-foreground">
                  {t("garden.add.waterInterval")} · {waterInterval}
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
                  {t("garden.add.fertilizeInterval")} · {fertilizeInterval}
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
                <span className="text-[0.72rem] text-muted-foreground">
                  {t("garden.add.light")}
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(["shade", "indirect", "full"] as LightNeed[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setLightNeed(option)}
                      className={[
                        "min-h-11 rounded-xl border text-[0.75rem]",
                        lightNeed === option
                          ? "border-primary bg-primary/12"
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
              <label className="flex flex-col gap-1.5">
                <span className="text-[0.72rem] text-muted-foreground">
                  {t("garden.add.tempRange")}
                </span>
                <input
                  value={tempRange}
                  onChange={(event) => setTempRange(event.target.value)}
                  maxLength={20}
                  className="min-h-11 rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:border-accent"
                />
              </label>
              <div className="mt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="min-h-12 rounded-full border border-border px-5 text-sm"
                >
                  {t("common.back")}
                </button>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => void submit()}
                  className="min-h-12 flex-1 rounded-full bg-primary text-sm text-primary-foreground disabled:opacity-40"
                >
                  {busy === "save" ? t("common.loading") : t("garden.add.finish")}
                </button>
              </div>
            </div>
          )}
          {chosen ? (
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-border bg-card/60 px-3 py-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={chosen} alt="" className="size-14 rounded-lg object-contain" />
              <p className="text-[0.72rem] text-muted-foreground">
                {t("garden.add.chosenIllustration")}
              </p>
            </div>
          ) : (
            <p className="mt-5 flex items-center gap-2 text-[0.72rem] text-muted-foreground">
              <ImagePlaceholderIcon className="size-4" />
              {t("garden.add.pickIllustration")}
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}
