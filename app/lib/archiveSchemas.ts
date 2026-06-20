import { z } from "zod";
import {
  ARCHIVE_CATEGORIES,
  ARCHIVE_STATUSES,
  ARCHIVE_VISIBILITIES,
  USER_ROLES,
} from "./archiveConstants";

export const archiveCategorySchema = z.enum(ARCHIVE_CATEGORIES);
export const archiveStatusSchema = z.enum(ARCHIVE_STATUSES);
export const archiveVisibilitySchema = z.enum(ARCHIVE_VISIBILITIES);
export const userRoleSchema = z.enum(USER_ROLES);

const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value === "" ? undefined : value));

export const archiveEntryCreateSchema = z.object({
  title: z.string().trim().min(1).max(180),
  category: archiveCategorySchema,
  status: archiveStatusSchema,
  rating: z.number().min(0).max(10).default(0),
  favorite: z.boolean().default(false),
  featured: z.boolean().default(false),
  notes: optionalTrimmedString,
  description: optionalTrimmedString,
  shortDescription: optionalTrimmedString,
  favoriteCharacter: optionalTrimmedString,
  favoriteMoment: optionalTrimmedString,
  creator: optionalTrimmedString,
  studio: optionalTrimmedString,
  releaseYear: z.number().int().min(0).max(3000).optional(),
  visibility: archiveVisibilitySchema.default("private"),
  coverImage: optionalTrimmedString,
  metadataSource: optionalTrimmedString,
  genres: z.array(z.string().trim().min(1).max(80)).default([]),
});

export const archiveEntryUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(180).optional(),
    category: archiveCategorySchema.optional(),
    status: archiveStatusSchema.optional(),
    rating: z.number().min(0).max(10).optional(),
    favorite: z.boolean().optional(),
    featured: z.boolean().optional(),
    notes: optionalTrimmedString,
    description: optionalTrimmedString,
    shortDescription: optionalTrimmedString,
    favoriteCharacter: optionalTrimmedString,
    favoriteMoment: optionalTrimmedString,
    creator: optionalTrimmedString,
    studio: optionalTrimmedString,
    releaseYear: z.number().int().min(0).max(3000).optional(),
    visibility: archiveVisibilitySchema.optional(),
    coverImage: optionalTrimmedString,
    metadataSource: optionalTrimmedString,
    genres: z.array(z.string().trim().min(1).max(80)).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided.",
  });

export const userProfileSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_-]+$/),
  displayName: z.string().trim().min(1).max(80),
  profileImage: optionalTrimmedString,
  bio: z.string().trim().max(500).optional(),
  archiveVisibility: archiveVisibilitySchema.default("private"),
  role: userRoleSchema.default("user"),
});

export type ArchiveEntryCreatePayload = z.infer<
  typeof archiveEntryCreateSchema
>;
export type ArchiveEntryUpdatePayload = z.infer<
  typeof archiveEntryUpdateSchema
>;
export type UserProfilePayload = z.infer<typeof userProfileSchema>;
