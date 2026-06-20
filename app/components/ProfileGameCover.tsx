"use client";

import Image from "next/image";
import { useState } from "react";

type ProfileGameCoverProps = {
  title: string;
  imagePath: string;
  imageFit?: "cover" | "contain";
  imagePosition?: string;
};

export default function ProfileGameCover({
  title,
  imagePath,
  imageFit = "cover",
  imagePosition = "center",
}: ProfileGameCoverProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className="flex h-full w-full items-center justify-center bg-gradient-to-br from-red-950/35 via-neutral-950 to-black"
        aria-label={`${title} cover unavailable`}
        role="img"
      >
        <GameFallbackIcon />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <Image
        fill
        src={imagePath}
        alt={`${title} cover`}
        sizes="(min-width: 1024px) 96px, 96px"
        className={`transition-transform duration-500 group-hover:scale-[1.025] ${
          imageFit === "contain" ? "object-contain p-2" : "object-cover"
        }`}
        style={{ objectPosition: imagePosition }}
        onError={() => setHasError(true)}
      />
    </div>
  );
}

function GameFallbackIcon() {
  return (
    <svg
      viewBox="0 0 64 44"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-9 w-12 text-red-950"
      aria-hidden="true"
    >
      <path d="M17 8h30c5 0 8 4 10 10l4 13c1 5-4 8-8 5l-8-7H19l-8 7c-4 3-9 0-8-5l4-13c2-6 5-10 10-10Z" />
      <path d="M18 17v9M13.5 21.5h9M43 19h.01M50 24h.01" strokeLinecap="round" />
    </svg>
  );
}
