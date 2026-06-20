import path from "node:path";
import type { ArchiveItem } from "../../app/lib/archiveTypes";

export type ArchiveSource = {
  category: ArchiveItem["category"];
  filename: string;
  imageFolder: string;
};

export type CoverRemovalDecision =
  | { action: "remove"; publicPath: string; filesystemPath: string }
  | { action: "preserve"; reason: string };

export const archiveSources: ArchiveSource[] = [
  { category: "Manga", filename: "manga-import.csv", imageFolder: "manga" },
  { category: "Manhwa", filename: "manhwa-import.csv", imageFolder: "manhwa" },
  { category: "Anime", filename: "anime-import.csv", imageFolder: "anime" },
  {
    category: "Web Novel",
    filename: "webnovel-import.csv",
    imageFolder: "web-novels",
  },
  { category: "Book", filename: "book-import.csv", imageFolder: "books" },
];

export function getCsvManagedRemovals(
  items: ArchiveItem[],
  activeSlugsBySource: Map<string, Set<string>>
) {
  return items.filter((item) => {
    if (!item.importSource) return false;
    const activeSlugs = activeSlugsBySource.get(item.importSource);
    return Boolean(activeSlugs && !activeSlugs.has(item.slug));
  });
}

export function getCoverRemovalDecision(
  root: string,
  item: ArchiveItem,
  allItems: ArchiveItem[],
  source: ArchiveSource
): CoverRemovalDecision {
  const shared = allItems.some(
    (candidate) => candidate.id !== item.id && candidate.image === item.image
  );
  if (shared) {
    return { action: "preserve", reason: "image is shared by another archive entry" };
  }

  const expectedPrefix = `/images/${source.imageFolder}/`;
  if (!item.image.startsWith(expectedPrefix)) {
    return { action: "preserve", reason: "image is outside the managed category folder" };
  }

  const filename = path.posix.basename(item.image);
  const extension = path.posix.extname(filename);
  if (!extension || filename.slice(0, -extension.length) !== item.slug) {
    return { action: "preserve", reason: "image filename does not match the entry slug" };
  }

  return {
    action: "remove",
    publicPath: item.image,
    filesystemPath: path.join(root, "public", ...item.image.slice(1).split("/")),
  };
}
