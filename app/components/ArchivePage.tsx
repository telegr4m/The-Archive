"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import type { ArchiveCategory, ArchiveItem } from "../lib/archiveTypes";
import ArchiveBrowser from "./ArchiveBrowser";
import ArchiveStats from "./ArchiveStats";
import Breadcrumb from "./Breadcrumb";

type ArchivePageProps = {
  title: string;
  description: string;
  items: ArchiveItem[];
  category: ArchiveCategory;
};

export default function ArchivePage({
  title,
  description,
  items,
  category,
}: ArchivePageProps) {
  const headingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!headingRef.current) return;

    const animation = gsap.fromTo(
      headingRef.current,
      { autoAlpha: 0, y: 32 },
      { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out" }
    );

    return () => {
      animation.kill();
    };
  }, []);

  return (
    <main className="min-h-screen bg-black px-5 py-20 text-white sm:px-6 md:px-10 lg:py-14">
      <div className="mx-auto max-w-[1320px]">
        <div className="mb-10 lg:mb-8">
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: title }]} />
        </div>
        <ArchiveBrowser
          items={items}
          stats={
            <ArchiveStats
              compact
              category={category}
              items={items}
              title={`${title} Statistics`}
              description={`Live totals calculated from the ${title.toLocaleLowerCase()} archive.`}
            />
          }
          title={title}
          header={
            <div ref={headingRef} className="max-w-3xl opacity-0">
              <p className="mb-4 text-xs uppercase tracking-[0.4em] text-purple-300">
                Archive Wing
              </p>
              <h1 className="break-words text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-6xl">
                {title}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-gray-400 sm:text-lg lg:mt-5 lg:text-base">
                {description}
              </p>
            </div>
          }
        />
      </div>
    </main>
  );
}
