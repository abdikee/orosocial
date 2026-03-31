import { z } from "npm:zod@3.24.2";

export const userIdParamSchema = z.object({
  userId: z.string().uuid(),
});

export const postIdParamSchema = z.object({
  postId: z.coerce.number().int().positive(),
});

export const searchQuerySchema = z.object({
  query: z.string().trim().max(80).optional().default(""),
});

export const createPostBodySchema = z
  .object({
    content: z.string().trim().max(5000).default(""),
    image: z.string().trim().optional().or(z.literal("")),
  })
  .refine((value) => value.content.length > 0 || !!value.image, {
    message: "Post must include text or image.",
  });

export const createCommentBodySchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

export const updateProfileBodySchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    bio: z.string().trim().max(240).optional(),
    avatar: z.string().trim().url().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "No profile updates provided.",
  });

export const profileSchema = z.object({
  id: z.string(),
  username: z.string(),
  display_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  bio: z.string().nullable(),
  followers_count: z.number().int().nonnegative().optional(),
  following_count: z.number().int().nonnegative().optional(),
  is_following: z.boolean().optional(),
});

export const commentSchema = z.object({
  id: z.union([z.number(), z.string()]),
  post_id: z.union([z.number(), z.string()]),
  author_id: z.string(),
  content: z.string(),
  created_at: z.string(),
  author: profileSchema.optional().nullable(),
});

export const postSchema = z.object({
  id: z.union([z.number(), z.string()]),
  author_id: z.string(),
  content: z.string(),
  image_url: z.string().nullable(),
  created_at: z.string(),
  likes_count: z.number().int().nonnegative(),
  comments_count: z.number().int().nonnegative(),
  is_liked: z.boolean(),
  author: profileSchema.optional().nullable(),
  comments: z.array(commentSchema).optional(),
});

export const feedResponseSchema = z.object({
  posts: z.array(postSchema),
});

export const profileResponseSchema = z.object({
  profile: profileSchema.nullable(),
});

export const usersResponseSchema = z.object({
  users: z.array(profileSchema),
});

export const postResponseSchema = z.object({
  post: postSchema.nullable(),
});

export const commentResponseSchema = z.object({
  comment: commentSchema.nullable(),
});

export const commentsResponseSchema = z.object({
  comments: z.array(commentSchema),
});

export type ProfileShape = z.infer<typeof profileSchema>;
export type CommentShape = z.infer<typeof commentSchema>;
export type PostShape = z.infer<typeof postSchema>;
