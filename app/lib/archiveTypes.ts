import type {
  ArchiveCategory,
  ArchiveStatus,
  ArchiveVisibility,
  UserRole,
} from "./archiveConstants";

export type {
  ArchiveCategory,
  ArchiveStatus,
  ArchiveVisibility,
  UserRole,
};

export type ArchiveMetadataStatus = "complete" | "partial" | "needs-review";

export type ArchiveItem = {
  id: string;
  slug: string;
  title: string;
  category: ArchiveCategory;
  status: ArchiveStatus;
  rating: number;
  image: string;
  genres: string[];
  description: string;
  shortDescription?: string;
  recommendLevel?: string;
  formatLabel?: string;
  creator?: string;
  studio?: string;
  favoriteCharacter?: string;
  featured?: boolean;
  featuredImagePosition?: string;
  detailImagePosition?: string;
  favorite?: boolean;
  releaseYear?: number;
  sourceStatus?: string;
  metadataStatus?: ArchiveMetadataStatus;
  metadataFingerprint?: string;
  // Present only when an entry is managed by one of the CSV import files.
  importSource?: string;
  createdAt: string;
  // Omitted ownership fields belong to the current default personal archive.
  ownerId?: string;
  visibility?: ArchiveVisibility;
  createdBy?: string;
};

