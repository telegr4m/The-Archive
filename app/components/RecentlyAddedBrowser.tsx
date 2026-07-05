"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getArchiveItemHref } from "../lib/archiveRoutes";
import type { ArchiveCategory, ArchiveItem } from "../lib/archiveTypes";
import {
  formatArchiveChangedDate,
  getArchiveActivityVerb,
  recentArchiveChanges,
} from "../data/recentChanges";
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
  const activityItems = useMemo(() => {
    const archiveItemById = new Map(items.map((item) => [item.id, item]));

    return recentArchiveChanges
      .map((change) => {
        const item = archiveItemById.get(change.entryId);

        return item ? { change, item } : null;
      })
      .filter((change): change is NonNullable<typeof change> =>
        Boolean(change)
      );
  }, [items]);
  const visibleActivities = useMemo(
    () =>
      category === "All"
        ? activityItems
        : activityItems.filter(({ item }) => item.category === category),
    [activityItems, category]
  );

  return (
    <main className="min-h-screen bg-black px-5 py-20 text-white sm:px-6 md:px-10 lg:py-14">
      <div className="mx-auto max-w-[1320px]">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Recent Changes" },
          ]}
        />

        <header className="mt-10 max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-gray-500">
            ARCHIVE ACTIVITY
          </p>
          <h1 className="mt-4 break-words text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-6xl">
            Recent Archive Changes
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-gray-400 sm:text-lg">
            Recent status changes, additions, and updates across the archive.
          </p>
        </header>

        <section className="mt-8 sm:mt-10" aria-label="Recent changes filters">
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
            Showing {visibleActivities.length} of {activityItems.length} changes
          </p>
        </section>

        <section
          className="mt-8 grid grid-cols-2 gap-2.5 sm:mt-10 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-4 xl:grid-cols-5"
          aria-label="Recent archive changes"
        >
          {visibleActivities.map(({ change, item }, index) => {
            const activityVerb = getArchiveActivityVerb(item.category);
            const activityLabel =
              change.type === "added"
                ? `Added to archive - ${change.toStatus}`
                : `${change.fromStatus} -> ${change.toStatus}`;

            return (
              <Link
                key={change.id}
                href={getArchiveItemHref(item)}
                scroll={true}
                aria-label={`View details for ${item.title}`}
                className="group h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.06] lg:rounded-3xl"
              >
                <article className="flex h-full flex-col">
                  <ArchiveCover
                    image={item.image}
                    title={item.title}
                    priority={index === 0}
                  />
                  <div className="flex flex-1 flex-col p-3 lg:p-4">
                    <div className="flex items-center justify-between gap-2 text-[0.56rem] uppercase tracking-[0.1em] text-gray-500 lg:gap-3 lg:text-[0.65rem] lg:tracking-[0.18em]">
                      <span>{item.category}</span>
                      <ArchiveRating
                        rating={item.rating}
                        className="shrink-0 text-white"
                      />
                    </div>
                    <h2 className="mt-2 line-clamp-2 min-h-10 overflow-hidden text-ellipsis text-sm font-semibold leading-5 tracking-tight lg:mt-3 lg:min-h-12 lg:text-lg lg:leading-normal">
                      {item.title}
                    </h2>
                    <p className="mt-2 text-[0.65rem] font-medium uppercase tracking-[0.14em] text-gray-400 lg:text-xs">
                      {activityLabel}
                    </p>
                    <p className="mt-2 text-[0.65rem] text-gray-500 lg:text-xs">
                      Updated {formatArchiveChangedDate(change.changedAt)}
                    </p>
                    <p className="mt-1 hidden text-xs text-gray-600 lg:block">
                      Now {activityVerb}
                    </p>
                    <span className="mt-auto flex items-center gap-2 pt-3 text-[0.6rem] font-medium uppercase tracking-[0.14em] text-gray-500 transition-colors duration-300 group-hover:text-white lg:pt-5 lg:text-xs lg:tracking-[0.16em]">
                      View Details <span aria-hidden="true">-&gt;</span>
                    </span>
                  </div>
                </article>
              </Link>
            );
          })}
        </section>

        {visibleActivities.length === 0 && (
          <div className="mt-10 rounded-3xl border border-dashed border-white/15 px-6 py-20 text-center">
            <p className="text-lg font-medium">No recent changes found</p>
            <p className="mt-2 text-sm text-gray-500">
              Choose another category to see more archive activity.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
