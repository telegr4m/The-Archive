import type { ArchiveCategory, ArchiveItem, ArchiveStatus } from "../lib/archiveTypes";

export type RecentArchiveChange = {
  id: string;
  entryId: ArchiveItem["id"];
  type?: "status-change" | "added";
  fromStatus?: ArchiveStatus;
  toStatus: ArchiveStatus;
  changedAt?: string;
};

export const recentArchiveChanges: RecentArchiveChange[] = [
  {
    id: "manhwa-reality-quest-added",
    entryId: "manhwa-reality-quest",
    type: "added",
    toStatus: "Currently Reading",
    changedAt: "2026-07-05",
  },
  {
    id: "web-novel-sword-god-in-a-world-of-magic-currently-reading",
    entryId: "web-novel-sword-god-in-a-world-of-magic",
    fromStatus: "Planned",
    toStatus: "Currently Reading",
    changedAt: "2026-07-05",
  },
  {
    id: "manhwa-murim-rpg-simulation-currently-reading",
    entryId: "manhwa-murim-rpg-simulation",
    fromStatus: "Planned",
    toStatus: "Currently Reading",
    changedAt: "2026-07-05",
  },
  {
    id: "web-novel-kill-the-sun-completed",
    entryId: "web-novel-kill-the-sun",
    fromStatus: "Planned",
    toStatus: "Completed",
    changedAt: "2026-07-05",
  },
  {
    id: "manhwa-space-cheon-ma-3077-completed",
    entryId: "manhwa-space-cheon-ma-3077",
    fromStatus: "Planned",
    toStatus: "Completed",
    changedAt: "2026-07-05",
  },
];

const readingCategories = new Set<ArchiveCategory>([
  "Manga",
  "Manhwa",
  "Web Novel",
  "Book",
]);

const watchingCategories = new Set<ArchiveCategory>(["Anime"]);

export function getArchiveActivityVerb(category: ArchiveCategory) {
  if (readingCategories.has(category)) return "reading";
  if (watchingCategories.has(category)) return "watching";

  return "playing";
}

export function formatArchiveChangedDate(changedAt?: string) {
  if (!changedAt) return "Date not recorded";

  const [year, month, day] = changedAt.split("-").map(Number);

  if (!year || !month || !day) return changedAt;

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
