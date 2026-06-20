import type { ArchiveItem } from "../lib/archiveTypes";

type ArchiveItemWithAddedAt = ArchiveItem & {
  addedAt?: string;
};

function getAddedDate(item: ArchiveItemWithAddedAt) {
  return item.addedAt?.trim() || item.createdAt?.trim() || "";
}

export function getRecentlyAddedItems(
  items: readonly ArchiveItem[]
) {
  return items
    .map((item, index) => ({ item, index, addedDate: getAddedDate(item) }))
    .sort((a, b) => {
      if (a.addedDate && b.addedDate && a.addedDate !== b.addedDate) {
        return b.addedDate.localeCompare(a.addedDate);
      }

      if (a.addedDate && !b.addedDate) return -1;
      if (!a.addedDate && b.addedDate) return 1;

      return b.index - a.index;
    })
    .map(({ item }) => item);
}

export function formatArchiveAddedDate(item: ArchiveItemWithAddedAt) {
  const date = getAddedDate(item);

  if (!date) return "Date not recorded";

  const [year, month, day] = date.split("-").map(Number);

  if (!year || !month || !day) return date;

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
