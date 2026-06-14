import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import {
  archiveItems,
  type ArchiveCategory,
  type ArchiveItem,
} from "../app/data/archiveItems";
import webNovelFallbacks from "../data/metadata/web-novel-fallbacks.json";
import { findReusableArchiveImage } from "./lib/archiveImages";
import { cleanGenres } from "./lib/archiveMetadata";
import {
  getMetadataFingerprint,
  getWebNovelMetadataStatus,
} from "./lib/metadataRetry";

const ROOT = process.cwd();
const ARCHIVE_FILE = path.join(ROOT, "app", "data", "archiveItems.ts");
const DRY_RUN = process.argv.includes("--dry-run");
const REFRESH_SLUGS = new Set(
  process.argv
    .filter((argument) => argument.startsWith("--refresh="))
    .flatMap((argument) => argument.slice("--refresh=".length).split(","))
    .filter(Boolean)
);
const PROTECTED_FIELDS = new Set([
  "favoriteCharacter",
  "rating",
  "recommendLevel",
  "favorite",
  "featured",
  "ownerId",
  "visibility",
  "createdBy",
]);
const FORCE_CROSS_CATEGORY_IMAGE_REUSE = new Set(["Manga:monster"]);
const METADATA_ALIASES: Record<string, string[]> = {
  monster: ["Monster Naoki Urasawa", "Monster manga Naoki Urasawa"],
  "mother-of-learning": [
    "Mother of Learning web novel",
    "Mother of Learning nobody103",
    "Mother of Learning Domagoj Kurmaic",
  ],
};

type Metadata = {
  coverUrl?: string;
  genres?: string[];
  description?: string;
  releaseYear?: number;
  formatLabel?: string;
  creator?: string;
  studio?: string;
  sourceStatus?: string;
  provider?: string;
  matchedTitle?: string;
  descriptionProvider?: string;
  releaseYearProvider?: string;
};

type CachedWebNovelMetadata = Metadata & {
  sourceUrl: string;
};

type Edit = {
  start: number;
  end: number;
  text: string;
};

type Summary = {
  updated: string[];
  skipped: string[];
  notFound: string[];
  failed: string[];
};

const summary: Summary = {
  updated: [],
  skipped: [],
  notFound: [],
  failed: [],
};
let brokenImagePathsCleared = 0;

async function main() {
  console.log(`Archive metadata fetch${DRY_RUN ? " (dry run)" : ""}`);
  console.log(
    "Sources: AniList GraphQL, Open Library, Google Books, MangaDex, Wikimedia, and optional Brave Image Search"
  );
  console.log("Web Novels: ordered metadata and cover fallback search\n");

  const sourceText = await readFile(ARCHIVE_FILE, "utf8");
  const sourceFile = ts.createSourceFile(
    ARCHIVE_FILE,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );
  const objectsBySlug = findArchiveObjects(sourceFile);
  const edits: Edit[] = [];

  for (const item of archiveItems) {
    try {
      const refresh = REFRESH_SLUGS.has(item.slug);
      const canonicalImage = getCanonicalImagePath(item);
      const currentImageValid = Boolean(item.image) && existsSync(publicPath(item.image));
      const canonicalImageValid = existsSync(publicPath(canonicalImage));
      const reusableImage = findReusableArchiveImage(
        item,
        archiveItems,
        (image) => existsSync(publicPath(image))
      );
      const preferReusableImage =
        Boolean(reusableImage) &&
        (!currentImageValid ||
          FORCE_CROSS_CATEGORY_IMAGE_REUSE.has(archiveItemKey(item.category, item.slug)));
      const resolvedExistingImage = preferReusableImage
        ? reusableImage?.image
        : currentImageValid
          ? item.image
          : canonicalImageValid
            ? canonicalImage
            : undefined;
      const imageNeedsEdit = item.image !== (resolvedExistingImage ?? "");
      const coverMissing = !resolvedExistingImage;
      const fieldsNeeded = refresh ? ["provider metadata"] : getMissingFields(item);
      const metadataFingerprint = getMetadataFingerprint(item);
      const object = objectsBySlug.get(archiveItemKey(item.category, item.slug));

      if (!object) {
        throw new Error(`Could not find source object for slug "${item.slug}"`);
      }

      if (hasIntentionallyUnverifiedWebNovelYear(item)) {
        log(
          "UNCERTAIN METADATA",
          item.title,
          "trusted sources do not confirm the original serialization year; leaving it blank"
        );
      }

      if (
        item.category === "Web Novel" &&
        !refresh &&
        !coverMissing &&
        !imageNeedsEdit
      ) {
        const cachedStatus = getWebNovelMetadataStatus(
          item,
          fieldsNeeded,
          hasIntentionallyUnverifiedWebNovelYear(item)
        );
        const cacheMatches =
          item.metadataStatus &&
          item.metadataFingerprint === metadataFingerprint;

        if (
          cacheMatches &&
          item.metadataStatus === cachedStatus.status &&
          item.metadataStatus !== "complete"
        ) {
          summary.skipped.push(item.title);
          log("SKIP PARTIAL", item.title, cachedStatus.reason);
          continue;
        }

        if (!item.metadataStatus && cachedStatus.status) {
          queuePropertyEdit(
            sourceText,
            object,
            "metadataStatus",
            cachedStatus.status,
            edits
          );
          queuePropertyEdit(
            sourceText,
            object,
            "metadataFingerprint",
            metadataFingerprint,
            edits
          );
          summary.updated.push(item.title);
          log("CACHE METADATA", item.title, `${cachedStatus.status}: ${cachedStatus.reason}`);
          continue;
        }
      }

      if (!coverMissing && fieldsNeeded.length === 0 && !imageNeedsEdit) {
        summary.skipped.push(item.title);
        log("SKIP", item.title, "metadata and cover already present");
        continue;
      }

      let metadata: Metadata = {};
      if (coverMissing || fieldsNeeded.length > 0) {
        const fetchedMetadata = await fetchMetadata(item);
        if (fetchedMetadata) {
          metadata = fetchedMetadata;
        } else {
          summary.notFound.push(item.title);
          log(
            item.category === "Web Novel" ? "NO METADATA FOUND" : "NOT FOUND",
            item.title,
            providerFor(item.category)
          );
        }
      }

      if (item.category === "Web Novel" && hasMetadata(metadata)) {
        log(
          "FOUND METADATA",
          item.title,
          `${metadata.provider ?? "AniList"} matched "${metadata.matchedTitle ?? item.title}"`
        );
      }

      const updates = buildUpdates(
        item,
        metadata,
        refresh
      );

      if (preferReusableImage && reusableImage) {
        updates.image = reusableImage.image;
        log(
          "REUSE IMAGE",
          item.title,
          `reused image from ${reusableImage.category} entry`
        );
      } else if (imageNeedsEdit && resolvedExistingImage) {
        updates.image = resolvedExistingImage;
        log("RESTORE IMAGE PATH", item.title, resolvedExistingImage);
      }

      if (coverMissing && metadata.coverUrl) {
        if (item.category === "Web Novel") {
          log(
            "COVER SOURCE",
            item.title,
            metadata.provider ?? "unknown provider"
          );
        }
        if (DRY_RUN) {
          log("COVER", item.title, `would download ${canonicalImage}`);
          updates.image = canonicalImage;
        } else {
          try {
            const savedImage = await downloadCover(metadata.coverUrl, canonicalImage);
            if (!existsSync(publicPath(savedImage))) {
              throw new Error("download completed but the cover file is missing");
            }
            updates.image = savedImage;
            log(
              item.category === "Web Novel" ? "DOWNLOADED COVER" : "COVER",
              item.title,
              `downloaded ${savedImage}`
            );
          } catch (error) {
            updates.image = "";
            log("COVER DOWNLOAD FAILED", item.title, errorMessage(error));
          }
        }
      } else if (coverMissing && imageNeedsEdit) {
        updates.image = "";
        brokenImagePathsCleared++;
        log("CLEAR BROKEN IMAGE", item.title, item.image || "empty image path");
      }

      if (item.category === "Web Novel") {
        const projectedItem = { ...item, ...updates } as ArchiveItem;
        const projectedFields = getMissingFields(projectedItem);
        const cachedStatus = getWebNovelMetadataStatus(
          projectedItem,
          projectedFields,
          hasIntentionallyUnverifiedWebNovelYear(projectedItem)
        );
        if (cachedStatus.status) {
          updates.metadataStatus = cachedStatus.status;
          updates.metadataFingerprint = getMetadataFingerprint(projectedItem);
        }
      }

      for (const [field, value] of Object.entries(updates)) {
        if (PROTECTED_FIELDS.has(field)) continue;
        queuePropertyEdit(sourceText, object, field, value, edits);
      }

      if (Object.keys(updates).length > 0) {
        summary.updated.push(item.title);
        log(
          DRY_RUN ? "PREVIEW" : "UPDATED",
          item.title,
          Object.keys(updates).length > 0
            ? Object.keys(updates).join(", ")
            : "cover only"
        );
      } else {
        summary.skipped.push(item.title);
        log("SKIP", item.title, "provider returned no missing fields");
      }
    } catch (error) {
      summary.failed.push(item.title);
      log("ERROR", item.title, errorMessage(error));
    }
  }

  if (edits.length > 0) {
    const nextSource = applyEdits(sourceText, edits);

    if (DRY_RUN) {
      console.log(`\nWould update ${edits.length} source field(s).`);
    } else {
      await writeFile(ARCHIVE_FILE, nextSource, "utf8");
      console.log(`\nUpdated ${edits.length} source field(s) in archiveItems.ts.`);
    }
  }

  console.log(
    `\nImage path validation complete: ${brokenImagePathsCleared} broken path(s) cleared.`
  );
  printSummary(summary);
}

function getMissingFields(item: ArchiveItem) {
  const fields: string[] = [];

  if (item.genres.length === 0) fields.push("genres");
  if (!item.description.trim()) fields.push("description");
  if (!item.releaseYear && !hasIntentionallyUnverifiedWebNovelYear(item)) {
    fields.push("releaseYear");
  }
  if (!item.formatLabel) fields.push("formatLabel");
  if (!item.creator) fields.push("creator");
  if (item.category === "Anime" && !item.studio) fields.push("studio");
  if (!item.sourceStatus) fields.push("sourceStatus");

  return fields;
}

function hasIntentionallyUnverifiedWebNovelYear(item: ArchiveItem) {
  if (item.category !== "Web Novel" || item.releaseYear) return false;

  const cached = (
    webNovelFallbacks as Record<string, CachedWebNovelMetadata | undefined>
  )[item.slug];

  return Boolean(cached && !cached.releaseYear);
}


function buildUpdates(
  item: ArchiveItem,
  metadata: Metadata,
  refresh = false
) {
  const updates: Record<string, unknown> = {};

  if ((refresh || item.genres.length === 0) && metadata.genres?.length) {
    updates.genres = cleanGenres(metadata.genres);
  }
  if ((refresh || !item.description.trim()) && metadata.description) {
    updates.description = metadata.description;
  }
  if ((refresh || !item.releaseYear) && metadata.releaseYear) {
    updates.releaseYear = metadata.releaseYear;
  }
  if ((refresh || !item.formatLabel) && metadata.formatLabel) {
    updates.formatLabel =
      item.category === "Manhwa" ? "Manhwa" : metadata.formatLabel;
  }
  if ((refresh || !item.creator) && metadata.creator) {
    updates.creator = metadata.creator;
  }
  if ((refresh || !item.studio) && metadata.studio) {
    updates.studio = metadata.studio;
  }
  if ((refresh || !item.sourceStatus) && metadata.sourceStatus) {
    updates.sourceStatus = metadata.sourceStatus;
  }

  return updates;
}

async function fetchMetadata(item: ArchiveItem): Promise<Metadata | null> {
  if (item.category === "Web Novel") {
    return fetchWebNovelMetadata(item);
  }

  if (item.category === "Manhwa") {
    for (const searchTitle of getMetadataSearchTitles(item)) {
      try {
        const aniListMetadata = await fetchAniListMetadata(
          item,
          undefined,
          searchTitle
        );

        if (aniListMetadata) {
          return aniListMetadata;
        }
      } catch (error) {
        log(
          "FALLBACK",
          item.title,
          `AniList unavailable: ${errorMessage(error)}; trying MangaDex API`
        );
        return fetchMangaDexMetadata(item, searchTitle);
      }
    }

    log("FALLBACK", item.title, "AniList miss; trying MangaDex API");
    for (const searchTitle of getMetadataSearchTitles(item)) {
      const metadata = await fetchMangaDexMetadata(item, searchTitle);
      if (metadata) return metadata;
    }
    return null;
  }

  if (["Anime", "Manga"].includes(item.category)) {
    for (const searchTitle of getMetadataSearchTitles(item)) {
      const metadata = await fetchAniListMetadata(item, undefined, searchTitle);
      if (metadata) return metadata;
    }
    return null;
  }

  if (item.category === "Book") {
    return fetchBookMetadata(item);
  }

  return null;
}

async function fetchBookMetadata(item: ArchiveItem): Promise<Metadata | null> {
  let combined: Metadata = {};

  combined = mergeMetadata(
    combined,
    await tryProvider(item, "Open Library", () =>
      fetchOpenLibraryMetadata(item, item.title, false, item.creator)
    )
  );
  combined = mergeMetadata(
    combined,
    await tryProvider(item, "Google Books", () => fetchGoogleBooksMetadata(item))
  );
  combined = mergeMetadata(
    combined,
    await tryProvider(item, "Wikipedia", () =>
      fetchWikipediaMetadata(item.title, "book", "Book")
    )
  );

  return hasMetadata(combined) ? combined : null;
}

async function fetchWebNovelMetadata(item: ArchiveItem): Promise<Metadata | null> {
  const searchTitles = getWebNovelSearchTitles(item);
  const authorHint = getWebNovelAuthorHint(item);
  let combined: Metadata = {};

  console.log("\n[WEB NOVEL]");
  console.log(`Searching: ${item.title}`);
  console.log(`Queries: ${searchTitles.join(" | ")}`);

  // Each source gets every known title before the next source is attempted.
  for (const searchTitle of searchTitles) {
    for (const mediaType of ["MANGA", "ANIME"] as const) {
      combined = mergeMetadata(
        combined,
        await tryProvider(item, "AniList", async () => {
          const metadata = await fetchAniListMetadata(item, mediaType, searchTitle);
          return metadata
            ? webNovelAdaptationCoverOnly(
                item,
                metadata,
                `AniList ${mediaType === "MANGA" ? "manga" : "anime"} adaptation`
              )
            : null;
        })
      );
    }
  }

  for (const searchTitle of searchTitles) {
    combined = mergeMetadata(
      combined,
      await tryProvider(item, "Open Library", () =>
        fetchWebNovelEditionMetadata(
          item,
          fetchOpenLibraryMetadata(item, searchTitle, true, authorHint),
          "Open Library"
        )
      )
    );
  }

  for (const searchTitle of searchTitles) {
    combined = mergeMetadata(
      combined,
      await tryProvider(item, "Google Books", () =>
        fetchWebNovelEditionMetadata(
          item,
          fetchGoogleBooksMetadata(item, searchTitle, true),
          "Google Books"
        )
      )
    );
  }

  for (const searchTitle of searchTitles) {
    combined = mergeMetadata(
      combined,
      await tryProvider(item, "MangaDex", async () => {
        const metadata = await fetchMangaDexMetadata(item, searchTitle);
        return metadata
          ? webNovelAdaptationCoverOnly(item, metadata, "MangaDex adaptation")
          : null;
      })
    );
  }

  for (const searchTitle of searchTitles) {
    combined = mergeMetadata(
      combined,
      await tryProvider(item, "Wikipedia/Wikidata", () =>
        fetchWikimediaMetadata(item, searchTitle)
      )
    );
  }

  const cachedMetadata = getCachedWebNovelMetadata(item);
  if (cachedMetadata) {
    // Series-level cache values outrank adaptation and physical-edition dates.
    combined = mergeMetadata(cachedMetadata, combined);
  }

  if (!combined.coverUrl) {
    combined = mergeMetadata(combined, getTrustedWebNovelCover(item));
  }

  if (!combined.coverUrl) {
    for (const searchQuery of getWebNovelImageSearchQueries(item)) {
      combined = mergeMetadata(
        combined,
        await tryProvider(item, "image search", () =>
          fetchImageSearchCover(item, searchQuery)
        )
      );
    }
  }

  console.log(
    `Matched: ${combined.matchedTitle ?? "none"} (${combined.provider ?? "no source"})`
  );
  console.log(
    `Description found: ${combined.description ? `yes (${combined.descriptionProvider ?? "unknown source"})` : "no"}`
  );
  console.log(
    `Release year found: ${combined.releaseYear ? `yes (${combined.releaseYearProvider ?? "unknown source"})` : "no"}`
  );

  return hasMetadata(combined) ? combined : null;
}

function webNovelAdaptationCoverOnly(
  item: ArchiveItem,
  metadata: Metadata,
  provider: string
): Metadata {
  log(
    "UNCERTAIN METADATA",
    item.title,
    `${provider} matched an adaptation; ignoring its description, creator, status, and release year`
  );

  return {
    coverUrl: metadata.coverUrl,
    formatLabel: "Web Novel",
    provider,
    matchedTitle: metadata.matchedTitle,
  };
}

async function fetchWebNovelEditionMetadata(
  item: ArchiveItem,
  metadataPromise: Promise<Metadata | null>,
  provider: string
) {
  const metadata = await metadataPromise;
  if (!metadata) return null;

  if (metadata.releaseYear) {
    log(
      "UNCERTAIN METADATA",
      item.title,
      `${provider} returned edition year ${metadata.releaseYear}; ignoring it as the original serialization year`
    );
  }

  return {
    ...metadata,
    releaseYear: undefined,
    sourceStatus: undefined,
  };
}

function mergeMetadata(current: Metadata, next: Metadata | null): Metadata {
  if (!next) return current;

  return {
    coverUrl: current.coverUrl ?? next.coverUrl,
    genres: current.genres?.length ? current.genres : next.genres,
    description: current.description ?? next.description,
    releaseYear: current.releaseYear ?? next.releaseYear,
    formatLabel: current.formatLabel ?? next.formatLabel,
    creator: current.creator ?? next.creator,
    studio: current.studio ?? next.studio,
    sourceStatus: current.sourceStatus ?? next.sourceStatus,
    provider: current.coverUrl ? current.provider : next.provider ?? current.provider,
    matchedTitle: current.matchedTitle ?? next.matchedTitle,
    descriptionProvider:
      current.descriptionProvider ?? next.descriptionProvider,
    releaseYearProvider:
      current.releaseYearProvider ?? next.releaseYearProvider,
  };
}

function hasMetadata(metadata: Metadata) {
  return Object.values(metadata).some((value) =>
    Array.isArray(value) ? value.length > 0 : Boolean(value)
  );
}

async function tryProvider(
  item: ArchiveItem,
  provider: string,
  fetcher: () => Promise<Metadata | null>
) {
  try {
    const metadata = await fetcher();

    if (metadata) {
      const source = metadata.provider ?? provider;
      const sourcedMetadata: Metadata = {
        ...metadata,
        descriptionProvider:
          metadata.descriptionProvider ?? (metadata.description ? source : undefined),
        releaseYearProvider:
          metadata.releaseYearProvider ?? (metadata.releaseYear ? source : undefined),
      };
      log(
        metadata.coverUrl ? "FOUND COVER" : "FOUND METADATA",
        item.title,
        `${source}${metadata.matchedTitle ? ` matched "${metadata.matchedTitle}"` : ""}`
      );
      return sourcedMetadata;
    }

    return null;
  } catch (error) {
    log("SOURCE ERROR", item.title, `${provider}: ${errorMessage(error)}`);
    return null;
  }
}

async function fetchAniListMetadata(
  item: ArchiveItem,
  mediaType?: "MANGA" | "ANIME",
  searchTitle = item.title
): Promise<Metadata | null> {
  const query = `
    query ($search: String!, $type: MediaType!) {
      Page(page: 1, perPage: 10) {
        media(search: $search, type: $type, sort: SEARCH_MATCH) {
          title { romaji english }
          synonyms
          countryOfOrigin
          coverImage { extraLarge large }
          genres
          description(asHtml: false)
          startDate { year }
          format
          status
          staff(perPage: 25, sort: RELEVANCE) {
            edges {
              role
              node { name { full } }
            }
          }
          studios(isMain: true) {
            nodes { name isAnimationStudio }
          }
        }
      }
    }
  `;
  const response = await fetchWithRetry("https://graphql.anilist.co", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query,
      variables: {
        search: searchTitle,
        type: mediaType ?? (item.category === "Anime" ? "ANIME" : "MANGA"),
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`AniList returned HTTP ${response.status}`);
  }

  const payload = (await response.json()) as {
    data?: {
      Page?: {
        media?: {
          title?: { romaji?: string; english?: string };
          synonyms?: string[];
          countryOfOrigin?: string;
          coverImage?: { extraLarge?: string; large?: string };
          genres?: string[];
          description?: string;
          startDate?: { year?: number };
          format?: string;
          status?: string;
          staff?: {
            edges?: {
              role?: string;
              node?: { name?: { full?: string } };
            }[];
          };
          studios?: {
            nodes?: { name?: string; isAnimationStudio?: boolean }[];
          };
        }[];
      };
    };
  };
  const results = payload.data?.Page?.media ?? [];
  const acceptableResults =
    item.category === "Anime"
      ? results
      : results.filter((candidate) => candidate.format !== "NOVEL");
  const normalizedTitle = normalize(
    item.category === "Web Novel" ? item.title : searchTitle
  );
  const rankedResults = [...acceptableResults].sort(
    (a, b) =>
      scoreAniListResult(b, normalizedTitle, item.category) -
      scoreAniListResult(a, normalizedTitle, item.category)
  );
  const media =
    scoreAniListResult(rankedResults[0] ?? {}, normalizedTitle, item.category) >=
    (item.category === "Web Novel" ? 80 : 40)
      ? rankedResults[0]
      : undefined;

  if (!media) return null;

  const studio = getAniListStudio(media.studios?.nodes);
  const creator = getAniListCreator(media.staff?.edges) ?? studio;

  return {
    coverUrl: media.coverImage?.extraLarge ?? media.coverImage?.large,
    genres: media.genres,
    description: cleanDescription(media.description),
    releaseYear: media.startDate?.year,
    formatLabel: humanize(media.format),
    creator,
    studio: item.category === "Anime" ? studio : undefined,
    sourceStatus: humanize(media.status),
    matchedTitle: media.title?.english ?? media.title?.romaji,
  };
}

function getWebNovelSearchTitles(item: ArchiveItem) {
  const webNovelAliases: Record<string, string[]> = {
    "omniscient-reader-s-viewpoint": ["Omniscient Reader"],
    "renegade-immortal": ["Xian Ni"],
    "a-regressor-s-tale-of-cultivation": ["Hoegwisuseonjeon"],
  };

  const authorHint = getWebNovelAuthorHint(item);
  return [
    item.title,
    ...(METADATA_ALIASES[item.slug] ?? []),
    ...(webNovelAliases[item.slug] ?? []),
    `${item.title} web novel`,
    authorHint ? `${item.title} ${authorHint}` : undefined,
  ].filter(
    (title, index, titles): title is string =>
      Boolean(title) && titles.indexOf(title) === index
  );
}

function getWebNovelAuthorHint(item: ArchiveItem) {
  const authors: Record<string, string> = {
    "shadow-slave": "Guiltythree",
    "kill-the-sun": "Warmaisach",
    "mother-of-learning": "Domagoj Kurmaic",
  };

  return authors[item.slug] ?? item.creator;
}

function getWebNovelImageSearchQueries(item: ArchiveItem) {
  const authorHint = getWebNovelAuthorHint(item);

  return [
    `${item.title} web novel cover`,
    `${item.title} novel cover`,
    authorHint ? `${item.title} ${authorHint} cover` : undefined,
  ].filter((query): query is string => Boolean(query));
}

function getTrustedWebNovelCover(item: ArchiveItem): Metadata | null {
  const covers: Record<string, Metadata> = {
    "shadow-slave": {
      coverUrl: "https://covers.openlibrary.org/b/id/15173101-L.jpg",
      creator: "Guiltythree",
      formatLabel: "Web Novel",
      provider: "Open Library author match",
      matchedTitle: "Shadow Slave, Book 1",
    },
    "kill-the-sun": {
      coverUrl:
        "https://images-na.ssl-images-amazon.com/images/P/B0DB9D1Q3W.01.LZZZZZZZ.jpg",
      creator: "Warmaisach",
      formatLabel: "Web Novel",
      provider: "Amazon Books author match",
      matchedTitle: "Kill the Sun: Book 1",
    },
    "mother-of-learning": {
      coverUrl:
        "https://books.google.com/books/content?id=uj1UEAAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api",
      creator: "Domagoj Kurmaic",
      formatLabel: "Web Novel",
      provider: "Google Books verified edition",
      matchedTitle: "Mother of Learning: ARC 1",
    },
  };
  const metadata = covers[item.slug];

  if (metadata) {
    log(
      "FOUND COVER",
      item.title,
      `${metadata.provider} matched "${metadata.matchedTitle}"`
    );
  }

  return metadata ?? null;
}

function getCachedWebNovelMetadata(item: ArchiveItem): Metadata | null {
  const cached = (
    webNovelFallbacks as Record<string, CachedWebNovelMetadata | undefined>
  )[item.slug];

  if (!cached) return null;

  log(
    "FOUND METADATA",
    item.title,
    `${cached.provider} matched "${cached.matchedTitle ?? item.title}"`
  );

  return {
    description: cached.description,
    releaseYear: cached.releaseYear,
    creator: cached.creator,
    formatLabel: cached.formatLabel,
    sourceStatus: cached.sourceStatus,
    provider: cached.provider,
    matchedTitle: cached.matchedTitle,
    descriptionProvider: cached.provider,
    releaseYearProvider: cached.provider,
  };
}

function getAniListCreator(
  edges?: {
    role?: string;
    node?: { name?: { full?: string } };
  }[]
) {
  const rolePriorities = [
    /original creator/i,
    /original story/i,
    /story/i,
    /original character design/i,
    /art/i,
  ];

  for (const rolePattern of rolePriorities) {
    const creators = (edges ?? [])
      .filter(({ role }) => rolePattern.test(role ?? ""))
      .map(({ node }) => node?.name?.full)
      .filter((name): name is string => Boolean(name));

    if (creators.length > 0) return [...new Set(creators)].join(", ");
  }

  return undefined;
}

function getAniListStudio(
  studios?: { name?: string; isAnimationStudio?: boolean }[]
) {
  const animationStudio = studios?.find((studio) => studio.isAnimationStudio);
  return animationStudio?.name ?? studios?.[0]?.name;
}

async function fetchMangaDexMetadata(
  item: ArchiveItem,
  searchTitle = item.title
): Promise<Metadata | null> {
  const url = new URL("https://api.mangadex.org/manga");
  url.searchParams.set("title", searchTitle);
  url.searchParams.set("limit", "10");
  url.searchParams.append("includes[]", "cover_art");
  url.searchParams.append("includes[]", "author");
  url.searchParams.append("includes[]", "artist");

  const response = await fetchWithRetry(url);

  if (!response.ok) {
    throw new Error(`MangaDex returned HTTP ${response.status}`);
  }

  const payload = (await response.json()) as {
    data?: {
      id: string;
      attributes?: {
        title?: Record<string, string>;
        altTitles?: Record<string, string>[];
        description?: Record<string, string>;
        status?: string;
        year?: number;
        tags?: { attributes?: { name?: Record<string, string> } }[];
      };
      relationships?: {
        type?: string;
        attributes?: { fileName?: string; name?: string };
      }[];
    }[];
  };
  const normalizedTitle = normalize(item.title);
  const rankedResults = [...(payload.data ?? [])].sort(
    (a, b) =>
      scoreMangaDexResult(b, normalizedTitle) -
      scoreMangaDexResult(a, normalizedTitle)
  );
  const manga =
    scoreMangaDexResult(rankedResults[0] ?? {}, normalizedTitle) >=
    (item.category === "Web Novel" ? 100 : 40)
      ? rankedResults[0]
      : undefined;

  if (!manga) return null;

  const coverFileName = manga.relationships?.find(
    (relationship) => relationship.type === "cover_art"
  )?.attributes?.fileName;
  const description =
    manga.attributes?.description?.en ??
    Object.values(manga.attributes?.description ?? {})[0];
  const creator = [
    ...(manga.relationships ?? [])
      .filter((relationship) =>
        ["author", "artist"].includes(relationship.type ?? "")
      )
      .map((relationship) => relationship.attributes?.name)
      .filter((name): name is string => Boolean(name)),
  ];

  return {
    coverUrl: coverFileName
      ? `https://uploads.mangadex.org/covers/${manga.id}/${coverFileName}.512.jpg`
      : undefined,
    genres: manga.attributes?.tags
      ?.map((tag) => tag.attributes?.name?.en)
      .filter((genre): genre is string => Boolean(genre)),
    description: cleanDescription(description),
    releaseYear: manga.attributes?.year,
    formatLabel: "Manhwa",
    creator: [...new Set(creator)].join(", ") || undefined,
    sourceStatus: humanize(manga.attributes?.status),
    provider: "MangaDex",
    matchedTitle:
      Object.values(manga.attributes?.title ?? {})[0] ?? searchTitle,
  };
}

function scoreMangaDexResult(
  candidate: {
    attributes?: {
      title?: Record<string, string>;
      altTitles?: Record<string, string>[];
    };
  },
  normalizedTitle: string
) {
  const titles = [
    ...Object.values(candidate.attributes?.title ?? {}),
    ...(candidate.attributes?.altTitles ?? []).flatMap((title) =>
      Object.values(title)
    ),
  ].map(normalize);
  const exactMatch = titles.includes(normalizedTitle);
  const partialMatch = titles.some(
    (title) =>
      title.includes(normalizedTitle) || normalizedTitle.includes(title)
  );

  return exactMatch ? 100 : partialMatch ? 40 : 0;
}

async function fetchGoogleBooksMetadata(
  item: ArchiveItem,
  searchTitle = item.title,
  requireTitleMatch = false
): Promise<Metadata | null> {
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set(
    "q",
    requireTitleMatch
      ? `intitle:"${searchTitle}" "web novel"`
      : `intitle:${searchTitle}`
  );
  url.searchParams.set("maxResults", "5");
  url.searchParams.set("printType", "books");

  const response = await fetchWithRetry(url);

  if (!response.ok) {
    throw new Error(`Google Books returned HTTP ${response.status}`);
  }

  const payload = (await response.json()) as {
    items?: {
      volumeInfo?: {
        title?: string;
        description?: string;
        publishedDate?: string;
        categories?: string[];
        authors?: string[];
        printType?: string;
        imageLinks?: { extraLarge?: string; large?: string; thumbnail?: string };
      };
    }[];
  };
  const normalizeCatalogTitle =
    item.category === "Web Novel"
      ? normalizeWebNovelCatalogTitle
      : normalize;
  const normalizedTitle = normalizeCatalogTitle(
    item.category === "Web Novel" ? item.title : searchTitle
  );
  const exactVolume = payload.items?.find(
    ({ volumeInfo }) =>
      normalizeCatalogTitle(volumeInfo?.title ?? "") === normalizedTitle
  )?.volumeInfo;
  const partialVolume = payload.items?.find(({ volumeInfo }) =>
    titlesOverlap(
      normalizedTitle,
      normalizeCatalogTitle(volumeInfo?.title ?? "")
    )
  )?.volumeInfo;
  const volume = requireTitleMatch
    ? exactVolume
    : exactVolume ?? partialVolume ?? payload.items?.[0]?.volumeInfo;

  if (!volume) return null;

  return {
    coverUrl: secureUrl(
      volume.imageLinks?.extraLarge ??
        volume.imageLinks?.large ??
        volume.imageLinks?.thumbnail
    ),
    genres: volume.categories,
    description: cleanDescription(volume.description),
    releaseYear: parseYear(volume.publishedDate),
    formatLabel: volume.printType ? humanize(volume.printType) : "Book",
    creator: volume.authors?.join(", "),
    sourceStatus: "Published",
    provider: "Google Books",
    matchedTitle: volume.title,
  };
}

async function fetchOpenLibraryMetadata(
  item: ArchiveItem,
  searchTitle = item.title,
  requireTitleMatch = false,
  authorHint?: string
): Promise<Metadata | null> {
  const url = new URL("https://openlibrary.org/search.json");
  if (requireTitleMatch) {
    url.searchParams.set(
      "q",
      authorHint
        ? `title:"${searchTitle}" AND author:"${authorHint}"`
        : `title:"${searchTitle}" AND (subject:"web novel" OR subject:"light novel")`
    );
  } else if (authorHint) {
    url.searchParams.set(
      "q",
      `title:"${searchTitle}" AND author:"${authorHint}"`
    );
  } else {
    url.searchParams.set("q", `"${searchTitle}"`);
  }
  url.searchParams.set("limit", "5");
  url.searchParams.set(
    "fields",
    "title,first_publish_year,subject,cover_i,author_name"
  );

  const response = await fetchWithRetry(url, {
    headers: {
      "User-Agent": "TheArchiveMetadataFetcher/1.0",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Open Library returned HTTP ${response.status}`);
  }

  const payload = (await response.json()) as {
    docs?: {
      title?: string;
      first_publish_year?: number;
      subject?: string[];
      cover_i?: number;
      author_name?: string[];
    }[];
  };
  const normalizedTitle =
    item.category === "Web Novel"
      ? normalizeWebNovelCatalogTitle(item.title)
      : normalizeBookTitle(searchTitle);
  const exactBook = payload.docs?.find(
    (candidate) =>
      (item.category === "Web Novel"
        ? normalizeWebNovelCatalogTitle(candidate.title ?? "")
        : normalizeBookTitle(candidate.title ?? "")) === normalizedTitle &&
      authorMatches(candidate.author_name, authorHint)
  );
  const partialBook = payload.docs?.find(
    (candidate) =>
      titlesOverlap(
        normalizedTitle,
        item.category === "Web Novel"
          ? normalizeWebNovelCatalogTitle(candidate.title ?? "")
          : normalizeBookTitle(candidate.title ?? "")
      ) &&
      authorMatches(candidate.author_name, authorHint)
  );
  const book = requireTitleMatch
    ? exactBook
    : exactBook ?? partialBook ?? payload.docs?.[0];

  if (!book) return null;

  return {
    coverUrl: book.cover_i
      ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
      : undefined,
    genres: book.subject?.slice(0, 8),
    releaseYear: book.first_publish_year,
    formatLabel: "Book",
    creator: book.author_name?.join(", "),
    sourceStatus: "Published",
    provider: "Open Library",
    matchedTitle: book.title,
  };
}

async function fetchWikimediaMetadata(
  item: ArchiveItem,
  searchTitle: string
): Promise<Metadata | null> {
  const wikipedia = await fetchWikipediaMetadata(
    searchTitle,
    "web novel",
    "Web Novel",
    item.title
  );
  if (wikipedia) return wikipedia;
  return fetchWikidataMetadata(item, searchTitle);
}

async function fetchWikipediaMetadata(
  searchTitle: string,
  searchKind: "book" | "web novel",
  formatLabel: "Book" | "Web Novel",
  expectedTitle = searchTitle
): Promise<Metadata | null> {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrsearch", `"${searchTitle}" ${searchKind}`);
  url.searchParams.set("gsrlimit", "5");
  url.searchParams.set("prop", "pageimages|extracts");
  url.searchParams.set("piprop", "original");
  url.searchParams.set("exintro", "1");
  url.searchParams.set("explaintext", "1");

  const response = await fetchWithRetry(url, {
    headers: { "User-Agent": "TheArchiveMetadataFetcher/1.0" },
  });
  if (!response.ok) throw new Error(`Wikipedia returned HTTP ${response.status}`);

  const payload = (await response.json()) as {
    query?: {
      pages?: Record<
        string,
        { title?: string; extract?: string; original?: { source?: string } }
      >;
    };
  };
  const normalizedTitle = normalize(expectedTitle);
  const page = Object.values(payload.query?.pages ?? {}).find((candidate) => {
    const candidateTitle = normalize(candidate.title ?? "");
    return searchKind === "web novel"
      ? isTrustedWebNovelTitle(normalizedTitle, candidateTitle)
      : isTrustedBookTitle(normalizedTitle, candidateTitle);
  });

  if (!page) return null;

  return {
    coverUrl: secureUrl(page.original?.source),
    description: cleanDescription(page.extract),
    formatLabel,
    provider: "Wikipedia",
    matchedTitle: page.title,
  };
}

async function fetchWikidataMetadata(
  item: ArchiveItem,
  searchTitle: string
): Promise<Metadata | null> {
  const searchUrl = new URL("https://www.wikidata.org/w/api.php");
  searchUrl.searchParams.set("action", "wbsearchentities");
  searchUrl.searchParams.set("format", "json");
  searchUrl.searchParams.set("language", "en");
  searchUrl.searchParams.set("type", "item");
  searchUrl.searchParams.set("limit", "5");
  const normalizedTitle = normalize(item.title);
  let match:
    | { id?: string; label?: string; description?: string }
    | undefined;

  for (const query of [`${searchTitle} web novel`, searchTitle]) {
    searchUrl.searchParams.set("search", query);
    const response = await fetchWithRetry(searchUrl, {
      headers: { "User-Agent": "TheArchiveMetadataFetcher/1.0" },
    });
    if (!response.ok) {
      throw new Error(`Wikidata returned HTTP ${response.status}`);
    }

    const payload = (await response.json()) as {
      search?: { id?: string; label?: string; description?: string }[];
    };
    match = payload.search?.find(
      (candidate) =>
        isTrustedWebNovelTitle(
          normalizedTitle,
          normalize(candidate.label ?? "")
        ) && /web novel|online novel|web serial/i.test(candidate.description ?? "")
    );
    if (match) break;
  }
  if (!match?.id) return null;

  const entityResponse = await fetchWithRetry(
    `https://www.wikidata.org/wiki/Special:EntityData/${match.id}.json`,
    { headers: { "User-Agent": "TheArchiveMetadataFetcher/1.0" } }
  );
  if (!entityResponse.ok) {
    throw new Error(`Wikidata entity returned HTTP ${entityResponse.status}`);
  }

  const entityPayload = (await entityResponse.json()) as {
    entities?: Record<
      string,
      {
        claims?: Record<
          string,
          { mainsnak?: { datavalue?: { value?: unknown } } }[]
        >;
      }
    >;
  };
  const claims = entityPayload.entities?.[match.id]?.claims;
  const imageName = claims?.P18?.[0]?.mainsnak?.datavalue?.value;
  const publicationDate = claims?.P577?.[0]?.mainsnak?.datavalue?.value as
    | { time?: string }
    | undefined;

  return {
    coverUrl:
      typeof imageName === "string"
        ? `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(imageName)}?width=900`
        : undefined,
    description: match.description,
    releaseYear: parseYear(publicationDate?.time),
    formatLabel: "Web Novel",
    provider: "Wikidata",
    matchedTitle: match.label ?? item.title,
  };
}

async function fetchImageSearchCover(
  item: ArchiveItem,
  searchQuery: string
): Promise<Metadata | null> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    log(
      "SEARCH FALLBACK",
      item.title,
      "BRAVE_SEARCH_API_KEY is not configured"
    );
    return null;
  }

  const url = new URL("https://api.search.brave.com/res/v1/images/search");
  url.searchParams.set("q", searchQuery);
  url.searchParams.set("count", "50");
  url.searchParams.set("safesearch", "strict");
  url.searchParams.set("search_lang", "en");
  url.searchParams.set("country", "ALL");

  const response = await fetchWithRetry(url, {
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": apiKey,
    },
  });
  if (!response.ok) {
    throw new Error(`Brave Image Search returned HTTP ${response.status}`);
  }

  const payload = (await response.json()) as {
    results?: {
      title?: string;
      url?: string;
      source?: string;
      properties?: {
        url?: string;
        width?: number;
        height?: number;
      };
      thumbnail?: { src?: string };
    }[];
  };
  const blockedHosts = /novelfire|novelbin/i;
  const candidate = payload.results
    ?.map((image) => ({
      ...image,
      imageUrl: image.properties?.url ?? image.url ?? image.thumbnail?.src,
    }))
    .filter((image) => {
      const imageUrl = image.imageUrl ?? "";
      return (
        imageUrl &&
        !blockedHosts.test(`${imageUrl} ${image.source ?? ""}`) &&
        /\.(?:jpe?g|png|webp)(?:[?#].*)?$/i.test(imageUrl)
      );
    })
    .sort((a, b) => imageSearchScore(b) - imageSearchScore(a))[0];

  if (!candidate?.imageUrl) return null;

  return {
    coverUrl: candidate.imageUrl,
    formatLabel: "Web Novel",
    provider: "Brave Image Search",
    matchedTitle: candidate.title ?? searchQuery,
  };
}

function imageSearchScore(image: {
  properties?: { width?: number; height?: number };
}) {
  const width = image.properties?.width ?? 0;
  const height = image.properties?.height ?? 0;
  const portraitBonus = height > width ? 10_000 : 0;
  return portraitBonus + width * height;
}

function titlesOverlap(left: string, right: string) {
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

function isTrustedWebNovelTitle(expected: string, candidate: string) {
  return (
    normalizeWebNovelCatalogTitle(expected) ===
    normalizeWebNovelCatalogTitle(candidate)
  );
}

function isTrustedBookTitle(expected: string, candidate: string) {
  return (
    expected === candidate ||
    candidate === `${expected} book` ||
    candidate === `${expected} novel` ||
    candidate === `${expected} book series` ||
    candidate === `${expected} novel series`
  );
}

function authorMatches(authors?: string[], expected?: string) {
  if (!expected) return true;
  const normalizedExpected = normalize(expected);
  return (authors ?? []).some((author) =>
    titlesOverlap(normalizedExpected, normalize(author))
  );
}

async function downloadCover(url: string, publicUrl: string) {
  const response = await fetchWithRetry(secureUrl(url));

  if (!response.ok) {
    throw new Error(`Cover download returned HTTP ${response.status}`);
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`Cover download returned non-image content (${contentType || "unknown"})`);
  }

  const destination = publicPath(publicUrl);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, Buffer.from(await response.arrayBuffer()));
  return publicUrl;
}

function findArchiveObjects(sourceFile: ts.SourceFile) {
  const objects = new Map<string, ts.ObjectLiteralExpression>();

  sourceFile.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) return;

    for (const declaration of node.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === "archiveItems" &&
        declaration.initializer &&
        ts.isArrayLiteralExpression(declaration.initializer)
      ) {
        for (const element of declaration.initializer.elements) {
          if (!ts.isObjectLiteralExpression(element)) continue;
          const slug = readStringProperty(element, "slug");
          const category = readStringProperty(element, "category");
          if (slug && category) {
            objects.set(archiveItemKey(category as ArchiveCategory, slug), element);
          }
        }
      }
    }
  });

  return objects;
}

function queuePropertyEdit(
  source: string,
  object: ts.ObjectLiteralExpression,
  field: string,
  value: unknown,
  edits: Edit[]
) {
  const existing = object.properties.find(
    (property) =>
      ts.isPropertyAssignment(property) && propertyName(property.name) === field
  );
  const serialized = serializeValue(value);

  if (existing && ts.isPropertyAssignment(existing)) {
    edits.push({
      start: existing.initializer.getStart(),
      end: existing.initializer.getEnd(),
      text: serialized,
    });
    return;
  }

  const lastProperty = object.properties.at(-1);

  if (!lastProperty) {
    throw new Error(`Cannot insert "${field}" into an empty archive object`);
  }

  const closingBrace = object.getEnd() - 1;
  const lineStart = source.lastIndexOf("\n", closingBrace) + 1;
  const objectIndent = source.slice(lineStart, closingBrace);
  edits.push({
    start: lastProperty.getEnd(),
    end: lastProperty.getEnd(),
    text: `,\n${objectIndent}  ${field}: ${serialized}`,
  });
}

function applyEdits(source: string, edits: Edit[]) {
  return [...edits]
    .sort((a, b) => b.start - a.start)
    .reduce(
      (result, edit) =>
        result.slice(0, edit.start) + edit.text + result.slice(edit.end),
      source
    );
}

function serializeValue(value: unknown) {
  return JSON.stringify(value, null, 2).replace(/\n/g, "\n  ");
}

function readStringProperty(object: ts.ObjectLiteralExpression, name: string) {
  const property = object.properties.find(
    (candidate) =>
      ts.isPropertyAssignment(candidate) && propertyName(candidate.name) === name
  );

  return property &&
    ts.isPropertyAssignment(property) &&
    ts.isStringLiteral(property.initializer)
    ? property.initializer.text
    : undefined;
}

function propertyName(name: ts.PropertyName) {
  return ts.isIdentifier(name) || ts.isStringLiteral(name) ? name.text : "";
}

function getCanonicalImagePath(item: ArchiveItem) {
  const folders: Record<ArchiveCategory, string> = {
    Manga: "manga",
    Manhwa: "manhwa",
    Anime: "anime",
    "Web Novel": "web-novels",
    Book: "books",
  };

  return `/images/${folders[item.category]}/${item.slug}.jpg`;
}

function getMetadataSearchTitles(item: ArchiveItem) {
  return [item.title, ...(METADATA_ALIASES[item.slug] ?? [])].filter(
    (title, index, titles) => titles.indexOf(title) === index
  );
}

function archiveItemKey(category: ArchiveCategory, slug: string) {
  return `${category}:${slug}`;
}

function scoreAniListResult(
  candidate: {
    title?: { romaji?: string; english?: string };
    synonyms?: string[];
    countryOfOrigin?: string;
    format?: string;
  },
  normalizedTitle: string,
  category: ArchiveCategory
) {
  const titles = [
    candidate.title?.english,
    candidate.title?.romaji,
    ...(candidate.synonyms ?? []),
  ]
    .filter((title): title is string => Boolean(title))
    .map(normalize);
  const exactMatch = titles.includes(normalizedTitle);
  const partialMatch = titles.some(
    (title) =>
      title.includes(normalizedTitle) || normalizedTitle.includes(title)
  );
  const countryMatch =
    category === "Manhwa" && candidate.countryOfOrigin === "KR";
  const animeFormatScore =
    category !== "Anime"
      ? 0
      : candidate.format === "TV"
        ? 25
        : candidate.format === "MUSIC"
          ? -60
          : 0;

  return (
    (exactMatch ? 100 : partialMatch ? 40 : 0) +
    (countryMatch ? 20 : 0) +
    animeFormatScore
  );
}


function publicPath(publicUrl: string) {
  return path.join(ROOT, "public", ...publicUrl.replace(/^\//, "").split("/"));
}

function cleanDescription(description?: string) {
  return description
    ?.replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function humanize(value?: string) {
  return value
    ?.toLocaleLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toLocaleUpperCase() + word.slice(1))
    .join(" ");
}

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLocaleLowerCase();
}

function normalizeBookTitle(value: string) {
  return normalize(value).replace(/^(?:a|an|the)\s+/, "");
}

function normalizeWebNovelCatalogTitle(value: string) {
  return normalizeBookTitle(value)
    .replace(/\s+(?:book|volume|vol)\s+\d+.*$/, "")
    .replace(/\s+(?:webnovel|web novel|light novel|novel)$/, "")
    .trim();
}

function parseYear(value?: string) {
  const year = value?.match(/\d{4}/)?.[0];
  return year ? Number(year) : undefined;
}

function secureUrl(value?: string) {
  return value?.replace(/^http:/, "https:") ?? "";
}

async function fetchWithRetry(
  input: string | URL,
  init?: RequestInit,
  attempts = 3
) {
  let response = await fetch(input, init);

  for (let attempt = 1; response.status === 429 && attempt < attempts; attempt++) {
    const retryAfterHeader = response.headers.get("retry-after");
    const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : Number.NaN;
    const delayMs = Number.isFinite(retryAfter)
      ? retryAfter * 1000
      : 1000 * 2 ** (attempt - 1);
    await delay(delayMs);
    response = await fetch(input, init);
  }

  return response;
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function providerFor(category: ArchiveCategory) {
  if (category === "Manhwa") return "AniList and MangaDex";
  if (["Anime", "Manga"].includes(category)) return "AniList";
  if (category === "Web Novel") {
    return "AniList, Open Library, Google Books, MangaDex, Wikimedia, and image search";
  }
  if (category === "Book") return "Open Library, Google Books, and Wikipedia";
  return "no configured official provider";
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function log(status: string, title: string, detail: string) {
  console.log(`[${status}] ${title}: ${detail}`);
}

function printSummary(result: Summary) {
  console.log("\nSummary");
  console.log(`Updated: ${result.updated.length}`);
  console.log(`Skipped: ${result.skipped.length}`);
  console.log(`Not found: ${result.notFound.length}`);
  console.log(`Failed: ${result.failed.length}`);
}

main().catch((error) => {
  console.error(errorMessage(error));
  process.exitCode = 1;
});
