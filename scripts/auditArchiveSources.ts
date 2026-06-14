import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import {
  archiveItems,
  type ArchiveCategory,
} from "../app/data/archiveItems";
import { parseCsvRecords, slugify } from "./lib/archiveImport";

const ROOT = process.cwd();
const ARCHIVE_FILE = path.join(ROOT, "app", "data", "archiveItems.ts");
const MANUAL_FILE = path.join(ROOT, "data", "manual-archive-items.json");
const PRUNE = process.argv.includes("--prune");

// Keep this explicit so template examples and unrelated CSV files are ignored.
const categorySources: [ArchiveCategory, string][] = [
  ["Manga", "manga-import.csv"],
  ["Manhwa", "manhwa-import.csv"],
  ["Anime", "anime-import.csv"],
  ["Web Novel", "webnovel-import.csv"],
  ["Book", "book-import.csv"],
];

type ManualItem = {
  category: ArchiveCategory;
  slug: string;
};

async function main() {
  const allowedKeys = new Set<string>();

  for (const [category, filename] of categorySources) {
    const csv = await readFile(
      path.join(ROOT, "data", "imports", filename),
      "utf8"
    );

    for (const title of readCsvTitles(csv)) {
      allowedKeys.add(itemKey(category, slugify(title)));
    }
  }

  const manualItems = JSON.parse(
    await readFile(MANUAL_FILE, "utf8")
  ) as ManualItem[];

  for (const item of manualItems) {
    allowedKeys.add(itemKey(item.category, item.slug));
  }

  const untrackedItems = archiveItems.filter(
    (item) =>
      item.importSource &&
      !allowedKeys.has(itemKey(item.category, item.slug))
  );

  if (untrackedItems.length === 0) {
    console.log(
      `Archive source audit passed: ${archiveItems.length} entries; unmarked manual entries are protected.`
    );
    return;
  }

  console.log("Untracked archive entries:");
  for (const item of untrackedItems) {
    console.log(`- ${item.category}: ${item.title} (${item.slug})`);
  }

  if (!PRUNE) {
    throw new Error(
      "Archive contains entries absent from import CSVs and data/manual-archive-items.json."
    );
  }

  const untrackedKeys = new Set(
    untrackedItems.map((item) => itemKey(item.category, item.slug))
  );
  const keptItems = archiveItems.filter(
    (item) => !untrackedKeys.has(itemKey(item.category, item.slug))
  );
  const source = await readFile(ARCHIVE_FILE, "utf8");
  const { start, end } = findArchiveArrayRange(source);
  const nextSource =
    source.slice(0, start) + JSON.stringify(keptItems, null, 2) + source.slice(end);

  await writeFile(ARCHIVE_FILE, nextSource, "utf8");
  console.log(`Removed ${untrackedItems.length} untracked archive entry.`);
}

function readCsvTitles(input: string) {
  const records = parseCsvRecords(input.replace(/^\uFEFF/, ""));
  return records
    .slice(1)
    .filter((record) => record.some((value) => value.trim().length > 0))
    .map((record) => record[0].trim());
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

function itemKey(category: ArchiveCategory, slug: string) {
  return `${category}:${slug}`;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
