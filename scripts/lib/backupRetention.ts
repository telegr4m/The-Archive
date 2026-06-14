import { readdir, rm } from "node:fs/promises";
import path from "node:path";

const SAFETY_BACKUP_PATTERNS = [
  /^archiveItems-before-update-.*\.ts$/,
  /^archiveItems-before-restore-.*\.ts$/,
  /^archive-removals-.*\.json$/,
];

export type BackupCleanupResult = {
  removed: string[];
  kept: string[];
};

export async function cleanupSafetyBackups(
  backupDirectory: string,
  keepCount = 5
): Promise<BackupCleanupResult> {
  console.log("\nBackup cleanup started.");
  const names = await readdir(backupDirectory);
  const removed: string[] = [];
  const kept: string[] = [];
  let checked = 0;

  for (const pattern of SAFETY_BACKUP_PATTERNS) {
    const files = names
      .filter((name) => pattern.test(name))
      .sort((left, right) => right.localeCompare(left))
      .map((name) => ({ name }));
    checked += files.length;

    for (const [index, file] of files.entries()) {
      if (index < keepCount) {
        kept.push(file.name);
        continue;
      }
      await rm(path.join(backupDirectory, file.name));
      removed.push(file.name);
    }
  }

  for (const name of removed) console.log(`[REMOVED BACKUP] ${name}`);
  for (const name of kept) console.log(`[KEPT BACKUP] ${name}`);
  for (const name of ["archive-backup.json", "archive-backup.csv"]) {
    if (names.includes(name)) console.log(`[PRESERVED MAIN BACKUP] ${name}`);
  }
  console.log(`[BACKUPS CHECKED] ${checked}`);
  console.log(`[BACKUPS DELETED] ${removed.length}`);
  console.log(`[BACKUPS KEPT] ${kept.length}`);
  return { removed, kept };
}
