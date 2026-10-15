"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { LeafIcon, DropIcon } from "@/components/garden/icons";

const DRIFT = [
  { left: "8%", delay: "0s", duration: "13s", size: 30, rotate: -12 },
  { left: "24%", delay: "1.6s", duration: "16s", size: 20, rotate: 14 },
  { left: "42%", delay: "3.2s", duration: "14s", size: 26, rotate: -6 },
  { left: "58%", delay: "0.9s", duration: "18s", size: 18, rotate: 18 },
  { left: "76%", delay: "2.4s", duration: "15s", size: 24, rotate: -16 },
  { left: "90%", delay: "4.1s", duration: "17s", size: 16, rotate: 8 },
];

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const invite = useMemo(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("invite");
  }, []);

  useEffect(() => {
    if (invite) window.localStorage.setItem("balcony:invite", invite);
  }, [invite]);

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {DRIFT.map((leaf, index) => (
          <span
            key={index}
            className="leaf-drift absolute -top-10 text-primary/35"
            style={{
              left: leaf.left,
              animationDelay: leaf.delay,
              animationDuration: leaf.duration,
              transform: `rotate(${leaf.rotate}deg)`,
            }}
          >
            <LeafIcon style={{ width: leaf.size, height: leaf.size }} />
          </span>
        ))}
        <span
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-water/40"
          style={{ animation: "breathe 5s ease-in-out infinite" }}
        >
          <DropIcon className="size-4" />
        </span>
      </div>

      <div className="relative z-10 flex w-full max-w-[22rem] flex-col items-center text-center">
        <span className="font-heading text-[0.8rem] tracking-[0.4em] text-muted-foreground">
          BALCONY
        </span>
        <h1 className="mt-3 font-heading text-[2.6rem] leading-none" data-el="login-title">
          {t("garden.appName")}
        </h1>
        <p className="mt-3 text-[0.82rem] leading-relaxed text-muted-foreground">
          {t("garden.login.subtitle")}
        </p>

        {invite ? (
          <p className="mt-5 rounded-full border border-primary/40 bg-primary/8 px-4 py-1.5 text-[0.72rem] text-primary">
            {t("garden.login.invited")}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => router.replace("/")}
          className="mt-8 min-h-12 w-full rounded-full bg-primary text-sm text-primary-foreground transition-transform active:scale-[0.99] disabled:opacity-50"
          data-el="login-button"
        >
          {t("common.signIn")}
        </button>

        <ul className="mt-10 flex flex-col gap-2 text-left text-[0.72rem] text-muted-foreground">
          <li className="flex items-center gap-2">
            <LeafIcon className="size-3.5 text-accent" />
            {t("garden.login.point1")}
          </li>
          <li className="flex items-center gap-2">
            <DropIcon className="size-3.5 text-water" />
            {t("garden.login.point2")}
          </li>
          <li className="flex items-center gap-2">
            <LeafIcon className="size-3.5 text-accent" />
            {t("garden.login.point3")}
          </li>
        </ul>
      </div>
    </main>
  );
}
