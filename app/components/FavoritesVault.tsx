import Link from "next/link";
import { getArchiveItemHref } from "../lib/archiveRoutes";
import type { ArchiveItem } from "../lib/archiveTypes";
import FavoriteTiltCard from "./FavoriteTiltCard";
import FavoriteVaultImage from "./FavoriteVaultImage";
import { getArchiveCardDescription } from "../data/archivePresentation";
import ArchiveRating from "./ArchiveRating";
import { getFavoriteEntries } from "../lib/archiveRepository";

const favorites = mixFavorites(getFavoriteEntries()).slice(0, 4);

export default function FavoritesVault() {
  return (
    <section className="relative overflow-hidden bg-black px-5 py-20 text-white sm:px-6 md:py-24 lg:py-16">
      <div className="relative z-10 mx-auto max-w-5xl">
        <p className="uppercase tracking-[0.3em] text-sm text-purple-300 mb-4">
          Favorites Vault
        </p>

        <h2 className="mb-6 text-3xl font-bold sm:text-4xl md:text-5xl lg:text-4xl">
          The entries that stay at the top.
        </h2>

        <div className="mb-8 flex flex-col gap-5 sm:mb-12 sm:flex-row sm:items-end sm:justify-between lg:mb-9">
          <p className="max-w-2xl text-base text-gray-300 sm:text-lg lg:text-base">
            A special section for the entries I would always recommend, revisit,
            or remember.
          </p>
          <Link
            href="/favorites"
            scroll={true}
            className="inline-flex min-h-11 w-fit items-center justify-center rounded-full border border-white/15 px-5 py-2.5 text-xs font-medium uppercase tracking-[0.16em] text-gray-300 transition-colors duration-300 hover:border-white/35 hover:text-white"
          >
            View All Favorites
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {favorites.map((item) => (
            <Link
              key={item.id}
              href={getArchiveItemHref(item)}
              scroll={true}
              aria-label={`View details for ${item.title}`}
              className="block cursor-pointer rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-4 focus-visible:ring-offset-black"
            >
              <FavoriteTiltCard>
                <FavoriteVaultImage image={item.image} title={item.title} />

                <div className="absolute inset-x-0 bottom-0 flex h-32 flex-col bg-gradient-to-t from-black via-black/95 to-black/80 p-3 lg:h-44">
                  <div className="mb-1 flex items-center justify-between gap-2 text-[0.55rem] uppercase tracking-[0.12em] text-purple-300 lg:gap-3 lg:text-xs lg:tracking-[0.3em]">
                    <span>{item.category}</span>
                    <ArchiveRating
                      rating={item.rating}
                      className="hidden tracking-[0.16em] text-white lg:inline"
                    />
                  </div>

                  <h3 className="line-clamp-2 min-h-10 text-sm font-bold leading-5 lg:min-h-12 lg:text-xl lg:leading-6">
                    {item.title}
                  </h3>

                  <p className="line-clamp-2 min-h-10 overflow-hidden text-ellipsis text-sm text-gray-300">
                    {getArchiveCardDescription(item)}
                  </p>
                  <span className="mt-auto hidden items-center gap-2 pt-2 text-[0.65rem] font-medium uppercase tracking-[0.16em] text-gray-400 transition-colors duration-300 group-hover:text-white lg:flex">
                    View Details <span aria-hidden="true">-&gt;</span>
                  </span>
                </div>
              </FavoriteTiltCard>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function mixFavorites(items: ArchiveItem[]) {
  const buckets = new Map<string, ArchiveItem[]>();

  for (const item of items) {
    const bucket = buckets.get(item.category) ?? [];
    bucket.push(item);
    buckets.set(item.category, bucket);
  }

  const categoryBuckets = [...buckets.entries()]
    .sort(([left], [right]) => stableHash(left) - stableHash(right))
    .map(([, bucket]) =>
      [...bucket].sort((left, right) => stableHash(left.id) - stableHash(right.id))
    );
  const mixed = [];

  for (let index = 0; mixed.length < items.length; index++) {
    for (const bucket of categoryBuckets) {
      const item = bucket[index];
      if (item) mixed.push(item);
    }
  }

  return mixed;
}

function stableHash(value: string) {
  let hash = 0;

  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) | 0;
  }

  return hash;
}
