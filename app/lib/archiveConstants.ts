export const ARCHIVE_CATEGORIES = [
  "Manga",
  "Manhwa",
  "Anime",
  "Web Novel",
  "Book",
] as const;

export type ArchiveCategory = (typeof ARCHIVE_CATEGORIES)[number];

export const ARCHIVE_CATEGORY_PATHS: Record<ArchiveCategory, string> = {
  Manga: "manga",
  Manhwa: "manhwa",
  Anime: "anime",
  "Web Novel": "web-novels",
  Book: "books",
};

export const ARCHIVE_STATUSES = [
  "Completed",
  "Currently Reading",
  "Currently Watching",
  "On Hold",
  "Dropped",
  "Planned",
] as const;

export type ArchiveStatus = (typeof ARCHIVE_STATUSES)[number];

export const ARCHIVE_VISIBILITIES = ["public", "private", "unlisted"] as const;

export type ArchiveVisibility = (typeof ARCHIVE_VISIBILITIES)[number];

export const USER_ROLES = ["user", "moderator", "admin"] as const;

export type UserRole = (typeof USER_ROLES)[number];

