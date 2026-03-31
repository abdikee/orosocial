import { z } from 'zod';

export const apiProfileSchema = z.object({
  id: z.string().uuid().or(z.string().min(1)),
  username: z.string().min(1),
  display_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  bio: z.string().nullable(),
  followers_count: z.number().int().nonnegative().optional(),
  following_count: z.number().int().nonnegative().optional(),
  is_following: z.boolean().optional(),
});

export const apiCommentSchema = z.object({
  id: z.union([z.string(), z.number()]),
  post_id: z.union([z.string(), z.number()]),
  author_id: z.string(),
  content: z.string(),
  created_at: z.string(),
  author: apiProfileSchema.nullable().optional(),
});

export const apiPostSchema = z.object({
  id: z.union([z.string(), z.number()]),
  author_id: z.string(),
  content: z.string(),
  image_url: z.string().nullable(),
  created_at: z.string(),
  likes_count: z.number().int().nonnegative(),
  comments_count: z.number().int().nonnegative(),
  is_liked: z.boolean(),
  author: apiProfileSchema.nullable().optional(),
  comments: z.array(apiCommentSchema).optional(),
});

export const feedResponseSchema = z.object({
  posts: z.array(apiPostSchema),
});

export const postResponseSchema = z.object({
  post: apiPostSchema,
});

export const commentsResponseSchema = z.object({
  comments: z.array(apiCommentSchema),
});

export const commentResponseSchema = z.object({
  comment: apiCommentSchema,
});

export const profileResponseSchema = z.object({
  profile: apiProfileSchema,
});

export const usersResponseSchema = z.object({
  users: z.array(apiProfileSchema),
});

export const createPostBodySchema = z.object({
  content: z.string().trim().max(5000),
  image: z.string().optional(),
});

export const createCommentBodySchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

export const updateProfileBodySchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  bio: z.string().trim().max(240).optional(),
  avatar: z.string().url().optional(),
});

export type ApiProfile = z.infer<typeof apiProfileSchema>;
export type ApiComment = z.infer<typeof apiCommentSchema>;
export type ApiPost = z.infer<typeof apiPostSchema>;
