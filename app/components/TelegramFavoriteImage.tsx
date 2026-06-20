"use client";

import Image from "next/image";
import { useState } from "react";

type TelegramFavoriteImageProps = {
  title: string;
  imagePath: string;
  imagePosition?: string;
};

export default function TelegramFavoriteImage({
  title,
  imagePath,
  imagePosition = "center",
}: TelegramFavoriteImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className="flex h-full w-full items-center justify-center bg-gradient-to-b from-red-950/35 via-neutral-950 to-black"
        aria-label={`${title} artwork unavailable`}
        role="img"
      >
        <svg
          viewBox="0 0 32 40"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="h-10 w-8 text-red-950"
          aria-hidden="true"
        >
          <path d="M16 2 28 12v16L16 38 4 28V12L16 2Z" />
          <path d="M16 9v22M9 20h14" />
        </svg>
      </div>
    );
  }

  return (
    <Image
      fill
      src={imagePath}
      alt={`${title} artwork`}
      sizes="(min-width: 640px) 144px, 112px"
      className="object-cover transition-transform duration-500 hover:scale-[1.025]"
      style={{ objectPosition: imagePosition }}
      onError={() => setHasError(true)}
    />
  );
}
