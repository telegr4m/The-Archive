import type { ArchiveItem } from "../lib/archiveTypes";

export function getArchiveCardDescription(item: ArchiveItem) {
  const source = cleanText(item.shortDescription ?? item.description);

  if (!source) return "Open this archive entry to explore its details.";
  return source;
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
