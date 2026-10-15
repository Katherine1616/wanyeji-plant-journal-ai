"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/utils";
import {
  BookIcon,
  CalendarIcon,
  FamilyIcon,
  LeafIcon,
  PlusIcon,
} from "./icons";
import { useGarden } from "./garden-provider";
import { GardenProvider } from "./garden-provider";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { UserBadge } from "@/components/user-profile/user-badge";

const NAV = [
  { href: "/", key: "garden.nav.balcony", Icon: LeafIcon },
  { href: "/calendar", key: "garden.nav.calendar", Icon: CalendarIcon },
  { href: "/logs", key: "garden.nav.logs", Icon: BookIcon },
  { href: "/family", key: "garden.nav.family", Icon: FamilyIcon },
];

function ShellBody({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { snapshot, loading } = useGarden();

  if (loading && !snapshot) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="font-heading text-sm text-muted-foreground">
          {t("garden.home.loading")}
        </p>
      </div>
    );
  }

  if (!snapshot) return null;

  return (
    <div className="min-h-dvh pb-24 lg:pb-0">
      <div className="mx-auto w-full max-w-[1180px] px-5 pt-[max(var(--safe-top),1.25rem)] pb-6 lg:pr-8 lg:pl-[190px]">
        {children}
      </div>
      <nav
        aria-label={t("garden.appName")}
        data-el="primary-nav"
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/92 backdrop-blur",
          "flex items-stretch justify-between px-4 pb-[max(var(--safe-bottom),0.4rem)] pt-2",
          "lg:inset-y-0 lg:right-auto lg:h-dvh lg:w-[164px] lg:flex-col lg:justify-start lg:gap-2 lg:border-t-0 lg:border-r lg:px-5 lg:pt-40 lg:pb-8",
        )}
      >
        {NAV.map(({ href, key, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-1 text-[0.7rem]",
                "lg:flex-none lg:flex-row lg:justify-start lg:gap-3 lg:text-[0.8rem]",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-[22px]" />
              <span>{t(key)}</span>
              {active ? (
                <span
                  aria-hidden="true"
                  className="absolute -bottom-1 h-px w-7 bg-primary lg:top-3 lg:-left-5 lg:bottom-auto lg:h-[18px] lg:w-px"
                />
              ) : null}
            </Link>
          );
        })}
      </nav>
      <Link
        href="/plants/new"
        aria-label={t("garden.add.title")}
        data-el="add-plant-button"
        className={cn(
          "fixed right-5 bottom-[calc(max(var(--safe-bottom),0.4rem)+4.6rem)] z-30 grid size-14 place-items-center rounded-full",
          "bg-primary text-primary-foreground shadow-[0_6px_18px_-6px_rgba(43,42,38,0.45)] transition-transform active:scale-95",
          "lg:right-8 lg:bottom-10",
        )}
      >
        <PlusIcon className="size-6" />
      </Link>
      <div className="fixed top-[max(var(--safe-top),0.9rem)] right-5 z-20 hidden items-center gap-2 lg:flex lg:right-8">
        <LanguageSwitcher />
        <UserBadge />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <GardenProvider>
      <ShellBody>{children}</ShellBody>
    </GardenProvider>
  );
}
