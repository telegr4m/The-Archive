import type { ArchiveItem } from "./archiveItems";

export function getFavoriteArchiveItems(items: readonly ArchiveItem[]) {
  return items
    .filter((item) => item.favorite)
    .sort((a, b) => {
      const leftRating = a.rating > 0 ? a.rating : -1;
      const rightRating = b.rating > 0 ? b.rating : -1;

      return (
        rightRating - leftRating ||
        a.category.localeCompare(b.category) ||
        a.title.localeCompare(b.title)
      );
    });
}
