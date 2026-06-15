"use client";

import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  archiveItems,
  type ArchiveCategory,
} from "../data/archiveItems";

const categories: { label: string; category: ArchiveCategory }[] = [
  { label: "Manga", category: "Manga" },
  { label: "Manhwa", category: "Manhwa" },
  { label: "Anime", category: "Anime" },
  { label: "Web Novels", category: "Web Novel" },
  { label: "Books", category: "Book" },
];

export default function ArchiveHeatmap() {
  const sectionRef = useRef<HTMLElement>(null);
  const breakdown = useMemo(
    () =>
      categories.map(({ label, category }) => {
        const count = archiveItems.filter(
          (item) => item.category === category
        ).length;

        return {
          label,
          count,
          percentage:
            archiveItems.length === 0 ? 0 : (count / archiveItems.length) * 100,
        };
      }),
    []
  );

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    if (!sectionRef.current) return;

    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".heatmap-row").forEach((row) => {
        const count = row.querySelector<HTMLElement>(".heatmap-count");
        const bar = row.querySelector<HTMLElement>(".heatmap-bar");
        const target = Number(count?.dataset.value ?? 0);
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
            if (count) count.textContent = Math.round(counter.value).toString();
          },
        });
        gsap.fromTo(
          bar,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 0.25,
            ease: "power3.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 95%",
              once: true,
            },
          }
        );
      });
    }, sectionRef);

    return () => context.revert();
  }, []);

  return (
    <section ref={sectionRef} className="bg-black px-5 pb-20 text-white sm:px-6 md:px-8 md:pb-28 lg:pb-20">
      <div className="mx-auto max-w-6xl border-t border-white/10 pt-10 lg:pt-8">
        <div className="grid gap-8 lg:grid-cols-[0.55fr_1fr] lg:gap-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.35em] text-gray-500">
              Collection Breakdown
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              The shape of the archive.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-gray-500">
              Shows how much of the archive belongs to each category.
            </p>
          </div>
          <div className="space-y-5">
            {breakdown.map((item) => (
              <div key={item.label} className="heatmap-row">
                <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
                  <span className="text-sm font-medium text-white">
                    {item.label}
                  </span>
                  <span className="text-xs text-gray-500">
                    <span className="heatmap-count" data-value={item.count}>
                      0
                    </span>
                    {" entries • "}
                    {formatPercentage(item.percentage)}% of archive
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="heatmap-bar h-full origin-left rounded-full bg-white/70"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function formatPercentage(percentage: number) {
  return Number.isInteger(percentage)
    ? percentage.toFixed(0)
    : percentage.toFixed(1);
}
