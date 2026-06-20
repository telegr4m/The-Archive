import type { ArchiveCategory } from "./archiveConstants";
import type { ArchiveItem } from "./archiveTypes";
import { staticArchiveRepository } from "./staticArchiveRepository";

export type ArchiveSearchFilters = {
  category?: ArchiveCategory | "All";
  status?: ArchiveItem["status"] | "All";
  genre?: string | "All";
  minRating?: number;
  maxRating?: number;
};

export type ArchiveStatsSummary = {
  totalEntries: number;
  totalByCategory: Record<ArchiveCategory, number>;
  completedEntries: number;
  activeEntries: number;
  averageRating: number;
};

export type ArchiveRepository = {
  getAllEntries(): ArchiveItem[];
  getEntryBySlug(categoryPath: string, slug: string): ArchiveItem | undefined;
  getEntriesByCategory(category: ArchiveCategory): ArchiveItem[];
  getFeaturedEntries(): ArchiveItem[];
  getFavoriteEntries(): ArchiveItem[];
  getRecentlyAddedEntries(limit?: number): ArchiveItem[];
  getRelatedEntries(entry: ArchiveItem, limit?: number): ArchiveItem[];
  searchEntries(query: string, filters?: ArchiveSearchFilters): ArchiveItem[];
  getArchiveStats(items?: readonly ArchiveItem[]): ArchiveStatsSummary;
};

// Current default repository. A future database adapter should implement the
// same contract so UI code can switch data sources without knowing where the
// archive is stored.
export const archiveRepository: ArchiveRepository = staticArchiveRepository;

export const getAllEntries = () => archiveRepository.getAllEntries();

export const getEntryBySlug = (categoryPath: string, slug: string) =>
  archiveRepository.getEntryBySlug(categoryPath, slug);

export const getEntriesByCategory = (category: ArchiveCategory) =>
  archiveRepository.getEntriesByCategory(category);

export const getFeaturedEntries = () => archiveRepository.getFeaturedEntries();

export const getFavoriteEntries = () => archiveRepository.getFavoriteEntries();

export const getRecentlyAddedEntries = (limit?: number) =>
  archiveRepository.getRecentlyAddedEntries(limit);

export const getRelatedEntries = (entry: ArchiveItem, limit?: number) =>
  archiveRepository.getRelatedEntries(entry, limit);

export const searchEntries = (
  query: string,
  filters: ArchiveSearchFilters = {}
) => archiveRepository.searchEntries(query, filters);

export const getArchiveStats = (items?: readonly ArchiveItem[]) =>
  archiveRepository.getArchiveStats(items);
