"use client";

import {
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { getArchiveItemHref } from "../lib/archiveRoutes";
import type { ArchiveItem } from "../lib/archiveTypes";
import ArchiveCover from "./ArchiveCover";
import ArchiveRating from "./ArchiveRating";
import { getArchiveCardDescription } from "../data/archivePresentation";

type ArchiveBrowserProps = {
  header: ReactNode;
  items: ArchiveItem[];
  stats?: ReactNode;
  title: string;
};

type SortOption = "rating-desc" | "rating-asc" | "title-asc" | "title-desc";

export default function ArchiveBrowser({
  header,
  items,
  stats,
  title,
}: ArchiveBrowserProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [genre, setGenre] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("rating-desc");

  const statuses = useMemo(
    () => [...new Set(items.map((item) => item.status))].sort(),
    [items]
  );

  const genres = useMemo(
    () => [...new Set(items.flatMap((item) => item.genres))].sort(),
    [items]
  );

  const visibleItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    return items
      .filter((item) => {
        const matchesSearch =
          query.length === 0 || item.title.toLocaleLowerCase().includes(query);
        const matchesStatus = status === "All" || item.status === status;
        const matchesGenre = genre === "All" || item.genres.includes(genre);

        return matchesSearch && matchesStatus && matchesGenre;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "rating-asc":
            return a.rating - b.rating || a.title.localeCompare(b.title);
          case "title-asc":
            return a.title.localeCompare(b.title);
          case "title-desc":
            return b.title.localeCompare(a.title);
          default:
            return b.rating - a.rating || a.title.localeCompare(b.title);
        }
      });
  }, [genre, items, search, sortBy, status]);

  function resetControls() {
    setSearch("");
    setStatus("All");
    setGenre("All");
    setSortBy("rating-desc");
  }

  const controlClassName =
    "h-10 w-full rounded-lg border border-white/10 bg-black px-3 text-sm text-white outline-none transition-colors duration-300 placeholder:text-gray-600 hover:border-white/20 focus:border-white/40";

  return (
    <section aria-label={`${title} archive browser`}>
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.72fr)] lg:gap-7">
        {header}

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <label className="grid gap-1.5">
            <span className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-gray-500">
              Search
            </span>
            <input
              type="search"
              value={search}
              placeholder={`Search ${title.toLocaleLowerCase()}...`}
              className={controlClassName}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1.5">
              <span className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-gray-500">
                Status
              </span>
              <select
                value={status}
                className={controlClassName}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="All">All statuses</option>
                {statuses.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5">
              <span className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-gray-500">
                Genre
              </span>
              <select
                value={genre}
                className={controlClassName}
                onChange={(event) => setGenre(event.target.value)}
              >
                <option value="All">All genres</option>
                {genres.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5">
              <span className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-gray-500">
                Sort
              </span>
              <select
                value={sortBy}
                className={controlClassName}
                onChange={(event) => setSortBy(event.target.value as SortOption)}
              >
                <option value="rating-desc">Rating: high to low</option>
                <option value="rating-asc">Rating: low to high</option>
                <option value="title-asc">Title: A to Z</option>
                <option value="title-desc">Title: Z to A</option>
              </select>
            </label>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
            <p className="text-xs text-gray-500" aria-live="polite">
              Showing {visibleItems.length} of {items.length} items
            </p>
            <button
              type="button"
              className="text-xs font-medium text-gray-400 transition-colors duration-300 hover:text-white"
              onClick={resetControls}
            >
              Reset filters
            </button>
          </div>
        </div>
      </div>

      {stats && <div className="mt-8 sm:mt-12 lg:mt-9">{stats}</div>}

      <div
        className="mt-8 grid grid-cols-2 gap-2.5 sm:mt-12 sm:gap-6 md:grid-cols-3 lg:mt-9 lg:grid-cols-4 lg:gap-4 xl:grid-cols-5"
      >
        {visibleItems.map((item, index) => (
          <Link
            key={item.id}
            href={getArchiveItemHref(item)}
            scroll={true}
            aria-label={`View details for ${item.title}`}
            className="archive-browser-card group h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.06] lg:rounded-3xl"
          >
            <article className="flex h-full flex-col">
              <ArchiveCover
                image={item.image}
                title={item.title}
                priority={index === 0}
              />

              <div className="flex flex-1 flex-col p-3 lg:p-4">
                <p className="line-clamp-1 text-[0.58rem] font-medium uppercase tracking-[0.14em] text-gray-500 lg:text-[0.65rem] lg:tracking-[0.2em]">
                  {item.category}
                </p>

                <div className="mt-1 flex items-center justify-between gap-2 text-[0.56rem] font-medium uppercase tracking-[0.1em] text-gray-400 lg:mt-0 lg:gap-3 lg:text-[0.65rem] lg:tracking-[0.14em]">
                  <span className="min-w-0 line-clamp-1">{item.status}</span>
                  <ArchiveRating
                    rating={item.rating}
                    className="hidden shrink-0 text-white lg:inline"
                  />
                </div>

                <h2 className="mt-2 line-clamp-2 min-h-10 overflow-hidden text-ellipsis text-sm font-semibold leading-5 tracking-tight text-white lg:mt-3 lg:min-h-12 lg:text-lg lg:leading-normal">
                  {item.title}
                </h2>

                <div className="mt-2 hidden h-7 flex-wrap gap-1.5 overflow-hidden lg:mt-3 lg:flex">
                  {item.genres.slice(0, 3).map((itemGenre) => (
                    <span
                      key={itemGenre}
                      className="rounded-full border border-white/10 px-2.5 py-1 text-[0.7rem] text-gray-300"
                    >
                      {itemGenre}
                    </span>
                  ))}
                </div>

                <p className="mt-3 line-clamp-2 min-h-12 overflow-hidden text-ellipsis text-sm leading-6 text-gray-400 lg:mt-4 lg:line-clamp-3 lg:min-h-[4.5rem]">
                  {getArchiveCardDescription(item)}
                </p>
                <span className="mt-auto hidden items-center gap-2 pt-3 text-xs font-medium uppercase tracking-[0.16em] text-gray-500 transition-colors duration-300 group-hover:text-white lg:flex lg:pt-5">
                  View Details <span aria-hidden="true">-&gt;</span>
                </span>
              </div>
            </article>
          </Link>
        ))}
      </div>

      {visibleItems.length === 0 && (
        <div className="mt-8 rounded-3xl border border-dashed border-white/15 px-6 py-16 text-center">
          <p className="text-lg font-medium text-white">No archive items found</p>
          <p className="mt-2 text-sm text-gray-500">
            Try another title, status, or genre.
          </p>
        </div>
      )}
    </section>
  );
}
