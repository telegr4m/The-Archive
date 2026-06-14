import assert from "node:assert/strict";
import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { archiveItems, type ArchiveItem } from "../app/data/archiveItems";
import { getRelatedStories } from "../app/data/relatedStories";
import { createArchiveBackup } from "../scripts/exportArchive";
import {
  findDuplicateSlugs,
  parseCsv,
  slugify,
} from "../scripts/lib/archiveImport";
import {
  cleanGenres,
  normalizeArchiveMetadata,
} from "../scripts/lib/archiveMetadata";
import {
  getCoverRemovalDecision,
  getCsvManagedRemovals,
} from "../scripts/lib/archiveSync";
import {
  findReusableArchiveImage,
  normalizeArchiveTitle,
} from "../scripts/lib/archiveImages";
import { validateBackup } from "../scripts/restoreArchive";
import { cleanupSafetyBackups } from "../scripts/lib/backupRetention";
import {
  getMetadataFingerprint,
  getWebNovelMetadataStatus,
} from "../scripts/lib/metadataRetry";

test("slug generation normalizes titles consistently", () => {
  assert.equal(
    slugify("Omniscient Reader's Viewpoint"),
    "omniscient-reader-s-viewpoint"
  );
  assert.equal(slugify("  A Title: Part II  "), "a-title-part-ii");
});

test("CSV parsing handles quoted commas and escaped quotes", () => {
  const rows = parseCsv(
    'title,status,rating,favoriteCharacter,featured,favorite\n"Title, The","Completed",9,"A ""Hero""",true,false\n',
    ["title", "status", "rating", "favoriteCharacter", "featured", "favorite"]
  );

  assert.deepEqual(rows, [
    {
      title: "Title, The",
      status: "Completed",
      rating: "9",
      favoriteCharacter: 'A "Hero"',
      featured: "true",
      favorite: "false",
    },
  ]);
});

test("duplicate prevention detects repeated slugs", () => {
  const duplicates = findDuplicateSlugs([
    { slug: "same-entry" },
    { slug: "unique-entry" },
    { slug: "same-entry" },
  ]);

  assert.deepEqual([...duplicates], ["same-entry"]);
});

test("archive backup output contains a complete snapshot", () => {
  const backup = createArchiveBackup(archiveItems.slice(0, 2));

  assert.equal(backup.totalEntries, 2);
  assert.equal(backup.entries.length, 2);
  assert.match(backup.exportedAt, /^\d{4}-\d{2}-\d{2}T/);
});

test("restore validation accepts a valid backup and rejects an empty one", () => {
  const backup = createArchiveBackup(archiveItems.slice(0, 2));

  assert.equal(validateBackup(JSON.stringify(backup)).length, 2);
  assert.throws(
    () =>
      validateBackup(
        JSON.stringify({
          exportedAt: new Date().toISOString(),
          totalEntries: 0,
          categories: {},
          entries: [],
        })
      ),
    /contains no archive entries/i
  );
});

test("related entry scoring never includes the current entry", () => {
  const current = archiveItems[0];
  assert.ok(current);

  const related = getRelatedStories(current, 5);
  assert.ok(related.every((item) => item.slug !== current.slug));
});

test("metadata cleanup removes provider artifacts and fixes Manhwa formats", () => {
  const sample: ArchiveItem = {
    id: "sample",
    slug: "sample",
    title: "Sample",
    category: "Manhwa",
    status: "Completed",
    rating: 8,
    image: "",
    genres: [
      "Action",
      "Serie: Weekly Fiction",
      "NYT: Hardcover",
      "New York Times bestseller",
      "Stonewall Book Awards",
      "Action",
    ],
    description: "",
    formatLabel: "Manga",
    createdAt: "2026-01-01",
  };

  assert.deepEqual(cleanGenres(sample.genres), ["Action"]);
  assert.equal(normalizeArchiveMetadata(sample).formatLabel, "Manhwa");
});

test("CSV sync removes only marked entries absent from their import source", () => {
  const managed = {
    ...archiveItems[0],
    id: "managed",
    slug: "managed",
    importSource: "manga-import.csv",
  };
  const manual = {
    ...archiveItems[0],
    id: "manual",
    slug: "manual",
    importSource: undefined,
  };

  const removals = getCsvManagedRemovals(
    [managed, manual],
    new Map([["manga-import.csv", new Set<string>()]])
  );

  assert.deepEqual(removals.map((item) => item.id), ["managed"]);
});

test("cover cleanup removes only unique slug-matched managed images", () => {
  const item = {
    ...archiveItems[0],
    id: "book-test",
    slug: "the-hobbit",
    image: "/images/books/the-hobbit.jpg",
  };
  const source = {
    category: "Book" as const,
    filename: "book-import.csv",
    imageFolder: "books",
  };

  assert.equal(
    getCoverRemovalDecision("C:/archive", item, [item], source).action,
    "remove"
  );
  assert.equal(
    getCoverRemovalDecision(
      "C:/archive",
      item,
      [item, { ...item, id: "shared" }],
      source
    ).action,
    "preserve"
  );
  assert.equal(
    getCoverRemovalDecision(
      "C:/archive",
      { ...item, image: "/images/books/custom-cover.jpg" },
      [item],
      source
    ).action,
    "preserve"
  );
});

test("cross-category image reuse requires an exact normalized title", () => {
  const current = {
    ...archiveItems[0],
    id: "manga-monster",
    title: "Monster!",
    category: "Manga" as const,
    image: "",
  };
  const exact = {
    ...archiveItems[0],
    id: "anime-monster",
    title: "Monster",
    category: "Anime" as const,
    image: "/images/anime/monster.jpg",
  };
  const loose = {
    ...archiveItems[0],
    id: "anime-monster-club",
    title: "Monster Club",
    category: "Anime" as const,
    image: "/images/anime/monster-club.jpg",
  };

  assert.equal(normalizeArchiveTitle(current.title), normalizeArchiveTitle(exact.title));
  assert.equal(
    findReusableArchiveImage(current, [loose, exact], () => true)?.id,
    exact.id
  );
});

test("backup cleanup keeps five safety files and preserves main backups", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "archive-backups-"));
  try {
    await Promise.all([
      writeFile(path.join(directory, "archive-backup.json"), "{}"),
      writeFile(path.join(directory, "archive-backup.csv"), "title\n"),
      ...Array.from({ length: 7 }, (_, index) =>
        writeFile(
          path.join(directory, `archiveItems-before-update-${index}.ts`),
          String(index)
        )
      ),
    ]);

    const result = await cleanupSafetyBackups(directory);
    const files = await readdir(directory);

    assert.equal(result.removed.length, 2);
    assert.equal(
      files.filter((name) => name.startsWith("archiveItems-before-update-")).length,
      5
    );
    assert.ok(files.includes("archive-backup.json"));
    assert.ok(files.includes("archive-backup.csv"));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("partial Web Novel metadata is cacheable and fingerprints title changes", () => {
  const item = {
    ...archiveItems.find((entry) => entry.title === "Kill the Sun")!,
    metadataStatus: undefined,
    metadataFingerprint: undefined,
  };
  const status = getWebNovelMetadataStatus(item, ["genres"], true);

  assert.equal(status.status, "needs-review");
  assert.match(status.reason, /release year unverified/i);
  assert.notEqual(
    getMetadataFingerprint(item),
    getMetadataFingerprint({ ...item, title: `${item.title} Revised` })
  );
});
