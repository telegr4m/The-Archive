"use client";

import Image from "next/image";
import { useState } from "react";

type ArchiveCoverProps = {
  image: string;
  title: string;
};

export default function ArchiveCover({ image, title }: ArchiveCoverProps) {
  const [isMissing, setIsMissing] = useState(() => !image);
  const filename = image.split("/").at(-1) ?? image;

  return (
    <div className="relative aspect-[3/4] overflow-hidden border-b border-white/10 bg-white/[0.04]">
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
          <Image
            fill
            src={image}
            alt={`${title} cover`}
            sizes="(min-width: 1536px) 20vw, (min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
            onError={() => setIsMissing(true)}
          />
          <div className="absolute inset-0 bg-black/10 transition-colors duration-300 group-hover:bg-transparent" />
        </>
      )}
    </div>
  );
}
