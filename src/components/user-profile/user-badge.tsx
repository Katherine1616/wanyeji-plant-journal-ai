"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DEMO_USER } from "@/lib/garden/demo-store";

export function UserBadge() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full border border-border bg-background px-2.5 py-1.5 text-sm shadow-sm transition-shadow hover:shadow-md"
      >
        <Avatar size={24} />
        <span className="max-w-[120px] truncate font-medium text-foreground">
          {DEMO_USER.name}
        </span>
      </button>
      {open ? (
        <div className="absolute top-full right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-background shadow-lg">
          <div className="flex items-start justify-between gap-3 px-4 py-4">
            <div className="flex items-center gap-3">
              <Avatar size={40} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{DEMO_USER.name}</p>
                <p className="truncate text-xs text-muted-foreground">{DEMO_USER.email}</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label={t("common.close")}
              className="mt-0.5 shrink-0 rounded-md p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground/70">{t("common.userId")}</span>
              <span className="font-mono text-foreground">{DEMO_USER.id}</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Avatar({ size }: { size: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {DEMO_USER.name[0].toUpperCase()}
    </div>
  );
}
