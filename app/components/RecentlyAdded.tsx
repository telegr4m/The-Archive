"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  archiveItems,
  getArchiveItemHref,
} from "../data/archiveItems";
import ArchiveCover from "./ArchiveCover";
import ArchiveRating from "./ArchiveRating";

export default function RecentlyAdded() {
  const recentItems = useMemo(
    () =>
      archiveItems
        .map((item, index) => ({ item, index }))
        .sort(
          (a, b) =>
            b.item.createdAt.localeCompare(a.item.createdAt) ||
            b.index - a.index
        )
        .slice(0, 5),
    []
  );

  return (
    <section className="bg-black px-5 py-20 text-white sm:px-6 md:px-8 md:py-28">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-medium uppercase tracking-[0.35em] text-gray-500">
          Recently Added
        </p>
        <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          New arrivals in the archive.
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {recentItems.map(({ item }) => (
            <Link
              key={item.id}
              href={getArchiveItemHref(item)}
              scroll={true}
              className="recently-added-card group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.05]"
            >
              <ArchiveCover image={item.image} title={item.title} />
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center justify-between gap-3 text-[0.65rem] uppercase tracking-[0.18em] text-gray-500">
                  <span>{item.category}</span>
                  <ArchiveRating rating={item.rating} />
                </div>
                <h3 className="mt-3 line-clamp-2 min-h-12 overflow-hidden text-ellipsis text-lg font-semibold tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-3 text-xs text-gray-500">
                  Added {formatDate(item.createdAt)}
                </p>
                <span className="mt-auto flex items-center gap-2 pt-5 text-[0.65rem] font-medium uppercase tracking-[0.16em] text-gray-500 transition-colors duration-300 group-hover:text-white">
                  View Details <span aria-hidden="true">-&gt;</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function formatDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return `${monthNames[month - 1]} ${day}, ${year}`;
}
