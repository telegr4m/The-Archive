import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { archiveItems } from "../app/data/archiveItems";
import type { ArchiveCategory, ArchiveItem } from "../app/lib/archiveTypes";
import { cleanupSafetyBackups } from "./lib/backupRetention";

const ROOT = process.cwd();
const BACKUP_DIRECTORY = path.join(ROOT, "archive-backups");
const JSON_BACKUP = path.join(BACKUP_DIRECTORY, "archive-backup.json");
const CSV_BACKUP = path.join(BACKUP_DIRECTORY, "archive-backup.csv");

const csvFields: (keyof ArchiveItem)[] = [
  "id",
  "slug",
  "title",
  "category",
  "status",
  "rating",
  "image",
  "genres",
  "description",
  "shortDescription",
  "recommendLevel",
  "formatLabel",
  "creator",
  "studio",
  "favoriteCharacter",
  "featured",
  "featuredImagePosition",
  "detailImagePosition",
  "favorite",
  "releaseYear",
  "sourceStatus",
  "metadataStatus",
  "metadataFingerprint",
  "importSource",
  "createdAt",
  "ownerId",
  "visibility",
  "createdBy",
];

export function createArchiveBackup(items: ArchiveItem[]) {
  const categories = items.reduce<Record<ArchiveCategory, number>>(
    (counts, item) => {
      counts[item.category]++;
      return counts;
    },
    { Manga: 0, Manhwa: 0, Anime: 0, "Web Novel": 0, Book: 0 }
  );
  return {
    exportedAt: new Date().toISOString(),
    totalEntries: items.length,
    categories,
    entries: items,
  };
}

async function main() {
  await mkdir(BACKUP_DIRECTORY, { recursive: true });
  const backup = createArchiveBackup(archiveItems);
  const csv = [
    csvFields.join(","),
    ...archiveItems.map((item) =>
      csvFields.map((field) => escapeCsv(toCsvValue(item[field]))).join(",")
    ),
  ].join("\n");

  await Promise.all([
    writeFile(JSON_BACKUP, `${JSON.stringify(backup, null, 2)}\n`, "utf8"),
    writeFile(CSV_BACKUP, `${csv}\n`, "utf8"),
  ]);

  console.log(`Exported ${archiveItems.length} archive entries.`);
  console.log(`JSON: ${path.relative(ROOT, JSON_BACKUP)}`);
  console.log(`CSV:  ${path.relative(ROOT, CSV_BACKUP)}`);
  await cleanupSafetyBackups(BACKUP_DIRECTORY);
}

function toCsvValue(value: ArchiveItem[keyof ArchiveItem]) {
  if (Array.isArray(value)) return value.join(" | ");
  if (value === undefined) return "";
  return String(value);
}

function escapeCsv(value: string) {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
