"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { getArchiveItemHref } from "../lib/archiveRoutes";
import type { ArchiveCategory, ArchiveStatus } from "../lib/archiveTypes";
import { getAllEntries, searchEntries } from "../lib/archiveRepository";
import ArchiveCover from "./ArchiveCover";
import ArchiveRating from "./ArchiveRating";
import RandomStoryButton from "./RandomStoryButton";
import { getArchiveCardDescription } from "../data/archivePresentation";

type CategoryFilter = ArchiveCategory | "All";
type StatusFilter = ArchiveStatus | "All";

export default function GlobalArchiveSearch() {
  const headingRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [status, setStatus] = useState<StatusFilter>("All");
  const [genre, setGenre] = useState("All");
  const [minRating, setMinRating] = useState(0);
  const [maxRating, setMaxRating] = useState(10);
  const archiveItems = getAllEntries();

  const categories = useMemo(
    () => [...new Set(archiveItems.map((item) => item.category))].sort(),
    [archiveItems]
  );
  const statuses = useMemo(
    () => [...new Set(archiveItems.map((item) => item.status))].sort(),
    [archiveItems]
  );
  const genres = useMemo(
    () => [...new Set(archiveItems.flatMap((item) => item.genres))].sort(),
    [archiveItems]
  );

  const results = useMemo(() => {
    return searchEntries(query, {
      category,
      status,
      genre,
      minRating,
      maxRating,
    });
  }, [category, genre, maxRating, minRating, query, status]);

  useEffect(() => {
    if (!headingRef.current) return;

    const animation = gsap.fromTo(
      headingRef.current,
      { autoAlpha: 0, y: 32 },
      { autoAlpha: 1, y: 0, duration: 0.85, ease: "power3.out" }
    );

    return () => {
      animation.kill();
    };
  }, []);

  function resetFilters() {
    setQuery("");
    setCategory("All");
    setStatus("All");
    setGenre("All");
    setMinRating(0);
    setMaxRating(10);
  }

  const controlClassName =
    "h-11 w-full rounded-xl border border-white/10 bg-black px-4 text-sm text-white outline-none transition-colors duration-300 placeholder:text-gray-600 hover:border-white/20 focus:border-white/40";

  return (
    <main className="min-h-screen bg-black px-5 pb-20 pt-24 text-white sm:px-6 md:px-10 md:pb-24 md:pt-32 lg:pb-16 lg:pt-20">
      <div className="mx-auto max-w-[1320px]">
        <div ref={headingRef} className="max-w-4xl opacity-0">
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-gray-500">
            Global Archive
          </p>
          <h1 className="mt-4 break-words text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-6xl">
            Search the Archive
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-400 lg:mt-5 lg:text-base">
            Search every category, genre, status, and description in one place.
          </p>
        </div>

        <section
          className="mt-12 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5"
          aria-label="Global archive filters"
        >
          <label className="grid gap-2">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
              Search
            </span>
            <input
              type="search"
              value={query}
              placeholder="Search titles, genres, and descriptions..."
              className={controlClassName}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <SearchSelect
              label="Category"
              value={category}
              options={categories}
              className={controlClassName}
              onChange={(value) => setCategory(value as CategoryFilter)}
            />
            <SearchSelect
              label="Status"
              value={status}
              options={statuses}
              className={controlClassName}
              onChange={(value) => setStatus(value as StatusFilter)}
            />
            <SearchSelect
              label="Genre"
              value={genre}
              options={genres}
              className={controlClassName}
              onChange={setGenre}
            />

            <label className="grid gap-2">
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
                Minimum Rating
              </span>
              <input
                type="number"
                min={0}
                max={maxRating}
                step={1}
                value={minRating}
                className={controlClassName}
                onChange={(event) =>
                  setMinRating(
                    Math.min(maxRating, Math.max(0, Number(event.target.value)))
                  )
                }
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
                Maximum Rating
              </span>
              <input
                type="number"
                min={minRating}
                max={10}
                step={1}
                value={maxRating}
                className={controlClassName}
                onChange={(event) =>
                  setMaxRating(
                    Math.max(minRating, Math.min(10, Number(event.target.value)))
                  )
                }
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
            <p className="text-sm text-gray-500" aria-live="polite">
              Showing {results.length} of {archiveItems.length} entries
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <RandomStoryButton
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-gray-200 transition-all duration-300 hover:border-white/35 hover:bg-white/[0.06] hover:text-white"
              />
              <button
                type="button"
                className="text-sm font-medium text-gray-400 transition-colors duration-300 hover:text-white"
                onClick={resetFilters}
              >
                Reset search
              </button>
            </div>
          </div>
        </section>

        <section
          className="mt-8 grid grid-cols-2 gap-2.5 sm:mt-10 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-4 xl:grid-cols-5"
          aria-label="Global archive search results"
        >
          {results.map((item, index) => (
            <Link
              key={item.id}
              href={getArchiveItemHref(item)}
              scroll={true}
              className="global-search-card group h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.06] lg:rounded-3xl"
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
                  <div className="mt-1 flex items-center justify-between gap-2 text-[0.56rem] font-medium uppercase tracking-[0.1em] text-gray-400 lg:mt-2 lg:gap-3 lg:text-[0.65rem] lg:tracking-[0.14em]">
                    <span className="min-w-0 line-clamp-1">{item.status}</span>
                    <ArchiveRating
                      rating={item.rating}
                      className="hidden shrink-0 text-white lg:inline"
                    />
                  </div>
                  <h2 className="mt-2 line-clamp-2 min-h-10 overflow-hidden text-ellipsis text-sm font-semibold leading-5 tracking-tight lg:mt-3 lg:min-h-12 lg:text-lg lg:leading-normal">
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
        </section>

        {results.length === 0 && (
          <div className="mt-10 rounded-3xl border border-dashed border-white/15 px-6 py-20 text-center">
            <p className="text-lg font-medium">No archive items found</p>
            <p className="mt-2 text-sm text-gray-500">
              Try broadening the search or adjusting the filters.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

function SearchSelect({
  label,
  value,
  options,
  className,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  className: string;
  onChange: (value: string) => void;
}) {
  const allOptionsLabel =
    label === "Category"
      ? "All categories"
      : label === "Status"
        ? "All statuses"
        : "All genres";

  return (
    <label className="grid gap-2">
      <span className="text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
        {label}
      </span>
      <select
        value={value}
        className={className}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="All">{allOptionsLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
