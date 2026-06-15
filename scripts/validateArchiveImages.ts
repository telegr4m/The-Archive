import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { archiveItems, type ArchiveItem } from "../app/data/archiveItems";

const ROOT = process.cwd();

export function findBrokenArchiveImagePaths(
  items: readonly ArchiveItem[],
  root = ROOT
) {
  return items.flatMap((item) => {
    if (!item.image) return [];

    const filesystemPath = path.join(
      root,
      "public",
      ...item.image.replace(/^\//, "").split("/")
    );
    const stats = existsSync(filesystemPath) ? statSync(filesystemPath) : null;
    const valid = Boolean(stats?.isFile() && stats.size > 0);

    return valid
      ? []
      : [{ title: item.title, image: item.image, filesystemPath }];
  });
}

function main() {
  console.log("Validating archive image paths...");
  const brokenImages = findBrokenArchiveImagePaths(archiveItems);

  if (brokenImages.length > 0) {
    for (const image of brokenImages) {
      console.error(`[BROKEN IMAGE PATH] ${image.title}: ${image.image}`);
    }
    throw new Error(
      `${brokenImages.length} archive image path(s) do not point to a valid file.`
    );
  }

  console.log(
    `Image path validation passed: ${archiveItems.filter((item) => item.image).length} image path(s) verified.`
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  main();
}
