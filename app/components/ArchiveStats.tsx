"use client";

import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { ArchiveCategory, ArchiveItem } from "../lib/archiveTypes";
import { getAllEntries } from "../lib/archiveRepository";

type ArchiveStatsProps = {
  items?: ArchiveItem[];
  title?: string;
  description?: string;
  compact?: boolean;
  category?: ArchiveCategory;
  showAverageRating?: boolean;
};

type Stat = {
  label: string;
  value: number;
  decimals?: number;
};

const categories: { label: string; category: ArchiveCategory }[] = [
  { label: "Total Manga", category: "Manga" },
  { label: "Total Manhwa", category: "Manhwa" },
  { label: "Total Anime", category: "Anime" },
  { label: "Total Web Novels", category: "Web Novel" },
  { label: "Total Books", category: "Book" },
];

export default function ArchiveStats({
  items = getAllEntries(),
  title = "Archive Statistics",
  description = "A live view of the entries currently held in the archive.",
  compact = false,
  category,
  showAverageRating = true,
}: ArchiveStatsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const stats = useMemo(
    () => calculateStats(items, compact, category, showAverageRating),
    [category, compact, items, showAverageRating]
  );

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    if (!sectionRef.current) return;

    const context = gsap.context(() => {
      const values =
        sectionRef.current?.querySelectorAll<HTMLElement>(".archive-stat-value");

      if (!values) return;

      values.forEach((element) => {
        const target = Number(element.dataset.value ?? 0);
        const decimals = Number(element.dataset.decimals ?? 0);
        const counter = { value: 0 };

        gsap.to(counter, {
          value: target,
          duration: 0.25,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 95%",
            once: true,
          },
          onUpdate: () => {
            element.textContent = counter.value.toFixed(decimals);
          },
        });
      });

    }, sectionRef);

    return () => context.revert();
  }, [stats]);

  return (
    <section
      ref={sectionRef}
      className={
        compact
          ? "border-y border-white/10 py-8"
          : "bg-black px-5 py-20 text-white sm:px-6 md:px-8 md:py-28 lg:py-16"
      }
      aria-label={title}
    >
      <div className={compact ? "" : "mx-auto max-w-5xl"}>
        <div
          className={
            compact
              ? "mb-6 flex flex-wrap items-end justify-between gap-3"
              : "mb-12 max-w-3xl lg:mb-8"
          }
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.35em] text-gray-500">
              Live Archive
            </p>
            <h2
              className={
                compact
                  ? "mt-2 text-2xl font-semibold tracking-tight"
                  : "mt-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-5xl"
              }
            >
              {title}
            </h2>
          </div>
          <p
            className={
              compact
                ? "max-w-xl text-sm text-gray-500"
                : "mt-5 max-w-2xl text-lg leading-relaxed text-gray-400 lg:text-base"
            }
          >
            {description}
          </p>
        </div>

        <div
          className={
            compact
              ? "grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 lg:grid-cols-4"
              : "grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-10"
          }
        >
          {stats.map((stat, index) => (
            <article
              key={stat.label}
              className={`archive-stat-card ${
                compact
                  ? "bg-black p-5 lg:p-3.5"
                  : `rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-6 lg:p-4 xl:col-span-2 ${
                      stats.length === 8 && index === 5 ? "xl:col-start-3" : ""
                    }`
              }`}
            >
              <p
                className={`archive-stat-value font-semibold tracking-tight text-white ${
                  compact ? "text-3xl lg:text-2xl" : "text-4xl md:text-5xl lg:text-3xl"
                }`}
                data-value={stat.value}
                data-decimals={stat.decimals ?? 0}
              >
                0
              </p>
              <p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-gray-500">
                {stat.label}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function calculateStats(
  items: ArchiveItem[],
  compact: boolean,
  category?: ArchiveCategory,
  showAverageRating = true
): Stat[] {
  const completed = items.filter((item) => item.status === "Completed").length;
  const activeStatuses = getActiveStatuses(category);
  const active = items.filter((item) => activeStatuses.has(item.status)).length;
  const activeLabel = getActiveLabel(category);
  const ratedItems = items.filter((item) => item.rating > 0);
  const averageRating =
    ratedItems.length === 0
      ? 0
      : ratedItems.reduce((total, item) => total + item.rating, 0) /
        ratedItems.length;

  if (compact) {
    return [
      { label: "Entries", value: items.length },
      { label: "Completed", value: completed },
      { label: activeLabel, value: active },
      { label: "Average Rating", value: averageRating, decimals: 1 },
    ];
  }

  const stats: Stat[] = [
    { label: "Total Entries", value: items.length },
    ...categories.map(({ label, category }) => ({
      label,
      value: items.filter((item) => item.category === category).length,
    })),
    { label: "Completed", value: completed },
    { label: activeLabel, value: active },
  ];

  if (showAverageRating) {
    stats.push({
      label: "Average Rating",
      value: averageRating,
      decimals: 1,
    });
  }

  return stats;
}

function getActiveLabel(category?: ArchiveCategory) {
  if (category === "Anime") return "Currently Watching";
  if (category === "Book") return "Currently Reading";
  if (category) return "Currently Reading";
  return "Active Entries";
}

function getActiveStatuses(category?: ArchiveCategory) {
  if (category === "Anime") return new Set(["Currently Watching"]);
  if (category === "Book") return new Set(["Currently Reading"]);
  if (category) {
    return new Set(["Currently Reading"]);
  }

  return new Set([
    "Currently Reading",
    "Currently Watching",
  ]);
}
