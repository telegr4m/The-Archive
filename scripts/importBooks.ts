import { runArchiveImport } from "./lib/archiveImport";

runArchiveImport({
  category: "Book",
  label: "Book",
  filename: "book-import.csv",
  idPrefix: "book",
  imageFolder: "books",
  statuses: ["Completed", "Currently Reading", "On Hold", "Dropped", "Planned"],
}).catch(fail);

function fail(error: unknown) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
