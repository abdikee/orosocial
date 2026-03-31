import { edgeBaseUrl, missingSupabaseEnvMessage, supabase } from '../lib/supabase';
import {
  commentResponseSchema,
  commentsResponseSchema,
  createCommentBodySchema,
  createPostBodySchema,
  feedResponseSchema,
  postResponseSchema,
  profileResponseSchema,
  updateProfileBodySchema,
  usersResponseSchema,
} from '../types/apiSchemas';
import type { Comment, FeedResponse, Post, SocialUser } from '../types/social';
import { z } from 'zod';

type ApiErrorCode =
  | 'bad_request'
  | 'unauthorized'
  | 'forbidden'
  | 'rate_limited'
  | 'not_found'
  | 'validation_error'
  | 'internal_error'
  | 'invalid_response';

interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
}

export class ApiClientError extends Error {
  code: ApiErrorCode;
  status?: number;

  constructor(message: string, code: ApiErrorCode = 'internal_error', status?: number) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
  }
}

export function normalizeApiError(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
) {
  if (error instanceof ApiClientError) {
    if (error.code === 'unauthorized') return 'Please sign in again.';
    if (error.code === 'rate_limited') return 'Too many requests. Please try again in a moment.';
    if (error.code === 'validation_error') return error.message;
    if (error.code === 'not_found') return 'The requested data was not found.';
    return error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = Date.now();
  const diffSeconds = Math.max(1, Math.floor((now - date.getTime()) / 1000));
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

async function edgeFetch<T>(path: string, schema: z.ZodSchema<T>, options: ApiOptions = {}): Promise<T> {
  const { skipAuth, headers, ...rest } = options;
  if (!supabase || !edgeBaseUrl) {
    throw new ApiClientError(missingSupabaseEnvMessage, 'internal_error');
  }
  const session = (await supabase.auth.getSession()).data.session;

  if (!skipAuth && !session?.access_token) {
    throw new ApiClientError('Not authenticated.', 'unauthorized', 401);
  }

  const response = await fetch(`${edgeBaseUrl}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...headers,
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof payload?.error === 'string' ? payload.error : 'Request failed';
    const code = typeof payload?.code === 'string' ? payload.code : 'internal_error';
    throw new ApiClientError(message, code as ApiErrorCode, response.status);
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiClientError('Received an unexpected response from server.', 'invalid_response', response.status);
  }

  return parsed.data;
}

interface ApiProfileRow {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  followers_count?: number;
  following_count?: number;
  is_following?: boolean;
}

interface ApiPostCommentRow {
  id: string | number;
  post_id: string | number;
  author_id: string;
  content: string;
  created_at: string;
  author?: ApiProfileRow | null;
}

interface ApiPostRow {
  id: string | number;
  author_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  author?: ApiProfileRow | null;
  comments?: ApiPostCommentRow[];
}

function toSocialUser(row: ApiProfileRow): SocialUser {
  return {
    id: row.id,
    username: row.username,
    name: row.display_name || row.username,
    avatar: row.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.username}`,
    bio: row.bio || '',
    followers: row.followers_count || 0,
    following: row.following_count || 0,
    isFollowing: row.is_following,
  };
}

function toComment(row: ApiPostCommentRow): Comment {
  const author = row.author;
  return {
    id: String(row.id),
    postId: String(row.post_id),
    userId: row.author_id,
    username: author?.username || 'user',
    avatar:
      author?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author?.username || row.author_id}`,
    content: row.content,
    timestamp: formatRelativeTime(row.created_at),
  };
}

function toPost(row: ApiPostRow): Post {
  const author = row.author;
  return {
    id: String(row.id),
    userId: row.author_id,
    username: author?.username || 'user',
    avatar:
      author?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author?.username || row.author_id}`,
    content: row.content,
    image: row.image_url || undefined,
    likes: row.likes_count || 0,
    comments: row.comments_count || 0,
    shares: 0,
    timestamp: formatRelativeTime(row.created_at),
    isLiked: row.is_liked,
    commentsList: (row.comments || []).map(toComment),
  };
}

export async function fetchFeed(): Promise<FeedResponse> {
  const result = await edgeFetch('/feed', feedResponseSchema, { method: 'GET' });
  return { posts: result.posts.map(toPost) };
}

export async function createPost(input: { content: string; image?: string }) {
  const body = createPostBodySchema.parse(input);
  const result = await edgeFetch('/posts', postResponseSchema, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return toPost(result.post);
}

export async function togglePostLike(postId: string) {
  const result = await edgeFetch(`/posts/${postId}/likes`, postResponseSchema, {
    method: 'POST',
  });
  return toPost(result.post);
}

export async function fetchComments(postId: string) {
  const result = await edgeFetch(`/posts/${postId}/comments`, commentsResponseSchema, {
    method: 'GET',
  });
  return result.comments.map(toComment);
}

export async function createComment(postId: string, content: string) {
  const body = createCommentBodySchema.parse({ content });
  const result = await edgeFetch(`/posts/${postId}/comments`, commentResponseSchema, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!result.comment) {
    throw new ApiClientError('Comment could not be created.', 'internal_error');
  }
  return toComment(result.comment);
}

export async function fetchProfile(userId: string) {
  const result = await edgeFetch(`/profiles/${userId}`, profileResponseSchema, { method: 'GET' });
  if (!result.profile) {
    throw new ApiClientError('Profile not found.', 'not_found', 404);
  }
  return toSocialUser(result.profile);
}

export async function fetchCurrentProfile() {
  const result = await edgeFetch('/profiles/me', profileResponseSchema, { method: 'GET' });
  if (!result.profile) {
    throw new ApiClientError('Profile not found.', 'not_found', 404);
  }
  return toSocialUser(result.profile);
}

export async function updateMyProfile(payload: { name?: string; bio?: string; avatar?: string }) {
  const body = updateProfileBodySchema.parse(payload);
  const result = await edgeFetch('/profiles/me', profileResponseSchema, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (!result.profile) {
    throw new ApiClientError('Profile not found.', 'not_found', 404);
  }
  return toSocialUser(result.profile);
}

export async function fetchFollowers(userId: string) {
  const result = await edgeFetch(`/profiles/${userId}/followers`, usersResponseSchema, {
    method: 'GET',
  });
  return result.users.map(toSocialUser);
}

export async function fetchFollowing(userId: string) {
  const result = await edgeFetch(`/profiles/${userId}/following`, usersResponseSchema, {
    method: 'GET',
  });
  return result.users.map(toSocialUser);
}

export async function searchUsers(query: string) {
  const encoded = encodeURIComponent(query);
  const result = await edgeFetch(`/search?query=${encoded}`, usersResponseSchema, {
    method: 'GET',
  });
  return result.users.map(toSocialUser);
}

export async function toggleFollow(userId: string) {
  const result = await edgeFetch(`/profiles/${userId}/follow`, profileResponseSchema, {
    method: 'POST',
  });
  if (!result.profile) {
    throw new ApiClientError('Profile not found.', 'not_found', 404);
  }
  return toSocialUser(result.profile);
}
