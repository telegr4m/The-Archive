# The Archive

A data-driven personal archive for manga, manhwa, anime, web novels, and
books. Built with Next.js, TypeScript, Tailwind CSS, and GSAP.

The project includes category pages, global search, entry detail pages,
featured and favorite entries, archive statistics, metadata fetching, CSV
imports, backups, and a local maintenance dashboard.

## Requirements

- Node.js 20 or newer
- npm

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Before deploying, verify the project:

```bash
npm run lint
npm run build
```

## Personalizing The Archive

This repository keeps the current archive data intact so the original site
continues to work. Forks should replace that content with their own collection.

1. Review the example files in `data/imports/examples/`.
2. Replace the rows in the five active CSV files inside `data/imports/`.
3. Remove any entries from `app/data/archiveItems.ts` that you do not want.
4. Remove or replace the matching covers in `public/images/`.
5. Run `npm run archive:update`.
6. Restart `npm run dev`.

The active import CSVs are the source of truth for imported entries:

```text
data/imports/manga-import.csv
data/imports/manhwa-import.csv
data/imports/anime-import.csv
data/imports/webnovel-import.csv
data/imports/book-import.csv
```

The example CSVs are documentation only. Import scripts do not read them.

```text
data/imports/examples/example-manga-import.csv
data/imports/examples/example-manhwa-import.csv
data/imports/examples/example-anime-import.csv
data/imports/examples/example-webnovel-import.csv
data/imports/examples/example-book-import.csv
```

## CSV Imports

Manga, Manhwa, Anime, and Web Novels use:

```csv
title,status,rating,favoriteCharacter,featured,favorite
```

Books use:

```csv
title,status,rating,featured,favorite
```

Run the complete import, source audit, and metadata workflow:

```bash
npm run archive:update
```

Or run an individual importer:

```bash
npm run import:manga
npm run import:manhwa
npm run import:anime
npm run import:webnovels
npm run import:books
npm run fetch:metadata
```

Metadata fetching uses public provider APIs. An optional Brave Image Search
fallback can be enabled by setting `BRAVE_SEARCH_API_KEY` in a local `.env`
file:

```bash
copy .env.example .env.local
```

On macOS or Linux, use `cp .env.example .env.local`. Add your own key to
`.env.local`; never commit API keys.

See [ARCHIVE_GUIDE.md](ARCHIVE_GUIDE.md) for detailed schemas, statuses,
metadata behavior, image folders, and maintenance workflows.

## Covers

Cover filenames are generated from entry slugs and stored by category:

```text
public/images/manga/
public/images/manhwa/
public/images/anime/
public/images/web-novels/
public/images/books/
```

Only publish images you have permission to use. Missing images remain visible
as explicit missing-cover states.

## Backup And Restore

Create JSON and CSV backups:

```bash
npm run archive:export
```

Backups are written to `archive-backups/`, which is ignored by git because
archive snapshots may contain personal preferences.

Restore `app/data/archiveItems.ts` from the JSON backup:

```bash
npm run archive:restore
```

The restore command validates the backup and creates a timestamped safety copy
before replacing archive data. It does not modify CSV files or cover images.

## Local Health Dashboard

The diagnostic dashboard is available during development at:

```text
http://localhost:3000/admin/health
```

It is not an editor and is intentionally not linked in the Navbar or Footer.
In production, including Vercel deployments, `/admin/health` returns `404`.

## Deployment

The site can be deployed to Vercel or any platform that supports Next.js.

1. Keep secrets in the deployment platform's environment-variable settings.
2. Run `npm run build`.
3. Confirm the production `/admin/health` route returns `404`.
4. Review personal archive data and image usage rights before making a fork
   public.

## Template Safety

- `.env*`, build output, local backups, and local logs are git-ignored.
- API keys are read from environment variables only.
- Import examples are separated from active import files.
- The health dashboard is development-only.
- No authentication or database is included.

## License

Source code is available under the [MIT License](LICENSE). Archive metadata,
personal notes, and cover images may have separate ownership or usage rights.
