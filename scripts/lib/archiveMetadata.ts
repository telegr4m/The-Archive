import type { ArchiveItem } from "../../app/data/archiveItems";

export function cleanGenres(genres: string[] = []) {
  return [...new Set(genres.map((genre) => genre.trim()).filter(isUsefulGenre))];
}

export function normalizeArchiveMetadata(item: ArchiveItem): ArchiveItem {
  const normalized = {
    ...item,
    genres: cleanGenres(item.genres),
  };

  if (normalized.category === "Manhwa" && normalized.formatLabel === "Manga") {
    normalized.formatLabel = "Manhwa";
  }

  return normalized;
}

function isUsefulGenre(genre: string) {
  if (!genre) return false;
  return (
    !/^serie:/i.test(genre) &&
    !/^series?[_:]/i.test(genre) &&
    !/^nyt(?:[_:\s-]|$)/i.test(genre) &&
    !/^new york times\b/i.test(genre) &&
    !/\bbook awards?\b/i.test(genre)
  );
}
