import type { ArchiveItem } from "../lib/archiveTypes";

const weakWords = new Set([
  "a",
  "an",
  "and",
  "of",
  "the",
  "to",
  "in",
  "is",
  "my",
  "with",
]);

const affinityGroups = [
  new Set([
    "Anime:one-piece",
    "Anime:naruto",
    "Anime:bleach",
    "Anime:hunter-x-hunter-2011",
  ]),
  new Set([
    "Web Novel:shadow-slave",
    "Web Novel:lord-of-the-mysteries",
    "Web Novel:reverend-insanity",
    "Web Novel:kill-the-sun",
  ]),
];

export function getRelatedStories(
  item: ArchiveItem,
  allEntries: readonly ArchiveItem[],
  limit = 4
) {
  const candidates = allEntries.filter((candidate) => candidate.id !== item.id);
  const ranked = candidates
    .map((candidate) => scoreRelatedStory(item, candidate))
    .filter((match) => match.score > 0)
    .sort(compareMatches);
  const selected: ArchiveItem[] = [];

  addUnique(selected, ranked.map(({ item: candidate }) => candidate), limit);
  addUnique(
    selected,
    candidates
      .filter((candidate) => candidate.category === item.category)
      .sort(compareFallback),
    limit
  );
  addUnique(selected, [...candidates].sort(compareFallback), limit);
  addUnique(
    selected,
    [...candidates].sort(
      (a, b) =>
        b.createdAt.localeCompare(a.createdAt) ||
        b.rating - a.rating ||
        a.title.localeCompare(b.title)
    ),
    limit
  );

  return selected;
}

export function scoreRelatedStory(item: ArchiveItem, candidate: ArchiveItem) {
  const sharedGenres = candidate.genres.filter((genre) =>
    item.genres.some(
      (itemGenre) => normalize(itemGenre) === normalize(genre)
    )
  );
  const sharedSeriesGenres = sharedGenres.filter(isSeriesGenre);
  const sameCreator =
    Boolean(item.creator && candidate.creator) &&
    creatorsOverlap(item.creator ?? "", candidate.creator ?? "");
  const sharedTitleWords = intersect(
    titleWords(item.title),
    titleWords(candidate.title)
  );
  const sameNormalizedTitle = normalize(item.title) === normalize(candidate.title);
  const sameAffinityGroup = affinityGroups.some(
    (group) => group.has(itemKey(item)) && group.has(itemKey(candidate))
  );
  const ratingDifference =
    item.rating > 0 && candidate.rating > 0
      ? Math.abs(item.rating - candidate.rating)
      : undefined;
  const yearDifference =
    item.releaseYear && candidate.releaseYear
      ? Math.abs(item.releaseYear - candidate.releaseYear)
      : undefined;
  const score =
    (sameNormalizedTitle ? 220 : 0) +
    sharedSeriesGenres.length * 180 +
    (sameAffinityGroup ? 170 : 0) +
    (candidate.category === item.category ? 75 : 0) +
    (sameCreator ? 60 : 0) +
    sharedGenres.length * 32 +
    sharedTitleWords.length * 16 +
    (candidate.status === item.status ? 6 : 0) +
    (ratingDifference === undefined
      ? 0
      : ratingDifference <= 0.5
        ? 12
        : ratingDifference <= 1
          ? 8
          : ratingDifference <= 2
            ? 3
            : 0) +
    (yearDifference === undefined
      ? 0
      : yearDifference <= 2
        ? 8
        : yearDifference <= 5
          ? 4
          : 0);

  return {
    item: candidate,
    score,
    sharedGenres: sharedGenres.length,
    sameCategory: candidate.category === item.category,
    sameCreator,
  };
}

function compareMatches(
  a: ReturnType<typeof scoreRelatedStory>,
  b: ReturnType<typeof scoreRelatedStory>
) {
  return (
    b.score - a.score ||
    Number(b.sameCategory) - Number(a.sameCategory) ||
    Number(b.sameCreator) - Number(a.sameCreator) ||
    b.sharedGenres - a.sharedGenres ||
    b.item.rating - a.item.rating ||
    a.item.title.localeCompare(b.item.title)
  );
}

function compareFallback(a: ArchiveItem, b: ArchiveItem) {
  return (
    b.rating - a.rating ||
    b.createdAt.localeCompare(a.createdAt) ||
    a.title.localeCompare(b.title)
  );
}

function addUnique(
  selected: ArchiveItem[],
  candidates: ArchiveItem[],
  limit: number
) {
  for (const candidate of candidates) {
    if (selected.length >= limit) return;
    if (!selected.some((item) => item.id === candidate.id)) {
      selected.push(candidate);
    }
  }
}

function creatorsOverlap(left: string, right: string) {
  const leftCreators = new Set(left.split(",").map(normalize));
  return right.split(",").map(normalize).some((creator) => leftCreators.has(creator));
}

function titleWords(value: string) {
  return new Set(
    normalize(value)
      .split(" ")
      .filter((word) => word.length > 2 && !weakWords.has(word))
  );
}

function intersect(left: Set<string>, right: Set<string>) {
  return [...left].filter((value) => right.has(value));
}

function isSeriesGenre(value: string) {
  return /^serie:|series|franchise/i.test(value);
}

function itemKey(item: ArchiveItem) {
  return `${item.category}:${item.slug}`;
}

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLocaleLowerCase();
}
