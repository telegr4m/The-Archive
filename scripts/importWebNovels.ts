import { runArchiveImport } from "./lib/archiveImport";

runArchiveImport({
  category: "Web Novel",
  label: "Web Novel",
  filename: "webnovel-import.csv",
  idPrefix: "web-novel",
  imageFolder: "web-novels",
  favoriteCharacter: true,
  detectExistingCover: true,
  statuses: ["Completed", "Currently Reading", "On Hold", "Dropped", "Planned"],
}).catch(fail);

function fail(error: unknown) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
