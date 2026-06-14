import { runArchiveImport } from "./lib/archiveImport";

runArchiveImport({
  category: "Anime",
  label: "Anime",
  filename: "anime-import.csv",
  idPrefix: "anime",
  imageFolder: "anime",
  favoriteCharacter: true,
  statuses: ["Completed", "Currently Watching", "On Hold", "Dropped", "Planned"],
}).catch(fail);

function fail(error: unknown) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
