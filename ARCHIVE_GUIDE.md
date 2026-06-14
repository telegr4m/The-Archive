# The Archive Content Guide

The archive is driven by `app/data/archiveItems.ts`. Adding or updating an
entry there automatically updates category pages, search, statistics,
collection breakdowns, Featured Entry, Recently Added, Favorites Vault,
related entries, detail pages, and Random Entry discovery.

## Required Fields

Every archive item needs:

- `id`: Stable identifier, usually `{category}-{slug}`.
- `slug`: Lowercase, kebab-cased route and cover filename.
- `title`
- `category`: `Manga`, `Manhwa`, `Anime`, `Web Novel`, or `Book`.
- `status`: Personal reading or watching status.
- `rating`: Personal rating out of 10.
- `image`: Public cover URL.
- `genres`
- `description`
- `createdAt`: Date added to the archive in `YYYY-MM-DD` format.

Optional personal fields include `favoriteCharacter`, `recommendLevel`,
`featured`, `favorite`, and `shortDescription`. Books do not use
`favoriteCharacter`; that field remains available for Manga, Manhwa, Anime,
and Web Novels.

Cover focal points can be adjusted without changing image sizing:

- `featuredImagePosition`: Optional CSS `object-position` used by Featured Entry.
- `detailImagePosition`: Optional CSS `object-position` used by entry detail
  covers. Detail covers default to `"center"` and use `object-cover` so the
  bordered frame is always filled without stretching or black side bars.

Optional future ownership fields include `ownerId`, `visibility`, and
`createdBy`. Existing entries intentionally omit these fields and continue to
belong to the default personal archive.

`shortDescription` is optional. Card previews prefer it when present.
Otherwise, the site automatically creates a short preview from the full
description and limits visible card text to two lines.

Fetched source metadata is stored separately where necessary:

- `releaseYear`: Publication or release year from the provider.
- `sourceStatus`: Provider lifecycle status, separate from personal `status`.
- `formatLabel`
- `creator`: Canonical creator/author field used by every category.
- `studio`: Optional Anime production studio.

Detail pages display `creator` as **Creator** for Anime and **Author** for
Manga, Manhwa, Web Novels, and Books. Empty creator and studio values are
hidden.

## Category Templates

### Manga or Manhwa

```ts
{
  id: "manga-example-title",
  slug: "example-title",
  title: "Example Title",
  category: "Manga",
  status: "Currently Reading",
  rating: 9,
  image: "/images/manga/example-title.jpg",
  genres: [],
  description: "",
  recommendLevel: "Highly recommended",
  createdAt: "2026-06-13",
}
```

Use `category: "Manhwa"` and `/images/manhwa/` for manhwa.

### Anime

```ts
{
  id: "anime-example-title",
  slug: "example-title",
  title: "Example Title",
  category: "Anime",
  status: "Currently Watching",
  rating: 9,
  image: "/images/anime/example-title.jpg",
  genres: [],
  description: "",
  favoriteCharacter: "Character Name",
  recommendLevel: "Highly recommended",
  createdAt: "2026-06-13",
}
```

### Web Novel

```ts
{
  id: "web-novel-example-title",
  slug: "example-title",
  title: "Example Title",
  category: "Web Novel",
  status: "Currently Reading",
  rating: 9,
  image: "/images/web-novels/example-title.jpg",
  genres: ["Fantasy"],
  description: "A short archive description.",
  favoriteCharacter: "Character Name",
  recommendLevel: "Highly recommended",
  createdAt: "2026-06-13",
}
```

Web novels use the CSV import workflow for personal fields. The metadata
fetcher tries AniList adaptations, Open Library, Google Books, MangaDex
adaptations, Wikipedia/Wikidata, and an optional Brave Image Search fallback in
that order. Existing working cover files are never overwritten.

### Book

```ts
{
  id: "book-example-title",
  slug: "example-title",
  title: "Example Title",
  category: "Book",
  status: "Currently Reading",
  rating: 9,
  image: "/images/books/example-title.jpg",
  genres: [],
  description: "",
  creator: "Author Name",
  recommendLevel: "Highly recommended",
  createdAt: "2026-06-13",
}
```

For Books, `creator` stores the author and `favoriteCharacter` is not used.

## Image Folders

Use lowercase, kebab-cased filenames matching each item slug. The metadata
fetcher preserves the provider's real image format (`.jpg`, `.png`, or
`.webp`) so file extensions remain accurate:

```text
public/images/manga/
public/images/manhwa/
public/images/anime/
public/images/web-novels/
public/images/books/
```

Example: `slug: "one-piece"` uses
`public/images/manga/one-piece.jpg` and `/images/manga/one-piece.jpg`.

Missing covers remain visible as explicit missing-cover states.

## Metadata Fetch Workflow

### Unified archive update

All import CSV files live in one directory:

```text
data/imports/
├── manga-import.csv
├── manhwa-import.csv
├── anime-import.csv
└── webnovel-import.csv
```

Edit any of those CSV files, then run the complete archive workflow:

```bash
npm run archive:update
```

This runs the Manga, Manhwa, Anime, Web Novel, and Book importers in order,
syncs CSV removals, audits sources, then fetches missing metadata and covers.
The workflow stops immediately and restores the pre-update archive and
quarantined covers if any step exits with an error.

After adding new entries:

1. Edit the relevant CSV files in `data/imports/`.
2. Run `npm run archive:update`.
3. Restart `npm run dev` so newly generated static detail routes are available.
4. Verify the entries on category pages and search.

Future category importers should also read from `data/imports/` and can be
added to the task list in `scripts/updateArchive.ts`.

### Book CSV workflow

Add standalone books or book series to `data/imports/book-import.csv` using:

```csv
title,status,rating,featured,favorite
"The Lightning Thief",Completed,8,false,false
"Diary of a Wimpy Kid",Completed,8.5,true,true
```

Valid Book statuses are `Planned`, `Currently Reading`, `Completed`, `On Hold`,
and `Dropped`. Books do not accept or store `favoriteCharacter`. A blank Book
rating is imported as `0` and remains hidden in the UI.

Preview or apply the Book import:

```bash
npm run import:books -- --dry-run
npm run import:books
npm run fetch:metadata
```

Books use the same `ArchiveItem` data structure, routes, cards, search, and
statistics as every other category. The importer preserves existing metadata
and creates canonical cover paths at `/images/books/<slug>.jpg`. Metadata is
fetched from Open Library, then Google Books, then Wikipedia to fill covers,
authors, descriptions, genres, and release years.

## Archive Source Audit

The five CSV files in `data/imports/` are the source of truth for entries
managed by those imports. Imported entries store their owning CSV in
`importSource`.

Running `npm run archive:update` performs a true sync:

- Adding a CSV row creates the entry.
- Updating a CSV row updates its personal fields.
- Removing a CSV row removes that CSV-managed entry from the site.
- A slug-matched downloaded cover under the matching category image folder is
  removed when no other archive entry shares it.
- Shared images, custom filenames, and images outside the managed category
  folder are preserved.

Before syncing, the update command creates a timestamped backup of
`archiveItems.ts` and an `archive-removals-*.json` report. Images selected for
removal are moved into a temporary quarantine until the full update succeeds.
If a later step fails, both `archiveItems.ts` and quarantined images are
restored.

For an entry intentionally maintained by hand instead of a CSV, add its
category and slug to `data/manual-archive-items.json`:

```json
[
  { "category": "Book", "slug": "an-intentionally-manual-entry" }
]
```

Manual entries without `importSource` are protected from CSV sync removal.
Run `npm run archive:audit` to check sources without changing data. The audit
never inserts demo, sample, starter, or placeholder entries.

## Archive Backup / Export

Create a complete JSON and CSV snapshot without changing `archiveItems.ts`:

```bash
npm run archive:export
```

The export folder is created automatically and contains:

```text
archive-backups/archive-backup.json
archive-backups/archive-backup.csv
```

The JSON backup includes the export timestamp, category totals, and every
archive field. The CSV backup contains one row per entry and joins genre arrays
with ` | ` for portability.

### Automatic Backup Cleanup

`archive:update`, `archive:restore`, and `archive:export` automatically clean
up timestamped safety backups after a successful run. The newest five files are
kept for each safety-backup type:

- `archiveItems-before-update-*.ts`
- `archiveItems-before-restore-*.ts`
- `archive-removals-*.json`

Older files in those groups are deleted with clear cleanup logs. The main
`archive-backup.json` and `archive-backup.csv` files are never removed by
automatic cleanup.

## Restoring From Backup

Use the restore command only if `app/data/archiveItems.ts` becomes corrupted or
a bad import damages the archive:

```bash
npm run archive:restore
npm run dev
```

The restore command reads `archive-backups/archive-backup.json`, validates the
backup and every archive entry, then replaces only the exported `archiveItems`
array. It preserves the TypeScript types, category paths, and helper functions
in `archiveItems.ts`.

Before overwriting the archive source, the script creates a timestamped safety
copy:

```text
archive-backups/archiveItems-before-restore-[timestamp].ts
```

The restore is cancelled if the JSON backup is missing, empty, malformed,
contains no entries, contains invalid required fields, or contains duplicate
category routes. CSV import files, cover images, and metadata are not modified
or fetched automatically.

Add a series such as `Percy Jackson & the Olympians` as one row when the archive
tracks the series as a whole, or add individual titles as separate rows when
each book needs its own rating and detail page. Book detail pages display Author
prominently and do not render chapter, episode, or reading-progress fields.

### Manga CSV workflow

Add Manga entries to `data/imports/manga-import.csv` using:

```csv
title,status,rating,favoriteCharacter,featured,favorite
```

Then run:

```bash
npm run import:manga
npm run fetch:metadata
```

The Manga importer updates manual fields by category and slug while preserving
existing covers, descriptions, genres, release years, and creators. The
metadata fetcher uses AniList to fill missing Manga metadata and
downloads covers to `public/images/manga/<slug>.jpg`.

The metadata script uses official public APIs:

- AniList GraphQL for anime, manga, and manhwa, with the MangaDex API as a
  Manhwa fallback when AniList has no matching entry.
- Google Books API for books, with Open Library as an official fallback.
- Web novels use exact-title and synonym matching across AniList adaptations,
  Open Library, Google Books, MangaDex adaptations, and Wikipedia/Wikidata.
  Set `BRAVE_SEARCH_API_KEY` to enable the final official Brave Image Search
  API fallback using the query `"<title> web novel cover"`. NovelFire and
  NovelBin results are rejected. Titles without a trustworthy match remain in
  the explicit missing-cover state.

AniList creator selection prioritizes original creator and original story
credits before other story or art credits. Anime also stores the main animation
studio separately, using it as the creator only when no creator credit exists.

Preview changes first:

```bash
npm run fetch:metadata -- --dry-run
```

Apply missing metadata and download missing covers:

```bash
npm run fetch:metadata
```

Refresh provider-managed metadata and the cover for one entry:

```bash
npm run fetch:metadata -- --refresh=example-title
```

The script only fills missing metadata. It never overwrites:

- `favoriteCharacter`
- `rating`
- `recommendLevel`
- `favorite`
- `featured`

It also keeps personal `status` separate from provider `sourceStatus`.

Web Novel metadata checks are cached with `metadataStatus` and
`metadataFingerprint`. Entries with valid covers, descriptions, creators, and
formats are marked `partial` or `needs-review` when only non-critical metadata
remains unresolved. Normal `archive:update` runs skip those provider retries.
Use `npm run fetch:metadata -- --refresh=<slug>` to force a retry. Changing the
entry title or slug also changes its fingerprint and reopens metadata lookup.

## Adding New Entries

1. Add an item using the relevant category template.
2. Choose a unique slug and matching canonical image path.
3. Write the personal fields and rating.
4. Run the metadata fetcher in dry-run mode.
5. Review the log, then run it without `--dry-run`.
6. Run `npm run lint` and `npm run build`.

## Importing Many Manhwa Entries

Fill out `data/imports/manhwa-import.csv` using these columns:

```csv
title,status,rating,favoriteCharacter,featured,favorite
```

Example:

```csv
"Omniscient Reader","Currently Reading",10,"Kim Dokja",true,true
"Solo Leveling",Completed,9,"Sung Jinwoo",false,false
```

Rules:

- Keep the header unchanged.
- Valid statuses are `Planned`, `Currently Reading`, `Completed`, `On Hold`,
  and `Dropped`.
- Ratings must be between `0` and `10`.
- `favoriteCharacter` may be left blank.
- Use `true` or `false` for `featured` and `favorite`.
- Quote fields containing commas or double quotes. Inside quoted values,
  represent a double quote as `""`.

Preview the import without changing archive data:

```bash
npm run import:manhwa -- --dry-run
```

Import new rows and update existing rows:

```bash
npm run import:manhwa
```

The importer generates slugs from titles, sets the category to `Manhwa`, and
creates `/images/manhwa/{slug}.jpg` cover paths for new entries. It leaves
genres, descriptions, and covers for the metadata fetcher.

Entries are matched by slug. Existing entries are updated from the CSV for
status, rating, favorite character, featured, and favorite while
their existing metadata is preserved. Rows that repeat an earlier slug in the
same CSV are skipped.

After importing, fetch metadata and covers:

```bash
npm run fetch:metadata
```

## Importing Many Anime Entries

Fill out `data/imports/anime-import.csv` using these columns:

```csv
title,status,rating,favoriteCharacter,featured,favorite
```

Example:

```csv
"Frieren: Beyond Journey's End","Currently Watching",9,"Frieren",true,true
"Vinland Saga",Completed,10,"Thorfinn",true,true
"Monster",Planned,0,"Johan Liebert",false,false
```

Rules:

- Keep the header unchanged.
- Valid Anime statuses are `Planned`, `Currently Watching`, `Completed`,
  `On Hold`, and `Dropped`.
- Ratings must be between `0` and `10`. Use `0` for unrated entries.
- `favoriteCharacter` may be left blank.
- Use `true` or `false` for `featured` and `favorite`.
- Quote fields containing commas or double quotes. Inside quoted values,
  represent a double quote as `""`.

Preview the import without changing archive data:

```bash
npm run import:anime -- --dry-run
```

Import new rows and update existing Anime entries:

```bash
npm run import:anime
```

The importer generates slugs from titles, sets the category to `Anime`, and
creates `/images/anime/{slug}.jpg` cover paths for new entries. Existing Anime
entries are matched by slug and updated only for status, rating, favorite
character, featured, and favorite. Existing covers, genres, descriptions,
release years, and formats are preserved.

After importing, fetch AniList metadata and covers:

```bash
npm run fetch:metadata
```

AniList supplies Anime cover images, genres, descriptions, release years,
formats, and source statuses when those values are available.

## Importing Many Web Novel Entries

Fill out `data/imports/webnovel-import.csv` using these columns:

```csv
title,status,rating,favoriteCharacter,featured,favorite
```

Example:

```csv
"Example Web Novel","Currently Reading",9,"Character Name",true,true
"Another Web Novel",Planned,0,,false,false
```

Rules:

- Keep the header unchanged.
- Valid statuses are `Planned`, `Currently Reading`, `Completed`, `On Hold`,
  and `Dropped`.
- Ratings must be between `0` and `10`. Use `0` for unrated entries.
- `favoriteCharacter` may be left blank.
- Use `true` or `false` for `featured` and `favorite`.
- Quote fields containing commas or double quotes. Inside quoted values,
  represent a double quote as `""`.

Preview the import without changing archive data:

```bash
npm run import:webnovels -- --dry-run
```

Import new rows and update existing Web Novel entries:

```bash
npm run import:webnovels
```

The importer generates slugs from titles, stores the canonical category as
`Web Novel`, and creates `/web-novels/{slug}` detail routes. Existing entries
are matched by category and slug, then updated only for title, status, rating,
favorite character, featured, and favorite.

Place covers in `public/images/web-novels/` using the generated slug. The
importer recognizes `.jpg`, `.png`, and `.webp` files that already exist. If no
cover exists, it uses `/images/web-novels/{slug}.jpg` so the site clearly shows
the missing-cover state.

The metadata fetcher searches each configured Web Novel source in order using
exact titles, synonyms, and a small alias map for known alternate titles. It
merges missing metadata while keeping the first trustworthy cover, logs the
source used for each downloaded cover, and leaves unmatched titles in the
missing-cover state. Creator credits usually identify the original author,
while release year and source status may describe a matched adaptation.

For difficult Web Novel matches, the fetcher can use author hints and tries
`"<title> web novel cover"`, `"<title> novel cover"`, and
`"<title> <author> cover"` in the optional image-search fallback. Trusted
catalog cover matches may be recorded for titles whose official editions are
not discoverable through the general APIs.

## Updating Existing Entries

For CSV-managed entries, edit personal fields in the owning CSV and run
`npm run archive:update`. Direct changes to CSV-managed personal fields in
`archiveItems.ts` may be replaced by the next import. To refresh missing source
metadata or download a missing cover, run the metadata fetch workflow.

Entries maintained directly in `archiveItems.ts` remain manual and protected
as long as they do not have an `importSource` field.

## Future Multi-User Plan

The archive remains a single personal archive today. No account, database,
authentication, upload, profile, or social behavior is currently implemented.
The optional fields below prepare the data contract for a later migration
without changing current behavior:

- `ownerId`: Stable ID of the user or archive that owns the entry.
- `createdBy`: Stable ID of the user, importer, or collaborator that originally
  created the entry. It may differ from `ownerId`.
- `visibility`: `"public"`, `"private"`, or `"unlisted"`.

When these fields are omitted, the entry belongs to the current default
personal archive and remains visible exactly as it is today. Import scripts
preserve existing optional ownership fields when updating entries, and the
metadata fetcher treats them as protected personal data.

### Suggested Migration Shape

When accounts are eventually introduced:

1. Move archive items into a database and give every item a database-generated
   globally unique ID. Keep `slug` for readable URLs.
2. Backfill existing entries with one owner ID representing the current
   personal archive and set their visibility to `public`.
3. Scope entry uniqueness by owner, category, and slug. Two users should be
   allowed to archive the same title independently.
4. Apply visibility checks in the server-side data access layer before results
   reach pages, search, statistics, related entries, or random discovery.
5. Consider routes such as `/users/[handle]/manga/[slug]` while preserving the
   current category routes for the default archive.

### User-Created Entries

User-created entries should reuse the `ArchiveItem` shape, set `ownerId` and
`createdBy` from the authenticated server session, and default to a deliberate
visibility policy. Do not trust ownership or visibility values submitted
directly by a client.

Metadata and cover fetching should run as a background job after entry
creation. User-authored fields such as ratings, notes, favorites, ownership,
and visibility should remain protected from metadata updates.

### Likes, Favorites, and Comments

Keep social interactions in separate records instead of adding growing arrays
to `ArchiveItem`:

```ts
type ArchiveLike = {
  itemId: string;
  userId: string;
  createdAt: string;
};

type ArchiveComment = {
  id: string;
  itemId: string;
  userId: string;
  body: string;
  createdAt: string;
};
```

The current `favorite` boolean is the archive owner's personal favorite flag.
It should remain separate from future community likes. Comments should support
moderation and authorization checks before becoming public.
