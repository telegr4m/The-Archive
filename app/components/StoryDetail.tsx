"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import {
  archiveCategoryPaths,
  type ArchiveItem,
} from "../data/archiveItems";
import ArchiveRating from "./ArchiveRating";
import Breadcrumb from "./Breadcrumb";
import RelatedStories from "./RelatedStories";
import { getArchiveDetailDescription } from "../data/archivePresentation";

type StoryDetailProps = {
  item: ArchiveItem;
};

export default function StoryDetail({ item }: StoryDetailProps) {
  const pageRef = useRef<HTMLElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isMissing, setIsMissing] = useState(() => !item.image);
  const filename = item.image.split("/").at(-1) ?? item.image;
  const backHref = `/${archiveCategoryPaths[item.category]}`;
  const categoryLabel =
    item.category === "Web Novel"
      ? "Web Novels"
      : item.category === "Book"
        ? "Books"
        : item.category;
  const favoriteCharacter = shouldShowFavoriteCharacter(item)
    ? getMeaningfulValue(item.favoriteCharacter)
    : undefined;
  const bookAuthor =
    item.category === "Book" ? getMeaningfulValue(item.creator) : undefined;
  const metadataItems = [
    {
      label: "Format",
      value: getMeaningfulValue(item.formatLabel) ?? item.category,
    },
    {
      label: item.category === "Anime" ? "Creator" : "Author",
      value: item.category === "Book" ? undefined : getMeaningfulValue(item.creator),
    },
    {
      label: "Studio",
      value: getMeaningfulValue(item.studio),
    },
    {
      label: "Release year",
      value: item.releaseYear?.toString(),
    },
    {
      label: "Added to archive",
      value: getMeaningfulValue(item.createdAt),
    },
  ].filter(
    (metadata): metadata is { label: string; value: string } =>
      metadata.value !== undefined
  );

  useEffect(() => {
    const page = pageRef.current;
    const cover = coverRef.current;
    const content = contentRef.current;

    if (!page || !cover || !content) return;

    const context = gsap.context(() => {
      const timeline = gsap.timeline();

      timeline
        .to(page, {
          autoAlpha: 1,
          duration: 0.3,
          ease: "power2.out",
        })
        .fromTo(
          cover,
          { autoAlpha: 0, clipPath: "inset(8% 8% 8% 8%)", scale: 0.98 },
          {
            autoAlpha: 1,
            clipPath: "inset(0% 0% 0% 0%)",
            scale: 1,
            duration: 1,
            ease: "power3.out",
          },
          0.05
        )
        .fromTo(
          content.children,
          { autoAlpha: 0, y: 26 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.75,
            stagger: 0.06,
            ease: "power3.out",
          },
          0.15
        );
    }, page);

    return () => context.revert();
  }, []);

  return (
    <main
      ref={pageRef}
      className="min-h-screen bg-black px-5 pb-20 pt-24 text-white opacity-0 sm:px-6 md:px-10 md:pb-24 md:pt-32"
    >
      <div className="mx-auto max-w-7xl">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: categoryLabel, href: backHref },
            { label: item.title },
          ]}
        />

        <section className="mt-8 grid items-start gap-10 lg:mt-10 lg:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.35fr)] lg:gap-20">
          <div ref={coverRef} className="opacity-0 lg:sticky lg:top-28">
            <div className="relative mx-auto aspect-[3/4] w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04]">
              {isMissing ? (
                <div
                  className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center"
                  role="img"
                  aria-label={`Cover missing for ${item.title}`}
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-300">
                    Cover missing
                  </span>
                  <span className="text-xs text-gray-500">{filename}</span>
                </div>
              ) : (
                <Image
                  fill
                  priority
                  src={item.image}
                  alt={`${item.title} cover`}
                  sizes="(min-width: 1024px) 42vw, 90vw"
                  className="object-cover"
                  style={{
                    objectPosition: item.detailImagePosition ?? "center",
                  }}
                  onError={() => setIsMissing(true)}
                />
              )}
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          </div>

          <div ref={contentRef}>
            <p className="text-xs font-medium uppercase tracking-[0.35em] text-gray-500">
              {item.category} Entry
            </p>
            <h1 className="mt-5 break-words text-4xl font-bold tracking-tight sm:text-6xl lg:text-8xl">
              {item.title}
            </h1>
            {bookAuthor && (
              <p className="mt-5 text-lg font-medium tracking-wide text-gray-300 sm:text-xl">
                By {bookAuthor}
              </p>
            )}

            <div className="mt-7 flex flex-wrap gap-3">
              {item.rating > 0 && (
                <Highlight label="Rating">
                  <ArchiveRating rating={item.rating} />
                </Highlight>
              )}
              <Highlight label="Status" value={item.status} />
              {favoriteCharacter && (
                <Highlight
                  label="Favorite Character"
                  value={favoriteCharacter}
                />
              )}
            </div>

            <p className="mt-8 max-w-3xl text-lg leading-8 text-gray-300">
              {getArchiveDetailDescription(item)}
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {item.genres.map((genre) => (
                <span
                  key={genre}
                  className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-gray-300"
                >
                  {genre}
                </span>
              ))}
            </div>

            {metadataItems.length > 0 && (
              <dl className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2">
                {metadataItems.map((metadata, index) => (
                  <DetailStat
                    key={metadata.label}
                    label={metadata.label}
                    value={metadata.value}
                    spanFullWidth={
                      metadataItems.length % 2 === 1 &&
                      index === metadataItems.length - 1
                    }
                  />
                ))}
              </dl>
            )}

          </div>
        </section>

        <RelatedStories item={item} />
      </div>
    </main>
  );
}

function Highlight({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-full border border-white/15 px-4 py-2">
      <span className="text-[0.65rem] uppercase tracking-[0.16em] text-gray-500">
        {label}
      </span>
      <span className="ml-2 text-sm font-medium text-white">
        {children ?? value}
      </span>
    </div>
  );
}

function DetailStat({
  label,
  value,
  spanFullWidth,
}: {
  label: string;
  value: string;
  spanFullWidth: boolean;
}) {
  return (
    <div className={`bg-black p-5 ${spanFullWidth ? "sm:col-span-2" : ""}`}>
      <dt className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-gray-500">
        {label}
      </dt>
      <dd className="mt-2 text-sm font-medium text-white">{value}</dd>
    </div>
  );
}

function getMeaningfulValue(value?: string) {
  const normalizedValue = value?.trim();

  if (
    !normalizedValue ||
    ["not recorded", "unknown", "n/a", "none"].includes(
      normalizedValue.toLocaleLowerCase()
    )
  ) {
    return undefined;
  }

  return normalizedValue;
}

function shouldShowFavoriteCharacter(item: ArchiveItem) {
  return item.category !== "Book" && item.status !== "Planned";
}
