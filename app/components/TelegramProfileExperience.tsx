"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import TelegramEntryGate from "./TelegramEntryGate";

type TelegramProfileExperienceProps = {
  children: ReactNode;
};

export default function TelegramProfileExperience({
  children,
}: TelegramProfileExperienceProps) {
  const [hasEntered, setHasEntered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handleEntry = () => setHasEntered(true);

    window.addEventListener("telegram:entered", handleEntry);
    return () => window.removeEventListener("telegram:entered", handleEntry);
  }, []);

  useEffect(() => {
    if (!hasEntered) return;

    void videoRef.current?.play().catch(() => {
      // Muted autoplay after the entry gesture should normally succeed.
      // If a browser still blocks it, the page remains usable without video.
    });
  }, [hasEntered]);

  return (
    <>
      {hasEntered && (
        <>
          <video
            ref={videoRef}
            className="fixed inset-0 h-full w-full object-cover object-[center_65%]"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          >
            <source src="/videos/telegram-profile-bg.mp4" type="video/mp4" />
          </video>

          <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
          <div
            className="fixed inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(127,29,29,0.16),transparent_38%),linear-gradient(to_bottom,rgba(0,0,0,0.16),rgba(0,0,0,0.78))]"
            aria-hidden="true"
          />
        </>
      )}

      <div
        aria-hidden={!hasEntered}
        className={`relative z-10 min-h-full w-full transition-opacity duration-700 ${
          hasEntered
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        {children}
      </div>

      <TelegramEntryGate />
    </>
  );
}
