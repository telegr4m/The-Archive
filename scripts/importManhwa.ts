import { runArchiveImport } from "./lib/archiveImport";

runArchiveImport({
  category: "Manhwa",
  label: "Manhwa",
  filename: "manhwa-import.csv",
  idPrefix: "manhwa",
  imageFolder: "manhwa",
  favoriteCharacter: true,
  statuses: ["Completed", "Currently Reading", "On Hold", "Dropped", "Planned"],
}).catch(fail);

function fail(error: unknown) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
