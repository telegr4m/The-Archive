"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  getArchiveItemHref,
  type ArchiveItem,
} from "../data/archiveItems";
import { getRelatedStories } from "../data/relatedStories";
import ArchiveCover from "./ArchiveCover";
import ArchiveRating from "./ArchiveRating";

type RelatedStoriesProps = {
  item: ArchiveItem;
};

export default function RelatedStories({ item }: RelatedStoriesProps) {
  const relatedItems = useMemo(() => getRelatedStories(item, 5), [item]);

  if (relatedItems.length === 0) return null;

  return (
    <section
      className="mt-16 border-t border-white/10 pt-12 md:mt-24 md:pt-16 lg:mt-20 lg:pt-12"
      aria-labelledby="related-stories-title"
    >
      <div className="related-stories-heading">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-gray-500">
          Continue Exploring
        </p>
        <h2
          id="related-stories-title"
          className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          Related Entries
        </h2>
      </div>

      <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-4 xl:grid-cols-5">
        {relatedItems.map((relatedItem) => (
          <Link
            key={relatedItem.id}
            href={getArchiveItemHref(relatedItem)}
            scroll={true}
            className="related-story-card group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.06]"
          >
            <ArchiveCover image={relatedItem.image} title={relatedItem.title} />
            <div className="flex flex-1 flex-col p-4 sm:p-5 lg:p-4">
              <div className="flex items-center justify-between gap-3 text-[0.65rem] font-medium uppercase tracking-[0.16em] text-gray-500">
                <span>{relatedItem.category}</span>
                <ArchiveRating rating={relatedItem.rating} />
              </div>
              <h3 className="mt-2 line-clamp-2 min-h-12 overflow-hidden text-ellipsis text-lg font-semibold tracking-tight sm:mt-3 sm:min-h-14 sm:text-xl">
                {relatedItem.title}
              </h3>
              <p className="mt-3 text-sm text-gray-400">{relatedItem.status}</p>
              <span className="mt-auto flex items-center gap-2 pt-3 text-[0.65rem] font-medium uppercase tracking-[0.16em] text-gray-500 transition-colors duration-300 group-hover:text-white sm:pt-5">
                View Details <span aria-hidden="true">-&gt;</span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
