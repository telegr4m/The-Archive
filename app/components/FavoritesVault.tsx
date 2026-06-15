import Link from "next/link";
import {
  archiveItems,
  getArchiveItemHref,
} from "../data/archiveItems";
import FavoriteTiltCard from "./FavoriteTiltCard";
import FavoriteVaultImage from "./FavoriteVaultImage";
import { getArchiveCardDescription } from "../data/archivePresentation";
import ArchiveRating from "./ArchiveRating";

const favorites = mixFavorites(archiveItems.filter((item) => item.favorite));

export default function FavoritesVault() {
  return (
    <section className="relative overflow-hidden bg-black px-5 py-20 text-white sm:px-6 md:py-24 lg:py-20">
      <div className="relative z-10 mx-auto max-w-6xl">
        <p className="uppercase tracking-[0.3em] text-sm text-purple-300 mb-4">
          Favorites Vault
        </p>

        <h2 className="mb-6 text-3xl font-bold sm:text-4xl md:text-6xl lg:text-5xl">
          The entries that stay at the top.
        </h2>

        <p className="mb-8 max-w-2xl text-base text-gray-300 sm:mb-12 sm:text-lg">
          A special section for the entries I would always recommend, revisit,
          or remember.
        </p>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-5">
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

                <div className="absolute inset-x-0 bottom-0 bg-black/90 p-5 sm:p-6 lg:p-5">
                  <div className="mb-3 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.3em] text-purple-300">
                    <span>{item.category}</span>
                    <ArchiveRating
                      rating={item.rating}
                      className="tracking-[0.16em] text-white"
                    />
                  </div>

                  <h3 className="mb-3 line-clamp-2 text-2xl font-bold sm:text-3xl lg:text-2xl">
                    {item.title}
                  </h3>

                  <p className="line-clamp-2 min-h-10 overflow-hidden text-ellipsis text-sm text-gray-300">
                    {getArchiveCardDescription(item)}
                  </p>
                  <span className="mt-4 flex items-center gap-2 text-[0.65rem] font-medium uppercase tracking-[0.16em] text-gray-400 transition-colors duration-300 group-hover:text-white">
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

function mixFavorites(items: typeof archiveItems) {
  const buckets = new Map<string, typeof archiveItems>();

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
