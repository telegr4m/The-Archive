"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  getArchiveItemHref,
  type ArchiveCategory,
  type ArchiveItem,
} from "../data/archiveItems";
import { getArchiveCardDescription } from "../data/archivePresentation";
import {
  formatArchiveAddedDate,
  getRecentlyAddedItems,
} from "../data/recentlyAdded";
import ArchiveCover from "./ArchiveCover";
import ArchiveRating from "./ArchiveRating";
import Breadcrumb from "./Breadcrumb";

type CategoryFilter = "All" | ArchiveCategory;

const categoryFilters: Array<{
  label: string;
  value: CategoryFilter;
}> = [
  { label: "All", value: "All" },
  { label: "Manga", value: "Manga" },
  { label: "Manhwa", value: "Manhwa" },
  { label: "Anime", value: "Anime" },
  { label: "Web Novels", value: "Web Novel" },
  { label: "Books", value: "Book" },
];

type RecentlyAddedBrowserProps = {
  items: ArchiveItem[];
};

export default function RecentlyAddedBrowser({
  items,
}: RecentlyAddedBrowserProps) {
  const [category, setCategory] = useState<CategoryFilter>("All");
  const sortedItems = useMemo(() => getRecentlyAddedItems(items), [items]);
  const visibleItems = useMemo(
    () =>
      category === "All"
        ? sortedItems
        : sortedItems.filter((item) => item.category === category),
    [category, sortedItems]
  );

  return (
    <main className="min-h-screen bg-black px-5 py-20 text-white sm:px-6 md:px-10 lg:py-16">
      <div className="mx-auto max-w-[1560px]">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Recently Added" },
          ]}
        />

        <header className="mt-10 max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-gray-500">
            Archive Activity
          </p>
          <h1 className="mt-4 break-words text-4xl font-bold tracking-tight sm:text-6xl md:text-8xl lg:text-7xl">
            Recently Added
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-gray-400 sm:text-lg">
            Every archive entry in the order it joined the collection, newest
            first.
          </p>
        </header>

        <section className="mt-8 sm:mt-10" aria-label="Recently added filters">
          <div className="flex flex-wrap gap-2">
            {categoryFilters.map((filter) => {
              const isActive = category === filter.value;

              return (
                <button
                  key={filter.value}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setCategory(filter.value)}
                  className={`min-h-11 rounded-full border px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] transition-colors duration-300 ${
                    isActive
                      ? "border-white bg-white text-black"
                      : "border-white/15 text-gray-400 hover:border-white/35 hover:text-white"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-sm text-gray-500" aria-live="polite">
            Showing {visibleItems.length} of {items.length} entries
          </p>
        </section>

        <section
          className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4 2xl:grid-cols-5"
          aria-label="Recently added archive entries"
        >
          {visibleItems.map((item, index) => (
            <Link
              key={item.id}
              href={getArchiveItemHref(item)}
              scroll={true}
              aria-label={`View details for ${item.title}`}
              className="group h-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.06]"
            >
              <article className="flex h-full flex-col">
                <ArchiveCover
                  image={item.image}
                  title={item.title}
                  priority={index === 0}
                />
                <div className="flex flex-1 flex-col p-4 sm:p-5 lg:p-4">
                  <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-gray-500">
                    {item.category}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-3 text-[0.65rem] font-medium uppercase tracking-[0.14em] text-gray-400">
                    <span>{item.status}</span>
                    <ArchiveRating rating={item.rating} />
                  </div>
                  <h2 className="mt-2 line-clamp-2 min-h-12 overflow-hidden text-ellipsis text-lg font-semibold tracking-tight sm:mt-3 sm:min-h-14 sm:text-xl lg:min-h-12 lg:text-lg">
                    {item.title}
                  </h2>
                  <div className="mt-2 flex h-7 flex-wrap gap-1.5 overflow-hidden sm:mt-3">
                    {item.genres.slice(0, 3).map((genre) => (
                      <span
                        key={genre}
                        className="rounded-full border border-white/10 px-2.5 py-1 text-[0.7rem] text-gray-300"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 line-clamp-1 min-h-6 overflow-hidden text-ellipsis text-sm leading-6 text-gray-400 sm:mt-4 sm:line-clamp-2 sm:min-h-12">
                    {getArchiveCardDescription(item)}
                  </p>
                  <p className="mt-3 text-xs text-gray-500">
                    Added {formatArchiveAddedDate(item)}
                  </p>
                  <span className="mt-auto flex items-center gap-2 pt-3 text-xs font-medium uppercase tracking-[0.16em] text-gray-500 transition-colors duration-300 group-hover:text-white sm:pt-5">
                    View Details <span aria-hidden="true">-&gt;</span>
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </section>

        {visibleItems.length === 0 && (
          <div className="mt-10 rounded-3xl border border-dashed border-white/15 px-6 py-20 text-center">
            <p className="text-lg font-medium">No recently added entries found</p>
            <p className="mt-2 text-sm text-gray-500">
              Choose another category to see more of the archive.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
