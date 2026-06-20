import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import { archiveItems } from "../../app/data/archiveItems";
import type {
  ArchiveCategory,
  ArchiveItem,
  ArchiveStatus,
} from "../../app/lib/archiveTypes";
import { normalizeArchiveMetadata } from "./archiveMetadata";
import { findReusableArchiveImage } from "./archiveImages";

const ROOT = process.cwd();
const ARCHIVE_FILE = path.join(ROOT, "app", "data", "archiveItems.ts");
const BASE_COLUMNS = ["title", "status", "rating"] as const;
const FLAG_COLUMNS = ["featured", "favorite"] as const;

export type ImportConfig = {
  category: ArchiveCategory;
  label: string;
  filename: string;
  idPrefix: string;
  imageFolder: string;
  statuses: ArchiveStatus[];
  favoriteCharacter?: boolean;
  detectExistingCover?: boolean;
};

export type CsvRow = Record<string, string>;

export type ImportedArchiveItem = {
  title: string;
  slug: string;
  status: ArchiveStatus;
  rating: number;
  favoriteCharacter?: string;
  featured: boolean;
  favorite: boolean;
};

export function expectedColumns(config: ImportConfig) {
  return [
    ...BASE_COLUMNS,
    ...(config.favoriteCharacter ? ["favoriteCharacter"] : []),
    ...FLAG_COLUMNS,
  ];
}

export function parseCsv(input: string, columns: string[]): CsvRow[] {
  const records = parseCsvRecords(input.replace(/^\uFEFF/, ""));
  if (records.length === 0) return [];

  const headers = records[0].map((header) => header.trim());
  if (
    headers.length !== columns.length ||
    !columns.every((column, index) => headers[index] === column)
  ) {
    throw new Error(`CSV header must be exactly: ${columns.join(",")}`);
  }

  return records
    .slice(1)
    .filter((record) => record.some((value) => value.trim().length > 0))
    .map((record, index) => {
      if (record.length !== columns.length) {
        throw new Error(
          `CSV row ${index + 2} has ${record.length} columns; expected ${columns.length}`
        );
      }
      return Object.fromEntries(
        columns.map((column, columnIndex) => [
          column,
          record[columnIndex].trim(),
        ])
      );
    });
}

export function slugify(title: string) {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseBoolean(value: string, field: string) {
  const normalized = value.toLocaleLowerCase();
  if (["true", "yes", "1"].includes(normalized)) return true;
  if (["false", "no", "0"].includes(normalized)) return false;
  throw new Error(`${field} must be true or false`);
}

export function parseRating(value: string, rowNumber: number) {
  const rating = value ? Number(value) : 0;
  if (!Number.isFinite(rating) || rating < 0 || rating > 10) {
    throw new Error(`rating must be a number between 0 and 10 on row ${rowNumber}`);
  }
  return rating;
}

export function findDuplicateSlugs(items: Array<{ slug: string }>) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const item of items) {
    if (seen.has(item.slug)) duplicates.add(item.slug);
    seen.add(item.slug);
  }
  return duplicates;
}

export async function runArchiveImport(config: ImportConfig) {
  const dryRun = process.argv.includes("--dry-run");
  const columns = expectedColumns(config);
  const csvPath = path.join(ROOT, "data", "imports", config.filename);
  const csv = await readFile(csvPath, "utf8");
  const rows = parseCsv(csv, columns);
  const importedRows: ImportedArchiveItem[] = [];
  const invalid: string[] = [];

  console.log(`${config.label} CSV import${dryRun ? " (dry run)" : ""}\n`);
  console.log(`Source: ${path.relative(ROOT, csvPath)}`);
  console.log(`Rows read: ${rows.length}\n`);

  rows.forEach((row, index) => {
    try {
      importedRows.push(toImportedItem(row, index + 2, config));
    } catch (error) {
      invalid.push(`Row ${index + 2}: ${errorMessage(error)}`);
    }
  });

  for (const message of invalid) console.log(`[INVALID] ${message}`);
  if (invalid.length > 0) {
    throw new Error(`Import cancelled before writing: ${invalid.length} invalid row(s).`);
  }

  const duplicates = findDuplicateSlugs(importedRows);
  const uniqueRows = importedRows.filter((item, index) => {
    const firstIndex = importedRows.findIndex((candidate) => candidate.slug === item.slug);
    if (duplicates.has(item.slug) && firstIndex !== index) {
      console.log(`[SKIP] Duplicate CSV slug "${item.slug}"`);
      return false;
    }
    return true;
  });

  const mergedItems = archiveItems.map(normalizeArchiveMetadata);
  let created = 0;
  let updated = 0;
  let unchanged = 0;

  for (const importedItem of uniqueRows) {
    const index = mergedItems.findIndex(
      (item) => item.category === config.category && item.slug === importedItem.slug
    );
    if (index < 0) {
      mergedItems.push(createArchiveItem(importedItem, config));
      created++;
      console.log(`[CREATE] ${importedItem.title} (${importedItem.slug})`);
      continue;
    }

    const nextItem = mergeExistingItem(mergedItems[index], importedItem, config);
    if (JSON.stringify(nextItem) !== JSON.stringify(mergedItems[index])) {
      mergedItems[index] = nextItem;
      updated++;
      console.log(`[UPDATE] ${importedItem.title} (${importedItem.slug})`);
    } else {
      unchanged++;
    }
  }

  const source = await readFile(ARCHIVE_FILE, "utf8");
  const { start, end } = findArchiveArrayRange(source);
  const serialized = JSON.stringify(mergedItems, null, 2);
  const changed = JSON.stringify(mergedItems) !== JSON.stringify(archiveItems);

  if (!changed) {
    console.log("\nNo archive data changes detected; archiveItems.ts was not rewritten.");
  } else if (dryRun) {
    console.log("\nArchive data would change; dry run did not write archiveItems.ts.");
  } else {
    await writeFile(
      ARCHIVE_FILE,
      source.slice(0, start) + serialized + source.slice(end),
      "utf8"
    );
    console.log("\nUpdated archiveItems.ts.");
  }

  console.log("\nSummary");
  console.log(`Rows read: ${rows.length}`);
  console.log(`Created: ${created}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped unchanged: ${unchanged}`);
  console.log(`Skipped duplicates: ${importedRows.length - uniqueRows.length}`);
  console.log(`Invalid rows: ${invalid.length}`);
}

function toImportedItem(
  row: CsvRow,
  rowNumber: number,
  config: ImportConfig
): ImportedArchiveItem {
  if (!row.title) throw new Error("title is required");
  const slug = slugify(row.title);
  if (!slug) throw new Error("title could not produce a valid slug");
  if (!config.statuses.includes(row.status as ArchiveStatus)) {
    throw new Error(`invalid status "${row.status}". Use: ${config.statuses.join(", ")}`);
  }

  return {
    title: row.title,
    slug,
    status: row.status as ArchiveStatus,
    rating: parseRating(row.rating, rowNumber),
    favoriteCharacter: config.favoriteCharacter
      ? row.favoriteCharacter || undefined
      : undefined,
    featured: parseBoolean(row.featured, "featured"),
    favorite: parseBoolean(row.favorite, "favorite"),
  };
}

function mergeExistingItem(
  existing: ArchiveItem,
  imported: ImportedArchiveItem,
  config: ImportConfig
) {
  const merged: ArchiveItem = {
    ...existing,
    title: imported.title,
    category: config.category,
    status: imported.status,
    rating: imported.rating,
    featured: imported.featured,
    favorite: imported.favorite,
    importSource: config.filename,
  };
  if (config.favoriteCharacter && imported.favoriteCharacter) {
    merged.favoriteCharacter = imported.favoriteCharacter;
  } else {
    delete merged.favoriteCharacter;
  }
  return normalizeArchiveMetadata(merged);
}

function createArchiveItem(imported: ImportedArchiveItem, config: ImportConfig) {
  const reusableImage = findReusableArchiveImage(
    {
      id: `${config.idPrefix}-${imported.slug}`,
      title: imported.title,
      category: config.category,
    },
    archiveItems,
    (image) => existsSync(publicPath(image))
  );
  const item: ArchiveItem = {
    id: `${config.idPrefix}-${imported.slug}`,
    slug: imported.slug,
    title: imported.title,
    category: config.category,
    status: imported.status,
    rating: imported.rating,
    image: reusableImage?.image ?? getImagePath(imported.slug, config),
    genres: [],
    description: "",
    featured: imported.featured,
    favorite: imported.favorite,
    importSource: config.filename,
    createdAt: new Date().toISOString().slice(0, 10),
  };
  if (config.favoriteCharacter && imported.favoriteCharacter) {
    item.favoriteCharacter = imported.favoriteCharacter;
  }
  if (reusableImage) {
    console.log(
      `[REUSE IMAGE] ${imported.title}: reused image from ${reusableImage.category} entry`
    );
  }
  return item;
}

function getImagePath(slug: string, config: ImportConfig) {
  if (config.detectExistingCover) {
    for (const extension of ["jpg", "png", "webp"]) {
      const publicUrl = `/images/${config.imageFolder}/${slug}.${extension}`;
      if (existsSync(path.join(ROOT, "public", ...publicUrl.slice(1).split("/")))) {
        return publicUrl;
      }
    }
  }
  return `/images/${config.imageFolder}/${slug}.jpg`;
}

function publicPath(publicUrl: string) {
  return path.join(ROOT, "public", ...publicUrl.replace(/^\//, "").split("/"));
}

export function parseCsvRecords(input: string) {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < input.length; index++) {
    const character = input[index];
    if (quoted) {
      if (character === '"' && input[index + 1] === '"') {
        field += '"';
        index++;
      } else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") {
      record.push(field);
      field = "";
    } else if (character === "\n") {
      record.push(field.replace(/\r$/, ""));
      records.push(record);
      record = [];
      field = "";
    } else field += character;
  }
  if (quoted) throw new Error("CSV contains an unclosed quoted field");
  if (field.length > 0 || record.length > 0) {
    record.push(field.replace(/\r$/, ""));
    records.push(record);
  }
  return records;
}

function findArchiveArrayRange(source: string) {
  const sourceFile = ts.createSourceFile(
    ARCHIVE_FILE,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );
  let range: { start: number; end: number } | undefined;
  sourceFile.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) return;
    for (const declaration of node.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === "archiveItems" &&
        declaration.initializer &&
        ts.isArrayLiteralExpression(declaration.initializer)
      ) {
        range = {
          start: declaration.initializer.getStart(sourceFile),
          end: declaration.initializer.getEnd(),
        };
      }
    }
  });
  if (!range) throw new Error("Could not find archiveItems in archiveItems.ts");
  return range;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
