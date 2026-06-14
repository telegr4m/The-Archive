import { runArchiveImport } from "./lib/archiveImport";

runArchiveImport({
  category: "Manga",
  label: "Manga",
  filename: "manga-import.csv",
  idPrefix: "manga",
  imageFolder: "manga",
  favoriteCharacter: true,
  statuses: ["Completed", "Currently Reading", "On Hold", "Dropped", "Planned"],
}).catch(fail);

function fail(error: unknown) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
