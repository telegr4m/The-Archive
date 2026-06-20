import {
  ARCHIVE_CATEGORY_PATHS,
  type ArchiveCategory,
} from "./archiveConstants";
import type { ArchiveItem } from "./archiveTypes";

export const archiveCategoryPaths: Record<ArchiveCategory, string> =
  ARCHIVE_CATEGORY_PATHS;

export function getArchiveCategoryPath(category: ArchiveCategory) {
  return archiveCategoryPaths[category];
}

export function getArchiveCategoryFromPath(categoryPath: string) {
  return Object.entries(archiveCategoryPaths).find(
    ([, path]) => path === categoryPath
  )?.[0] as ArchiveCategory | undefined;
}

export function getArchiveItemHref(item: Pick<ArchiveItem, "category" | "slug">) {
  return `/${getArchiveCategoryPath(item.category)}/${item.slug}`;
}

