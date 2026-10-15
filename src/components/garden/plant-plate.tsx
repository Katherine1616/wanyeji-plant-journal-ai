"use client";

import { useEffect, useState } from "react";
import { cn } from "@/utils/utils";
import type { LeafState } from "@/lib/garden/types";
import styles from "./plant-plate.module.css";

const DROPS = [
  { left: "32%", delay: "0s" },
  { left: "46%", delay: "0.12s" },
  { left: "58%", delay: "0.05s" },
  { left: "68%", delay: "0.18s" },
  { left: "40%", delay: "0.24s" },
];

/**
 * The illustrated plant. Leaf droop, water drops, ripple and the spring-back
 * after watering all live here so every screen renders the same plant body.
 */
export function PlantPlate({
  illustrationUrl,
  alt,
  leafState,
  breatheIndex = 0,
  justWatered = false,
  size = "card",
  className,
  onClick,
}: {
  illustrationUrl: string;
  alt: string;
  leafState: LeafState;
  breatheIndex?: number;
  justWatered?: boolean;
  size?: "card" | "mini" | "large";
  className?: string;
  onClick?: () => void;
}) {
  const [showEffect, setShowEffect] = useState(false);

  // The splash plays for a moment after a watering; the flag is flipped from
  // timers so the effect never sets state during the render commit.
  useEffect(() => {
    if (!justWatered) return;
    const start = window.setTimeout(() => setShowEffect(true), 16);
    const stop = window.setTimeout(() => setShowEffect(false), 1200);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(stop);
    };
  }, [justWatered]);

  const body = (
    <>
      <div className={cn(styles.plate, styles[leafState], className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={cn(styles.image, showEffect && styles.springing)}
          src={illustrationUrl}
          alt={alt}
          draggable={false}
          style={{ ["--breathe-delay" as string]: `${-breatheIndex * 0.65}s` }}
        />
        {showEffect ? (
          <>
            <span className={styles.drops} aria-hidden="true">
              {DROPS.map((drop) => (
                <span
                  key={drop.left + drop.delay}
                  className={styles.drop}
                  style={{ left: drop.left, animationDelay: drop.delay }}
                />
              ))}
            </span>
            <span className={styles.ripple} aria-hidden="true" />
          </>
        ) : null}
      </div>
    </>
  );

  if (!onClick) return body;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "block w-full text-left",
        size === "mini" && "opacity-95",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
      )}
      aria-label={alt}
    >
      {body}
    </button>
  );
}
