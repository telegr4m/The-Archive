import type { ArchiveItem } from "./archiveItems";

const SUMMARY_LIMIT = 180;

export function getArchiveCardDescription(item: ArchiveItem) {
  const source = cleanText(item.shortDescription ?? item.description);

  if (!source) return "Open this archive entry to explore its details.";
  if (item.shortDescription) return source;

  const firstSentence = source.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();
  const summary =
    firstSentence && firstSentence.length <= SUMMARY_LIMIT
      ? firstSentence
      : truncateAtWord(source, SUMMARY_LIMIT);

  return summary;
}

export function getArchiveDetailDescription(item: ArchiveItem) {
  return cleanText(item.description);
}

function cleanText(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^---+$/gm, " ")
    .replace(/&rsquo;|&#39;/gi, "'")
    .replace(/&ldquo;|&rdquo;|&quot;/gi, '"')
    .replace(/&amp;/gi, "&")
    .replace(/&hellip;/gi, "...")
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateAtWord(value: string, limit: number) {
  if (value.length <= limit) return value;

  const shortened = value.slice(0, limit + 1);
  const lastSpace = shortened.lastIndexOf(" ");
  const cut = lastSpace > limit * 0.7 ? lastSpace : limit;

  return `${value.slice(0, cut).trimEnd()}...`;
}
