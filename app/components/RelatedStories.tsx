"use client";

import Link from "next/link";
import { useMemo } from "react";
import { getArchiveItemHref } from "../lib/archiveRoutes";
import type { ArchiveItem } from "../lib/archiveTypes";
import { getRelatedEntries } from "../lib/archiveRepository";
import ArchiveCover from "./ArchiveCover";
import ArchiveRating from "./ArchiveRating";

type RelatedStoriesProps = {
  item: ArchiveItem;
};

export default function RelatedStories({ item }: RelatedStoriesProps) {
  const relatedItems = useMemo(() => getRelatedEntries(item, 5), [item]);

  if (relatedItems.length === 0) return null;

  return (
    <section
      className="mt-16 border-t border-white/10 pt-12 md:mt-24 md:pt-16 lg:mt-16 lg:pt-10"
      aria-labelledby="related-stories-title"
    >
      <div className="related-stories-heading">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-gray-500">
          Continue Exploring
        </p>
        <h2
          id="related-stories-title"
          className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-3xl"
        >
          Related Entries
        </h2>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2.5 sm:mt-8 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-3 xl:grid-cols-5">
        {relatedItems.map((relatedItem) => (
          <Link
            key={relatedItem.id}
            href={getArchiveItemHref(relatedItem)}
            scroll={true}
            className="related-story-card group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.06] lg:rounded-3xl"
          >
            <ArchiveCover image={relatedItem.image} title={relatedItem.title} />
            <div className="flex flex-1 flex-col p-3 lg:p-4">
              <div className="flex items-center justify-between gap-2 text-[0.56rem] font-medium uppercase tracking-[0.1em] text-gray-500 lg:gap-3 lg:text-[0.65rem] lg:tracking-[0.16em]">
                <span>{relatedItem.category}</span>
                <ArchiveRating
                  rating={relatedItem.rating}
                  className="hidden shrink-0 text-white lg:inline"
                />
              </div>
              <h3 className="mt-2 line-clamp-2 min-h-10 overflow-hidden text-ellipsis text-sm font-semibold leading-5 tracking-tight lg:mt-3 lg:min-h-14 lg:text-xl lg:leading-normal">
                {relatedItem.title}
              </h3>
              <p className="mt-2 line-clamp-1 text-[0.65rem] uppercase tracking-[0.1em] text-gray-400 lg:mt-3 lg:text-sm lg:normal-case lg:tracking-normal">
                {relatedItem.status}
              </p>
              <span className="mt-auto hidden items-center gap-2 pt-3 text-[0.65rem] font-medium uppercase tracking-[0.16em] text-gray-500 transition-colors duration-300 group-hover:text-white lg:flex lg:pt-5">
                View Details <span aria-hidden="true">-&gt;</span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
