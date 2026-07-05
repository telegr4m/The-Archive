import Link from "next/link";
import {
  formatArchiveChangedDate,
  getArchiveActivityVerb,
  recentArchiveChanges,
} from "../data/recentChanges";
import { archiveItems } from "../data/archiveItems";
import { getArchiveItemHref } from "../lib/archiveRoutes";
import ArchiveCover from "./ArchiveCover";
import ArchiveRating from "./ArchiveRating";

const archiveItemById = new Map(archiveItems.map((item) => [item.id, item]));
const RECENT_CHANGES_HREF = "/recently-added";

export default function RecentlyAdded() {
  const recentChanges = recentArchiveChanges
    .map((change) => {
      const item = archiveItemById.get(change.entryId);

      return item ? { change, item } : null;
    })
    .filter((change): change is NonNullable<typeof change> => Boolean(change))
    .slice(0, 5);

  return (
    <section className="bg-black px-5 py-20 text-white sm:px-6 md:px-8 md:py-28 lg:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.35em] text-gray-500">
              RECENT CHANGES
            </p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-4xl">
              Recent changes in the archive.
            </h2>
          </div>
          <Link
            href={RECENT_CHANGES_HREF}
            scroll={true}
            className="inline-flex min-h-11 w-fit items-center justify-center rounded-full border border-white/15 px-5 py-2.5 text-xs font-medium uppercase tracking-[0.16em] text-gray-300 transition-colors duration-300 hover:border-white/35 hover:text-white"
          >
            View All Changes
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-2.5 sm:mt-10 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-4 xl:grid-cols-5">
          {recentChanges.map(({ change, item }) => {
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
                className="recently-added-card group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.05] lg:rounded-3xl"
              >
                <ArchiveCover image={item.image} title={item.title} />
                <div className="flex flex-1 flex-col p-3 lg:p-5">
                  <div className="flex items-center justify-between gap-2 text-[0.56rem] uppercase tracking-[0.1em] text-gray-500 lg:gap-3 lg:text-[0.65rem] lg:tracking-[0.18em]">
                    <span>{item.category}</span>
                    <ArchiveRating rating={item.rating} className="shrink-0 text-white" />
                  </div>
                  <h3 className="mt-2 line-clamp-2 min-h-10 overflow-hidden text-ellipsis text-sm font-semibold leading-5 tracking-tight lg:mt-3 lg:min-h-12 lg:text-lg lg:leading-normal">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-[0.65rem] font-medium uppercase tracking-[0.14em] text-gray-400 lg:text-xs">
                    {activityLabel}
                  </p>
                  <p className="mt-2 text-[0.65rem] text-gray-500 lg:text-xs">
                    Updated {formatArchiveChangedDate(change.changedAt)}
                  </p>
                  <p className="mt-1 hidden text-xs text-gray-600 lg:block">
                    Now {activityVerb}
                  </p>
                  <span className="mt-auto flex items-center gap-2 pt-3 text-[0.6rem] font-medium uppercase tracking-[0.14em] text-gray-500 transition-colors duration-300 group-hover:text-white lg:pt-5 lg:text-[0.65rem] lg:tracking-[0.16em]">
                    View Details <span aria-hidden="true">-&gt;</span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
