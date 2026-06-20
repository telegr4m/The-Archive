import {
  ARCHIVE_CATEGORIES,
  ARCHIVE_CATEGORY_PATHS,
  type ArchiveCategory,
} from "./archiveConstants";
import { archiveItems } from "../data/archiveItems";
import { getArchiveCategoryPath } from "./archiveRoutes";
import type { ArchiveItem } from "./archiveTypes";
import { getFavoriteArchiveItems } from "../data/favorites";
import { getRecentlyAddedItems } from "../data/recentlyAdded";
import { getRelatedStories } from "../data/relatedStories";
import type {
  ArchiveRepository,
  ArchiveStatsSummary,
} from "./archiveRepository";

const activeStatuses = new Set<ArchiveItem["status"]>([
  "Currently Reading",
  "Currently Watching",
]);

export const staticArchiveRepository: ArchiveRepository = {
  getAllEntries() {
    return archiveItems;
  },

  getEntryBySlug(categoryPath, slug) {
    return archiveItems.find(
      (item) =>
        getArchiveCategoryPath(item.category) === categoryPath &&
        item.slug === slug
    );
  },

  getEntriesByCategory(category) {
    return archiveItems.filter((item) => item.category === category);
  },

  getFeaturedEntries() {
    return archiveItems.filter((item) => item.featured);
  },

  getFavoriteEntries() {
    return getFavoriteArchiveItems(archiveItems);
  },

  getRecentlyAddedEntries(limit) {
    const items = getRecentlyAddedItems(archiveItems);
    return typeof limit === "number" ? items.slice(0, limit) : items;
  },

  getRelatedEntries(entry, limit) {
    return getRelatedStories(entry, archiveItems, limit);
  },

  searchEntries(query, filters = {}) {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const {
      category = "All",
      status = "All",
      genre = "All",
      minRating = 0,
      maxRating = 10,
    } = filters;

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
  },

  getArchiveStats(items = archiveItems) {
    return getStaticArchiveStats(items);
  },
};

export function getStaticArchiveParams() {
  return archiveItems.map((item) => ({
    category: ARCHIVE_CATEGORY_PATHS[item.category],
    slug: item.slug,
  }));
}

function getStaticArchiveStats(
  items: readonly ArchiveItem[]
): ArchiveStatsSummary {
  const ratedItems = items.filter((item) => item.rating > 0);
  const totalByCategory = Object.fromEntries(
    ARCHIVE_CATEGORIES.map((category) => [
      category,
      items.filter((item) => item.category === category).length,
    ])
  ) as Record<ArchiveCategory, number>;

  return {
    totalEntries: items.length,
    totalByCategory,
    completedEntries: items.filter((item) => item.status === "Completed").length,
    activeEntries: items.filter((item) => activeStatuses.has(item.status)).length,
    averageRating:
      ratedItems.length === 0
        ? 0
        : ratedItems.reduce((sum, item) => sum + item.rating, 0) /
          ratedItems.length,
  };
}
