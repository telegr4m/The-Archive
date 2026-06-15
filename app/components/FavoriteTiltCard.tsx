"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";

const MAX_TILT = 7;
const RESTING_TRANSFORM =
  "perspective(900px) rotateX(0deg) rotateY(0deg)";

export default function FavoriteTiltCard({
  children,
}: {
  children: ReactNode;
}) {
  const tiltRef = useRef<HTMLDivElement>(null);

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || !tiltRef.current) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;

    tiltRef.current.style.transform = `perspective(900px) rotateX(${
      -y * MAX_TILT
    }deg) rotateY(${x * MAX_TILT}deg)`;
  }

  function resetTilt() {
    if (tiltRef.current) {
      tiltRef.current.style.transform = RESTING_TRANSFORM;
    }
  }

  return (
    <div
      className="stagger-card group transition-transform duration-500 hover:-translate-y-3"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
      onPointerCancel={resetTilt}
    >
      <div
        ref={tiltRef}
        className="relative min-h-[260px] overflow-hidden rounded-2xl border border-white/10 bg-black transition-[transform,border-color] duration-300 ease-out group-hover:border-white/30 lg:min-h-[380px] lg:rounded-3xl"
        style={{
          transform: RESTING_TRANSFORM,
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
}
