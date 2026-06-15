"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { archiveItems, getArchiveItemHref } from "../data/archiveItems";
import ArchiveCover from "./ArchiveCover";
import ArchiveRating from "./ArchiveRating";
import RandomStoryButton from "./RandomStoryButton";
import { getArchiveCardDescription } from "../data/archivePresentation";

export default function GlobalArchiveSearch() {
  const headingRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [genre, setGenre] = useState("All");
  const [minRating, setMinRating] = useState(0);
  const [maxRating, setMaxRating] = useState(10);

  const categories = useMemo(
    () => [...new Set(archiveItems.map((item) => item.category))].sort(),
    []
  );
  const statuses = useMemo(
    () => [...new Set(archiveItems.map((item) => item.status))].sort(),
    []
  );
  const genres = useMemo(
    () => [...new Set(archiveItems.flatMap((item) => item.genres))].sort(),
    []
  );

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return archiveItems
      .filter((item) => {
        const searchableText = [
          item.title,
          item.category,
          item.status,
          item.creator,
          item.description,
          ...item.genres,
        ]
          .join(" ")
          .toLocaleLowerCase();

        return (
          (normalizedQuery.length === 0 ||
            searchableText.includes(normalizedQuery)) &&
          (category === "All" || item.category === category) &&
          (status === "All" || item.status === status) &&
          (genre === "All" || item.genres.includes(genre)) &&
          item.rating >= minRating &&
          item.rating <= maxRating
        );
      })
      .sort((a, b) => b.rating - a.rating || a.title.localeCompare(b.title));
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
    <main className="min-h-screen bg-black px-5 pb-20 pt-24 text-white sm:px-6 md:px-10 md:pb-24 md:pt-32 lg:pb-20 lg:pt-24">
      <div className="mx-auto max-w-[1560px]">
        <div ref={headingRef} className="max-w-4xl opacity-0">
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-gray-500">
            Global Archive
          </p>
          <h1 className="mt-4 break-words text-4xl font-bold tracking-tight sm:text-6xl md:text-8xl lg:text-7xl">
            Search the Archive
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-400">
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
              onChange={setCategory}
            />
            <SearchSelect
              label="Status"
              value={status}
              options={statuses}
              className={controlClassName}
              onChange={setStatus}
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
          className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4 2xl:grid-cols-5"
          aria-label="Global archive search results"
        >
          {results.map((item, index) => (
            <Link
              key={item.id}
              href={getArchiveItemHref(item)}
              scroll={true}
              className="global-search-card group h-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.06]"
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
                    {item.genres.slice(0, 3).map((itemGenre) => (
                      <span
                        key={itemGenre}
                        className="rounded-full border border-white/10 px-2.5 py-1 text-[0.7rem] text-gray-300"
                      >
                        {itemGenre}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 line-clamp-1 min-h-6 overflow-hidden text-ellipsis text-sm leading-6 text-gray-400 sm:mt-4 sm:line-clamp-2 sm:min-h-12">
                    {getArchiveCardDescription(item)}
                  </p>
                  <span className="mt-auto flex items-center gap-2 pt-3 text-xs font-medium uppercase tracking-[0.16em] text-gray-500 transition-colors duration-300 group-hover:text-white sm:pt-5">
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
