import { existsSync } from "node:fs";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import { archiveItems } from "../app/data/archiveItems";
import { parseCsvRecords, slugify } from "./lib/archiveImport";
import {
  archiveSources,
  getCoverRemovalDecision,
  getCsvManagedRemovals,
} from "./lib/archiveSync";

const ROOT = process.cwd();
const ARCHIVE_FILE = path.join(ROOT, "app", "data", "archiveItems.ts");
const REMOVAL_LOG = process.env.ARCHIVE_UPDATE_REMOVAL_LOG;
const QUARANTINE = process.env.ARCHIVE_UPDATE_QUARANTINE;

type PlannedImageRemoval = {
  title: string;
  original: string;
  quarantine: string;
};

async function main() {
  if (!REMOVAL_LOG || !QUARANTINE) {
    throw new Error("Archive source sync must run through npm run archive:update.");
  }

  const activeSlugsBySource = new Map<string, Set<string>>();
  for (const source of archiveSources) {
    const csv = await readFile(path.join(ROOT, "data", "imports", source.filename), "utf8");
    const records = parseCsvRecords(csv.replace(/^\uFEFF/, ""));
    activeSlugsBySource.set(
      source.filename,
      new Set(
        records
          .slice(1)
          .filter((record) => record.some((value) => value.trim()))
          .map((record) => slugify(record[0].trim()))
      )
    );
  }

  const removedEntries = getCsvManagedRemovals(archiveItems, activeSlugsBySource);
  const removedIds = new Set(removedEntries.map((item) => item.id));
  const keptItems = archiveItems.filter((item) => !removedIds.has(item.id));
  const plannedImages: PlannedImageRemoval[] = [];
  let preservedImages = 0;
  let skippedImages = 0;

  for (const item of removedEntries) {
    console.log(`[REMOVE ENTRY] ${item.category}: ${item.title}`);
    const source = archiveSources.find((candidate) => candidate.filename === item.importSource);
    if (!source) {
      console.log(`[SKIP IMAGE] ${item.title}: unknown import source`);
      preservedImages++;
      continue;
    }

    for (const image of getImageCandidates(item, source.imageFolder)) {
      const decision = getCoverRemovalDecision(
        ROOT,
        { ...item, image },
        archiveItems,
        source
      );
      if (decision.action === "preserve") {
        console.log(`[PRESERVE IMAGE] ${item.title}: ${decision.reason}`);
        preservedImages++;
        continue;
      }
      if (!existsSync(decision.filesystemPath)) {
        skippedImages++;
        continue;
      }
      if (plannedImages.some((candidate) => candidate.original === decision.filesystemPath)) {
        continue;
      }

      plannedImages.push({
        title: item.title,
        original: decision.filesystemPath,
        quarantine: path.join(
          QUARANTINE,
          path.relative(path.join(ROOT, "public"), decision.filesystemPath)
        ),
      });
    }
  }

  await writeFile(
    REMOVAL_LOG,
    `${JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        removedEntries: removedEntries.map(({ id, title, category, slug, importSource }) => ({
          id,
          title,
          category,
          slug,
          importSource,
        })),
        images: plannedImages,
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  if (removedEntries.length > 0) {
    const source = await readFile(ARCHIVE_FILE, "utf8");
    const { start, end } = findArchiveArrayRange(source);
    await writeFile(
      ARCHIVE_FILE,
      source.slice(0, start) + JSON.stringify(keptItems, null, 2) + source.slice(end),
      "utf8"
    );
  }

  for (const image of plannedImages) {
    await mkdir(path.dirname(image.quarantine), { recursive: true });
    await rename(image.original, image.quarantine);
    console.log(`[REMOVE IMAGE] ${path.relative(ROOT, image.original)}`);
  }

  console.log("\nSync removal summary");
  console.log(`Entries removed: ${removedEntries.length}`);
  console.log(`Images removed: ${plannedImages.length}`);
  console.log(`Images preserved: ${preservedImages}`);
  console.log(`Skipped removals: ${skippedImages}`);
}

function getImageCandidates(item: (typeof archiveItems)[number], imageFolder: string) {
  const images = new Set([item.image]);
  for (const extension of ["jpg", "png", "webp"]) {
    images.add(`/images/${imageFolder}/${item.slug}.${extension}`);
  }
  return [...images].filter(Boolean);
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

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
