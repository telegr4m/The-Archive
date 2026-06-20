import type { ArchiveItem, ArchiveMetadataStatus } from "../../app/lib/archiveTypes";

const METADATA_FINGERPRINT_VERSION = "v1";

export function getMetadataFingerprint(item: ArchiveItem) {
  return [
    METADATA_FINGERPRINT_VERSION,
    item.category,
    item.slug,
    item.title.trim().toLocaleLowerCase(),
  ].join("|");
}

export function getWebNovelMetadataStatus(
  item: ArchiveItem,
  missingFields: string[],
  releaseYearUnverified: boolean
): { status?: ArchiveMetadataStatus; reason: string } {
  const criticalMissing = [
    !item.image ? "cover" : undefined,
    !item.description.trim() ? "description" : undefined,
    !item.creator ? "creator" : undefined,
    !item.formatLabel ? "format" : undefined,
  ].filter((field): field is string => Boolean(field));

  if (criticalMissing.length > 0) {
    return {
      reason: `critical metadata missing: ${criticalMissing.join(", ")}`,
    };
  }
  if (releaseYearUnverified) {
    return {
      status: "needs-review",
      reason: "release year unverified, skipping normal retry",
    };
  }
  if (missingFields.length > 0) {
    return {
      status: "partial",
      reason: `non-critical metadata incomplete (${missingFields.join(", ")})`,
    };
  }
  return {
    status: "complete",
    reason: "metadata complete",
  };
}
