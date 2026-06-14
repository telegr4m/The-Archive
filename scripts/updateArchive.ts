import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { cleanupSafetyBackups } from "./lib/backupRetention";

const ROOT = process.cwd();
const ARCHIVE_FILE = path.join(ROOT, "app", "data", "archiveItems.ts");
const BACKUP_DIRECTORY = path.join(ROOT, "archive-backups");
const require = createRequire(import.meta.url);

type ArchiveTask = {
  label: string;
  successMessage: string;
  script: string;
};

// Importers read only the five active CSV files in data/imports/.
// Template examples under data/imports/examples/ are never imported.
const tasks: ArchiveTask[] = [
  {
    label: "Importing Manga",
    successMessage: "Manga complete",
    script: "importManga.ts",
  },
  {
    label: "Importing Manhwa",
    successMessage: "Manhwa complete",
    script: "importManhwa.ts",
  },
  {
    label: "Importing Anime",
    successMessage: "Anime complete",
    script: "importAnime.ts",
  },
  {
    label: "Importing Web Novels",
    successMessage: "Web Novels complete",
    script: "importWebNovels.ts",
  },
  {
    label: "Importing Books",
    successMessage: "Books complete",
    script: "importBooks.ts",
  },
  {
    label: "Syncing CSV Removals",
    successMessage: "CSV removals synced",
    script: "syncArchiveSources.ts",
  },
  {
    label: "Auditing Archive Sources",
    successMessage: "Archive sources verified",
    script: "auditArchiveSources.ts",
  },
  {
    label: "Fetching Metadata",
    successMessage: "Metadata complete",
    script: "fetchMetadata.ts",
  },
];

async function main() {
  console.log("--------------------------------");
  await mkdir(BACKUP_DIRECTORY, { recursive: true });
  const backup = path.join(
    BACKUP_DIRECTORY,
    `archiveItems-before-update-${timestampForFilename()}.ts`
  );
  const transactionId = timestampForFilename();
  const removalLog = path.join(
    BACKUP_DIRECTORY,
    `archive-removals-${transactionId}.json`
  );
  const quarantine = path.join(BACKUP_DIRECTORY, `.archive-update-${transactionId}`);
  await copyFile(ARCHIVE_FILE, backup);
  await writeFile(
    removalLog,
    `${JSON.stringify({ createdAt: new Date().toISOString(), removedEntries: [], images: [] }, null, 2)}\n`,
    "utf8"
  );
  console.log(`Backup created: ${path.relative(ROOT, backup)}\n`);
  console.log(`Removal list backup: ${path.relative(ROOT, removalLog)}\n`);

  try {
    for (const task of tasks) {
      console.log(`STEP STARTED: ${task.label}`);
      await runScript(task.script, {
        ARCHIVE_UPDATE_REMOVAL_LOG: removalLog,
        ARCHIVE_UPDATE_QUARANTINE: quarantine,
      });
      console.log(`STEP COMPLETED: ${task.successMessage}\n`);
    }
    await rm(quarantine, { recursive: true, force: true });
  } catch (error) {
    console.error(`Archive update failed: ${errorMessage(error)}`);
    await copyFile(backup, ARCHIVE_FILE);
    await restoreQuarantinedImages(removalLog);
    console.error(`RESTORE PERFORMED: ${path.relative(ROOT, backup)}`);
    process.exitCode = 1;
    return;
  }

  await cleanupSafetyBackups(BACKUP_DIRECTORY);
  console.log("Archive update complete.");
  console.log("--------------------------------");
}

function timestampForFilename() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function runScript(script: string, environment: Record<string, string>) {
  const tsxCli = require.resolve("tsx/cli");
  const scriptPath = path.join(ROOT, "scripts", script);

  return new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, [tsxCli, scriptPath], {
      cwd: ROOT,
      env: { ...process.env, ...environment },
      stdio: "inherit",
      windowsHide: true,
    });

    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          signal
            ? `${script} stopped by signal ${signal}`
            : `${script} exited with code ${code ?? "unknown"}`
        )
      );
    });
  });
}

async function restoreQuarantinedImages(removalLog: string) {
  if (!existsSync(removalLog)) return;
  const log = JSON.parse(await readFile(removalLog, "utf8")) as {
    images?: { original: string; quarantine: string }[];
  };

  for (const image of log.images ?? []) {
    if (!existsSync(image.quarantine)) continue;
    await mkdir(path.dirname(image.original), { recursive: true });
    await rename(image.quarantine, image.original);
    console.error(`RESTORED IMAGE: ${path.relative(ROOT, image.original)}`);
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

main().catch((error) => {
  console.error(errorMessage(error));
  process.exitCode = 1;
});
