import { existsSync } from "node:fs";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArchiveItemHref } from "../../lib/archiveRoutes";
import type { ArchiveCategory, ArchiveItem } from "../../lib/archiveTypes";
import { getAllEntries } from "../../lib/archiveRepository";

const categories: ArchiveCategory[] = [
  "Manga",
  "Manhwa",
  "Anime",
  "Web Novel",
  "Book",
];

type IssueKey =
  | "missingCover"
  | "missingDescription"
  | "missingCreator"
  | "unrated"
  | "duplicateSlug"
  | "missingReleaseYear"
  | "incompleteWebNovelMetadata"
  | "brokenImage";

type HealthIssue = {
  key: IssueKey;
  label: string;
  description: string;
  howToFix: string;
  entries: ArchiveItem[];
};

const ratingExpectedStatuses = new Set<ArchiveItem["status"]>([
  "Completed",
  "Currently Reading",
  "Currently Watching",
]);

export default function ArchiveHealthPage() {
  // Local-only maintenance dashboard. Production deployments must not expose it.
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const archiveItems = getAllEntries();
  const issues = calculateIssues(archiveItems);
  const totalProblems = new Set(
    issues.flatMap((issue) => issue.entries.map((item) => item.id))
  ).size;

  return (
    <main className="min-h-screen bg-black px-5 pb-20 pt-24 text-white sm:px-6 md:px-10 md:pb-24 md:pt-28 lg:pb-20 lg:pt-24">
      <div className="mx-auto max-w-[1440px]">
        <p className="text-xs font-medium uppercase tracking-[0.35em] text-gray-500">
          Internal Maintenance
        </p>
        <h1 className="mt-4 break-words text-4xl font-bold tracking-tight sm:text-6xl md:text-8xl lg:text-7xl">
          Archive Health
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-gray-400">
          A live diagnostic view calculated from archive data and local cover
          files. This page is intentionally not linked from the main navigation.
        </p>
        <div className="mt-8 max-w-4xl rounded-2xl border border-white/10 bg-white/[0.025] p-5 text-sm leading-6 text-gray-400">
          <p className="font-medium text-white">
            This is a diagnostic dashboard, not an editor.
          </p>
          <p className="mt-2">
            Use it to identify entries that need attention. Nothing on this page
            changes your archive data.
          </p>
        </div>

        <section className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Total entries" value={archiveItems.length} />
          <SummaryCard label="Entries needing attention" value={totalProblems} />
          {issues.map((issue) => (
            <SummaryCard
              key={issue.key}
              label={issue.label}
              value={issue.entries.length}
              description={issue.description}
              howToFix={issue.howToFix}
            />
          ))}
        </section>

        <section className="mt-16 space-y-8">
          {categories.map((category) => {
            const categoryItems = archiveItems.filter(
              (item) => item.category === category
            );
            const categoryIssues = issues
              .map((issue) => ({
                ...issue,
                entries: issue.entries.filter(
                  (item) => item.category === category
                ),
              }))
              .filter((issue) => issue.entries.length > 0);

            return (
              <article
                key={category}
                className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]"
              >
                <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 p-6 sm:p-8 lg:p-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-gray-500">
                      Category Health
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                      {category === "Web Novel" ? "Web Novels" : category}
                    </h2>
                  </div>
                  <p className="text-sm text-gray-400">
                    {categoryItems.length} entries /{" "}
                    {new Set(
                      categoryIssues.flatMap((issue) =>
                        issue.entries.map((item) => item.id)
                      )
                    ).size}{" "}
                    need attention
                  </p>
                </header>

                {categoryIssues.length === 0 ? (
                  <p className="p-6 text-sm text-gray-400 sm:p-8 lg:p-6">
                    No data issues detected.
                  </p>
                ) : (
                  <div className="grid gap-px bg-white/10 lg:grid-cols-2">
                    {categoryIssues.map((issue) => (
                      <div key={issue.key} className="bg-black p-6 sm:p-8 lg:p-6">
                        <div className="flex items-center justify-between gap-4">
                          <h3 className="text-sm font-semibold uppercase tracking-[0.18em]">
                            {issue.label}
                          </h3>
                          <span className="text-sm text-gray-500">
                            {issue.entries.length}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-gray-400">
                          {issue.description}
                        </p>
                        <p className="mt-2 text-xs leading-5 text-gray-500">
                          <span className="font-semibold uppercase tracking-[0.16em] text-gray-300">
                            How to fix:
                          </span>{" "}
                          {issue.howToFix}
                        </p>
                        <ul className="mt-5 space-y-3">
                          {issue.entries.map((item) => (
                            <li key={item.id}>
                              <Link
                                href={getArchiveItemHref(item)}
                                scroll={true}
                                className="text-sm text-gray-400 transition-colors hover:text-white"
                              >
                                {item.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}

function calculateIssues(archiveItems: ArchiveItem[]): HealthIssue[] {
  const duplicateKeys = new Set(
    Object.entries(
      archiveItems.reduce<Record<string, number>>((counts, item) => {
        const key = `${item.category}:${item.slug}`;
        counts[key] = (counts[key] ?? 0) + 1;
        return counts;
      }, {})
    )
      .filter(([, count]) => count > 1)
      .map(([key]) => key)
  );

  return [
    issue(
      "missingCover",
      "Missing covers",
      "The cover image was not found.",
      "Run the metadata fetcher or add the correct cover file and image path.",
      archiveItems,
      (item) => !item.image.trim()
    ),
    issue(
      "missingDescription",
      "Missing descriptions",
      "The metadata fetcher did not find a description.",
      "Add a description manually or retry metadata fetching with a better title match.",
      archiveItems,
      (item) => !item.description.trim()
    ),
    issue(
      "missingCreator",
      "Missing creator / author",
      "Creator or author data is missing.",
      "Add the creator manually or retry metadata fetching.",
      archiveItems,
      (item) => !item.creator?.trim()
    ),
    issue(
      "unrated",
      "Unrated Active/Completed Entries",
      "Planned, On Hold, and Dropped entries are ignored because they may not need ratings yet.",
      "Add a rating to the relevant import CSV, then run the archive update.",
      archiveItems,
      (item) =>
        item.rating <= 0 && ratingExpectedStatuses.has(item.status)
    ),
    issue(
      "duplicateSlug",
      "Duplicate route slugs",
      "Multiple entries share a route slug, which creates a route conflict.",
      "Give each conflicting entry a unique slug or rename one of the titles.",
      archiveItems,
      (item) => duplicateKeys.has(`${item.category}:${item.slug}`)
    ),
    issue(
      "missingReleaseYear",
      "Missing release year",
      "Release year metadata is missing.",
      "Retry metadata fetching or add the release year manually.",
      archiveItems,
      (item) => item.category !== "Web Novel" && !item.releaseYear
    ),
    issue(
      "incompleteWebNovelMetadata",
      "Metadata Incomplete (Web Novel)",
      "Web Novel metadata sources were exhausted, but release year metadata is still unavailable.",
      "Retry metadata fetching later or add a trusted fallback metadata cache entry.",
      archiveItems,
      (item) => item.category === "Web Novel" && !item.releaseYear
    ),
    issue(
      "brokenImage",
      "Broken image paths",
      "The image path points to a file that does not exist.",
      "Add the missing image file or update the entry to use the correct path.",
      archiveItems,
      hasBrokenImagePath
    ),
  ];
}

function issue(
  key: IssueKey,
  label: string,
  description: string,
  howToFix: string,
  archiveItems: ArchiveItem[],
  predicate: (item: ArchiveItem) => boolean
): HealthIssue {
  return {
    key,
    label,
    description,
    howToFix,
    entries: archiveItems.filter(predicate),
  };
}

function hasBrokenImagePath(item: ArchiveItem) {
  if (!item.image.startsWith("/")) return false;
  return !existsSync(path.join(process.cwd(), "public", item.image.slice(1)));
}

function SummaryCard({
  label,
  value,
  description,
  howToFix,
}: {
  label: string;
  value: number;
  description?: string;
  howToFix?: string;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
      <p className="text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-gray-500">
        {label}
      </p>
      {description ? (
        <p className="mt-3 text-xs leading-5 text-gray-500">{description}</p>
      ) : null}
      {howToFix ? (
        <p className="mt-2 text-xs leading-5 text-gray-600">
          <span className="text-gray-400">How to fix:</span> {howToFix}
        </p>
      ) : null}
    </article>
  );
}
