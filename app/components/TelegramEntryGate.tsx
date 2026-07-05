"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import BioluminescentTree from "./BioluminescentTree";
import styles from "./TelegramEntryGate.module.css";

const EXIT_DURATION_MS = 650;
const PARTICLES = Array.from({ length: 20 }, (_, index) => ({
  left: `${(index * 37 + 11) % 100}%`,
  delay: `${-((index * 0.73) % 7)}s`,
  duration: `${6 + (index % 5) * 0.8}s`,
  size: `${2 + (index % 3)}px`,
}));

export default function TelegramEntryGate() {
  const [isLeaving, setIsLeaving] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  const enterProfile = () => {
    if (isLeaving) return;

    setIsLeaving(true);
    window.dispatchEvent(new Event("telegram:entered"));
    exitTimerRef.current = setTimeout(
      () => setIsVisible(false),
      EXIT_DURATION_MS
    );
  };

  if (!isVisible) return null;

  return (
    <button
      type="button"
      aria-label="Enter telegram profile and start music"
      className={`${styles.gate} fixed inset-0 z-[80] flex cursor-pointer items-center justify-center overflow-hidden border-0 bg-transparent px-5 transition-all duration-700 ${
        isLeaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      onClick={enterProfile}
    >
      <BioluminescentTree />
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(127,29,29,0.16),transparent_42%),linear-gradient(to_bottom,rgba(0,0,0,0.42),rgba(0,0,0,0.78))] backdrop-blur-[2px]"
      />
      <span className={styles.particles} aria-hidden="true">
        {PARTICLES.map((particle, index) => (
          <span
            key={index}
            className={styles.particle}
            style={
              {
                left: particle.left,
                width: particle.size,
                height: particle.size,
                animationDelay: particle.delay,
                animationDuration: particle.duration,
              }
            }
          />
        ))}
      </span>
      <span
        className={`${styles.content} relative flex flex-col items-center text-center`}
      >
        <Image
          src="/images/icons/berserk-sacrifice-enter.png"
          alt=""
          width={190}
          height={190}
          priority
          className={`${styles.symbol} mb-7 h-32 w-32 object-contain sm:h-40 sm:w-40`}
        />
        <span className="text-sm font-medium uppercase tracking-[0.38em] text-zinc-100 sm:text-base">
          click to enter...
        </span>
        <span className="mt-3 text-[10px] uppercase tracking-[0.22em] text-red-300/65 sm:text-xs">
          volume warning: music will play
        </span>
      </span>
    </button>
  );
}
