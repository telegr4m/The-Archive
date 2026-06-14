import {
  copyFile,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { cleanupSafetyBackups } from "./lib/backupRetention";

const ROOT = process.cwd();
const BACKUP_DIRECTORY = path.join(ROOT, "archive-backups");
const JSON_BACKUP = path.join(BACKUP_DIRECTORY, "archive-backup.json");
const ARCHIVE_SOURCE = path.join(ROOT, "app", "data", "archiveItems.ts");
const TEMP_SOURCE = path.join(ROOT, "app", "data", "archiveItems.restore.tmp.ts");
const ARRAY_MARKER = "export const archiveItems: ArchiveItem[] = ";

const categories = new Set([
  "Manga",
  "Manhwa",
  "Anime",
  "Web Novel",
  "Book",
]);
const statuses = new Set([
  "Completed",
  "Currently Reading",
  "Currently Watching",
  "On Hold",
  "Dropped",
  "Planned",
]);
const visibilityValues = new Set(["public", "private", "unlisted"]);
const metadataStatusValues = new Set(["complete", "partial", "needs-review"]);
const allowedFields = new Set([
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
]);

type BackupEntry = Record<string, unknown>;

async function main() {
  console.log("Reading archive backup...");
  const backupText = await readBackup();

  console.log("Validating backup...");
  const entries = validateBackup(backupText);
  const currentSource = await readFile(ARCHIVE_SOURCE, "utf8");
  const restoredSource = replaceArchiveItems(currentSource, entries);

  console.log("Restoring archiveItems.ts...");
  const safetyCopy = path.join(
    BACKUP_DIRECTORY,
    `archiveItems-before-restore-${timestampForFilename()}.ts`
  );

  try {
    await writeFile(TEMP_SOURCE, restoredSource, {
      encoding: "utf8",
      flag: "wx",
    });
    await copyFile(ARCHIVE_SOURCE, safetyCopy);
    await rename(TEMP_SOURCE, ARCHIVE_SOURCE);
  } catch (error) {
    await rm(TEMP_SOURCE, { force: true }).catch(() => undefined);
    throw new Error(
      `Restore failed; the original archiveItems.ts was left untouched. ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  console.log(`Restore complete. Restored ${entries.length} archive entries.`);
  console.log(`Safety copy: ${path.relative(ROOT, safetyCopy)}`);
  await cleanupSafetyBackups(BACKUP_DIRECTORY);
}

async function readBackup() {
  try {
    return await readFile(JSON_BACKUP, "utf8");
  } catch (error) {
    throw new Error(
      `Archive backup not found or unreadable at ${path.relative(
        ROOT,
        JSON_BACKUP
      )}. ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export function validateBackup(backupText: string): BackupEntry[] {
  if (!backupText.trim()) {
    throw new Error("Archive backup is empty. Restore cancelled.");
  }

  let backup: unknown;
  try {
    backup = JSON.parse(backupText);
  } catch (error) {
    throw new Error(
      `Archive backup contains malformed JSON. Restore cancelled. ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  if (!isRecord(backup) || !Array.isArray(backup.entries)) {
    throw new Error(
      "Archive backup is invalid: expected an object containing an entries array."
    );
  }
  if (backup.entries.length === 0) {
    throw new Error("Archive backup contains no archive entries. Restore cancelled.");
  }

  const routeKeys = new Set<string>();
  const ids = new Set<string>();
  for (const [index, entry] of backup.entries.entries()) {
    validateEntry(entry, index);
    const routeKey = `${entry.category}:${entry.slug}`;
    if (routeKeys.has(routeKey)) {
      throw new Error(
        `Archive backup contains duplicate route "${routeKey}". Restore cancelled.`
      );
    }
    routeKeys.add(routeKey);
    if (ids.has(entry.id as string)) {
      throw new Error(
        `Archive backup contains duplicate id "${entry.id}". Restore cancelled.`
      );
    }
    ids.add(entry.id as string);
  }

  if (
    backup.totalEntries !== undefined &&
    (typeof backup.totalEntries !== "number" ||
      !Number.isInteger(backup.totalEntries) ||
      backup.totalEntries !== backup.entries.length)
  ) {
    throw new Error(
      "Archive backup totalEntries does not match the entries array. Restore cancelled."
    );
  }

  return backup.entries as BackupEntry[];
}

function validateEntry(entry: unknown, index: number): asserts entry is BackupEntry {
  if (!isRecord(entry)) {
    throw new Error(`Archive entry ${index + 1} is not an object.`);
  }
  const unexpectedField = Object.keys(entry).find(
    (field) => !allowedFields.has(field)
  );
  if (unexpectedField) {
    throw new Error(
      `Archive entry ${index + 1} contains unsupported field "${unexpectedField}".`
    );
  }

  for (const field of [
    "id",
    "slug",
    "title",
    "category",
    "status",
    "createdAt",
  ]) {
    if (typeof entry[field] !== "string" || !entry[field].trim()) {
      throw new Error(`Archive entry ${index + 1} has an invalid ${field}.`);
    }
  }
  for (const field of ["image", "description"]) {
    if (typeof entry[field] !== "string") {
      throw new Error(`Archive entry ${index + 1} has an invalid ${field}.`);
    }
  }

  if (!categories.has(entry.category as string)) {
    throw new Error(`Archive entry ${index + 1} has an invalid category.`);
  }
  if (!statuses.has(entry.status as string)) {
    throw new Error(`Archive entry ${index + 1} has an invalid status.`);
  }
  if (
    typeof entry.rating !== "number" ||
    !Number.isFinite(entry.rating) ||
    entry.rating < 0 ||
    entry.rating > 10
  ) {
    throw new Error(`Archive entry ${index + 1} has an invalid rating.`);
  }
  if (
    !Array.isArray(entry.genres) ||
    entry.genres.some((genre) => typeof genre !== "string")
  ) {
    throw new Error(`Archive entry ${index + 1} has invalid genres.`);
  }
  validateOptionalFields(entry, index);
}

function validateOptionalFields(entry: BackupEntry, index: number) {
  for (const field of [
    "shortDescription",
    "recommendLevel",
    "formatLabel",
    "creator",
    "studio",
    "favoriteCharacter",
    "featuredImagePosition",
    "detailImagePosition",
    "sourceStatus",
    "metadataFingerprint",
    "importSource",
    "ownerId",
    "createdBy",
  ]) {
    if (entry[field] !== undefined && typeof entry[field] !== "string") {
      throw new Error(`Archive entry ${index + 1} has an invalid ${field}.`);
    }
  }
  if (
    entry.metadataStatus !== undefined &&
    (typeof entry.metadataStatus !== "string" ||
      !metadataStatusValues.has(entry.metadataStatus))
  ) {
    throw new Error(`Archive entry ${index + 1} has an invalid metadataStatus.`);
  }
  for (const field of ["featured", "favorite"]) {
    if (entry[field] !== undefined && typeof entry[field] !== "boolean") {
      throw new Error(`Archive entry ${index + 1} has an invalid ${field}.`);
    }
  }
  if (
    entry.releaseYear !== undefined &&
    (typeof entry.releaseYear !== "number" ||
      !Number.isInteger(entry.releaseYear))
  ) {
    throw new Error(`Archive entry ${index + 1} has an invalid releaseYear.`);
  }
  if (
    entry.visibility !== undefined &&
    (typeof entry.visibility !== "string" ||
      !visibilityValues.has(entry.visibility))
  ) {
    throw new Error(`Archive entry ${index + 1} has an invalid visibility.`);
  }
}

function replaceArchiveItems(source: string, entries: BackupEntry[]) {
  const markerIndex = source.indexOf(ARRAY_MARKER);
  if (markerIndex < 0) {
    throw new Error("Could not find the archiveItems export in archiveItems.ts.");
  }

  const arrayStart = markerIndex + ARRAY_MARKER.length;
  const arrayEnd = source.indexOf("\n];", arrayStart);
  if (arrayEnd < 0) {
    throw new Error("Could not find the end of the archiveItems array.");
  }

  return `${source.slice(0, arrayStart)}${JSON.stringify(
    entries,
    null,
    2
  )}${source.slice(arrayEnd + 2)}`;
}

function timestampForFilename() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
