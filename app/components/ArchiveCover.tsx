"use client";

import Image from "next/image";
import { useState } from "react";

type ArchiveCoverProps = {
  image: string;
  title: string;
  priority?: boolean;
};

export default function ArchiveCover({
  image,
  title,
  priority = false,
}: ArchiveCoverProps) {
  const [isMissing, setIsMissing] = useState(() => !image);
  const [isLoaded, setIsLoaded] = useState(false);
  const filename = image.split("/").at(-1) ?? image;

  return (
    <div className="relative aspect-[3/4] overflow-hidden border-b border-white/10 bg-white/[0.04] lg:aspect-[5/6]">
      {isMissing ? (
        <div
          className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center"
          role="img"
          aria-label={`Cover missing for ${title}`}
        >
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-300">
            Cover missing
          </span>
          <span className="text-xs text-gray-500">{filename}</span>
        </div>
      ) : (
        <>
          <CoverLoadingState isLoaded={isLoaded} />
          <Image
            fill
            src={image}
            alt={`${title} cover`}
            priority={priority}
            loading={priority ? undefined : "lazy"}
            sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, 50vw"
            className={`object-cover object-top transition-[opacity,transform] duration-300 ease-out group-hover:scale-105 ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setIsLoaded(true)}
            onError={() => setIsMissing(true)}
          />
          <div className="absolute inset-0 bg-black/10 transition-colors duration-300 group-hover:bg-transparent" />
        </>
      )}
    </div>
  );
}

function CoverLoadingState({ isLoaded }: { isLoaded: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 bg-neutral-950 transition-opacity duration-300 ${
        isLoaded ? "opacity-0" : "animate-pulse opacity-100"
      }`}
    />
  );
}
