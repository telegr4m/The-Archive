"use client";

import Image from "next/image";
import { useState } from "react";

type FavoriteVaultImageProps = {
  image: string;
  title: string;
};

export default function FavoriteVaultImage({
  image,
  title,
}: FavoriteVaultImageProps) {
  const [isMissing, setIsMissing] = useState(() => !image);
  const filename = image.split("/").at(-1) ?? image;

  if (isMissing) {
    return (
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center"
        role="img"
        aria-label={`Cover missing for ${title}`}
      >
        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-300">
          Cover missing
        </span>
        <span className="text-xs text-gray-500">{filename}</span>
      </div>
    );
  }

  return (
    <Image
      fill
      src={image}
      alt={title}
      sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
      className="object-cover object-top opacity-90 transition-transform duration-700 group-hover:scale-110"
      onError={() => setIsMissing(true)}
    />
  );
}
