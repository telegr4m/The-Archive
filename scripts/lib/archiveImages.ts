import type { ArchiveItem } from "../../app/data/archiveItems";

export function normalizeArchiveTitle(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLocaleLowerCase();
}

export function findReusableArchiveImage(
  item: Pick<ArchiveItem, "id" | "title" | "category">,
  items: ArchiveItem[],
  imageExists: (image: string) => boolean
) {
  const normalizedTitle = normalizeArchiveTitle(item.title);
  return items.find(
    (candidate) =>
      candidate.id !== item.id &&
      candidate.category !== item.category &&
      normalizeArchiveTitle(candidate.title) === normalizedTitle &&
      Boolean(candidate.image) &&
      imageExists(candidate.image)
  );
}
