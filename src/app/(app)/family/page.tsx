"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { MemberAvatar } from "@/components/garden/member-avatar";
import { CheckIcon, FamilyIcon, ImagePlaceholderIcon } from "@/components/garden/icons";
import { useGarden } from "@/components/garden/garden-provider";
import { fullDate, startOfDay } from "@/lib/garden/date";
import { leafStateFor } from "@/lib/garden/care-plan";
import type { LocaleCode } from "@/lib/i18n/locale";

export default function FamilyPage() {
  const { t, i18n } = useTranslation();
  const { snapshot, renameHousehold, renameMe } = useGarden();
  const locale = (i18n.resolvedLanguage as LocaleCode) ?? "zh-CN";
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [meDraft, setMeDraft] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const monthStart = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1), []);
  const now = new Date();

  const perMember = useMemo(() => {
    const tally = new Map<string, number>();
    for (const log of snapshot?.logs ?? []) {
      if (new Date(log.createdAt) < monthStart) continue;
      tally.set(log.memberId, (tally.get(log.memberId) ?? 0) + 1);
    }
    return tally;
  }, [snapshot?.logs, monthStart]);

  const perMemberPlants = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const log of snapshot?.logs ?? []) {
      const list = map.get(log.memberId) ?? [];
      if (!list.includes(log.plantId)) list.push(log.plantId);
      map.set(log.memberId, list);
    }
    return map;
  }, [snapshot?.logs]);

  const inviteLink = () =>
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}/login?invite=${snapshot?.household.inviteCode ?? ""}`;

  const copyInvite = async () => {
    const link = inviteLink();
    try {
      if (!navigator.clipboard?.writeText) throw new Error("clipboard_unavailable");
      await navigator.clipboard.writeText(link);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = link;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }

    setCopied(true);
    toast.success(t("garden.household.copied"));
    window.setTimeout(() => setCopied(false), 2000);
  };

  const members = snapshot?.members ?? [];
  const me = snapshot?.me;

  return (
    <div className="pt-2">
      <h1 className="font-heading text-[1.5rem] leading-none">{t("garden.family.title")}</h1>

      <section className="mt-4 rounded-xl border border-border bg-card/70 px-4 py-4">
        <p className="text-[0.7rem] text-muted-foreground">{t("garden.family.householdName")}</p>
        {nameDraft === null ? (
          <button
            type="button"
            onClick={() => setNameDraft(snapshot?.household.name ?? "")}
            className="mt-1 flex w-full items-center justify-between text-left"
          >
            <span className="font-heading text-[1.35rem]">
              {snapshot?.household.name ?? t("garden.household.untitled")}
            </span>
            <span className="text-[0.72rem] text-accent">{t("garden.family.rename")}</span>
          </button>
        ) : (
          <div className="mt-2 flex gap-2">
            <input
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
              maxLength={24}
              className="min-h-11 flex-1 rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:border-accent"
            />
            <button
              type="button"
              onClick={async () => {
                await renameHousehold(nameDraft.trim() || t("garden.household.untitled"));
                setNameDraft(null);
                toast.success(t("garden.edit.saved"));
              }}
              className="min-h-11 rounded-full bg-primary px-4 text-sm text-primary-foreground"
            >
              {t("common.save")}
            </button>
          </div>
        )}
      </section>

      <section className="mt-3 rounded-xl border border-dashed border-border px-4 py-4">
        <p className="text-[0.72rem] text-muted-foreground">{t("garden.family.inviteCode")}</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <span className="font-heading text-[1.6rem] tracking-[0.18em]">
            {snapshot?.household.inviteCode ?? "------"}
          </span>
          <button
            type="button"
            onClick={copyInvite}
            className="flex min-h-10 items-center gap-1.5 rounded-full border border-primary px-3.5 text-[0.75rem] text-primary"
          >
            {copied ? <CheckIcon className="size-3.5" /> : null}
            {copied ? t("garden.household.copied") : t("garden.family.copyLink")}
          </button>
        </div>
        <p className="mt-2 text-[0.68rem] text-muted-foreground">
          {t("garden.family.inviteHint")}
        </p>
      </section>

      <h2 className="mt-7 flex items-center gap-2 font-heading text-[1.1rem]">
        <FamilyIcon className="size-4 text-accent" />
        {t("garden.family.membersCount", { count: members.length })}
      </h2>

      <ul className="mt-3 flex flex-col gap-3 pb-6">
        {members.map((member) => {
          const isMe = member.id === me?.id;
          const plantIds = perMemberPlants.get(member.id) ?? [];
          const samples = plantIds
            .map((id) => snapshot?.plants.find((plant) => plant.id === id))
            .filter((plant) => Boolean(plant))
            .slice(0, 4);

          return (
            <li
              key={member.id}
              className="flex items-start gap-3 rounded-xl border border-border bg-card/70 px-3.5 py-3.5"
            >
              <MemberAvatar member={member} size={44} />
              <div className="min-w-0 flex-1">
                {isMe && meDraft !== null ? (
                  <div className="flex gap-2">
                    <input
                      value={meDraft}
                      onChange={(event) => setMeDraft(event.target.value)}
                      maxLength={16}
                      className="min-h-9 flex-1 rounded-lg border border-input bg-card px-2.5 text-sm outline-none focus-visible:border-accent"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        await renameMe(meDraft.trim() || t("garden.family.you"));
                        setMeDraft(null);
                        toast.success(t("garden.edit.saved"));
                      }}
                      className="min-h-9 rounded-full bg-primary px-3 text-[0.75rem] text-primary-foreground"
                    >
                      {t("common.save")}
                    </button>
                  </div>
                ) : (
                  <p className="flex items-center gap-2 text-[0.92rem]">
                    {member.displayName}
                    {isMe ? (
                      <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[0.6rem] text-primary">
                        {t("garden.family.meTag")}
                      </span>
                    ) : null}
                    {isMe ? (
                      <button
                        type="button"
                        onClick={() => setMeDraft(member.displayName)}
                        className="text-[0.62rem] text-accent underline"
                      >
                        {t("garden.family.rename")}
                      </button>
                    ) : null}
                  </p>
                )}
                <p className="mt-1 text-[0.68rem] text-muted-foreground">
                  {t("garden.family.joined", { date: fullDate(member.joinedAt, locale) })}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[0.7rem] text-foreground/75">
                    {t("garden.family.careCount", { count: perMember.get(member.id) ?? 0 })}
                  </span>
                  <span className="flex -space-x-1.5">
                    {samples.map((plant) =>
                      plant?.illustrationUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={plant.id}
                          src={plant.illustrationUrl}
                          alt={plant.nickname}
                          className="size-6 rounded-full border border-card bg-secondary/50 object-contain"
                        />
                      ) : (
                        <ImagePlaceholderIcon key={plant?.id} className="size-6 text-border" />
                      ),
                    )}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <section className="mb-4 rounded-xl bg-secondary/40 px-4 py-3.5">
        <p className="text-[0.75rem] text-foreground/80">
          {t("garden.family.summary", {
            plants: snapshot?.plants.length ?? 0,
            overdue: (snapshot?.plants ?? []).filter((plant) => leafStateFor(plant, now) === "wilted")
              .length,
            today: (snapshot?.logs ?? []).filter(
              (log) => startOfDay(log.createdAt).getTime() === startOfDay(now).getTime(),
            ).length,
          })}
        </p>
      </section>
    </div>
  );
}
