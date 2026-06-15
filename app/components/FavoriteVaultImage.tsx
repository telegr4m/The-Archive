"use client";

import Image from "next/image";
import { useState } from "react";

type FavoriteVaultImageProps = {
  image: string;
  title: string;
  priority?: boolean;
};

export default function FavoriteVaultImage({
  image,
  title,
  priority = false,
}: FavoriteVaultImageProps) {
  const [isMissing, setIsMissing] = useState(() => !image);
  const [isLoaded, setIsLoaded] = useState(false);
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
    <>
      <div
        aria-hidden="true"
        className={`absolute inset-0 bg-neutral-950 transition-opacity duration-500 ${
          isLoaded ? "opacity-0" : "animate-pulse opacity-100"
        }`}
      />
      <Image
        fill
        src={image}
        alt={title}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        sizes="(min-width: 1024px) 25vw, 50vw"
        className={`object-cover object-top transition-[opacity,transform] duration-300 group-hover:scale-110 ${
          isLoaded ? "opacity-90" : "opacity-0"
        }`}
        onLoad={() => setIsLoaded(true)}
        onError={() => setIsMissing(true)}
      />
    </>
  );
}
