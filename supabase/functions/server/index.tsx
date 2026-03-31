import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import { Hono, type Context } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { z } from "npm:zod@3.24.2";
import {
  commentResponseSchema,
  commentsResponseSchema,
  createCommentBodySchema,
  createPostBodySchema,
  feedResponseSchema,
  postIdParamSchema,
  postResponseSchema,
  profileResponseSchema,
  searchQuerySchema,
  updateProfileBodySchema,
  userIdParamSchema,
  usersResponseSchema,
} from "./schemas.ts";

const BASE_PATH = "/make-server-112187e4";
const API_PATH = `${BASE_PATH}/api/v1`;

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") || "http://localhost:5173")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);
const writeRateLimitWindowMs = Number(Deno.env.get("WRITE_RATE_LIMIT_WINDOW_MS") || "60000");
const writeRateLimitMax = Number(Deno.env.get("WRITE_RATE_LIMIT_MAX") || "60");

if (!supabaseUrl || !serviceRoleKey || !anonKey) {
  throw new Error("Missing required Supabase environment variables.");
}

const service = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const anon = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const app = new Hono();
const writeRateStore = new Map<string, { count: number; resetAt: number }>();

app.use("*", logger(console.log));
app.use(
  "/*",
  cors({
    origin: (requestOrigin) => {
      if (!requestOrigin) {
        return allowedOrigins[0] || "";
      }
      if (allowedOrigins.includes("*")) {
        return requestOrigin;
      }
      return allowedOrigins.includes(requestOrigin) ? requestOrigin : "";
    },
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

type AuthedUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

type ApiErrorCode =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "rate_limited"
  | "not_found"
  | "validation_error"
  | "internal_error";

const parseBearer = (value: string | undefined | null) => {
  if (!value) return null;
  const [scheme, token] = value.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
};

function apiError(c: Context, status: number, code: ApiErrorCode, error: string) {
  return c.json({ error, code }, status);
}

function parseWithSchema<T>(schema: z.ZodSchema<T>, payload: unknown): T {
  const result = schema.safeParse(payload);
  if (!result.success) {
    const issue = result.error.issues[0];
    throw new Error(`validation:${issue?.message || "Invalid request."}`);
  }
  return result.data;
}

function validateResponse<T>(schema: z.ZodSchema<T>, payload: T) {
  return parseWithSchema(schema, payload);
}

function isValidationError(error: unknown) {
  return error instanceof Error && error.message.startsWith("validation:");
}

function validationMessage(error: unknown) {
  if (!isValidationError(error)) {
    return "Invalid request.";
  }
  return error.message.replace("validation:", "");
}

function getClientIp(c: Context) {
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return c.req.header("x-real-ip") || c.req.header("cf-connecting-ip") || "unknown";
}

function isWriteMethod(method: string) {
  return method === "POST" || method === "PATCH" || method === "PUT" || method === "DELETE";
}

async function ensureProfile(user: AuthedUser) {
  const { data: existing, error: existingError } = await service
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    return;
  }

  const emailPrefix = user.email?.split("@")[0]?.toLowerCase() || `user_${user.id.slice(0, 8)}`;
  const displayName = typeof user.user_metadata?.display_name === "string"
    ? user.user_metadata.display_name
    : emailPrefix;
  const username = typeof user.user_metadata?.username === "string"
    ? user.user_metadata.username.toLowerCase().replace(/\s+/g, "_")
    : emailPrefix;

  const { error: insertError } = await service.from("profiles").insert({
    id: user.id,
    username,
    display_name: displayName,
    avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
    bio: "",
  });

  if (insertError) {
    throw new Error(insertError.message);
  }
}

async function getFollowCounts(profileId: string) {
  const [followersResult, followingResult] = await Promise.all([
    service
      .from("follows")
      .select("follower_id", { count: "exact", head: true })
      .eq("following_id", profileId),
    service
      .from("follows")
      .select("following_id", { count: "exact", head: true })
      .eq("follower_id", profileId),
  ]);

  if (followersResult.error) {
    throw new Error(followersResult.error.message);
  }
  if (followingResult.error) {
    throw new Error(followingResult.error.message);
  }

  return {
    followers_count: followersResult.count || 0,
    following_count: followingResult.count || 0,
  };
}

async function buildProfile(viewerId: string, targetId: string) {
  const { data, error } = await service
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio")
    .eq("id", targetId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const [{ followers_count, following_count }, relation] = await Promise.all([
    getFollowCounts(targetId),
    service
      .from("follows")
      .select("follower_id")
      .eq("follower_id", viewerId)
      .eq("following_id", targetId)
      .maybeSingle(),
  ]);

  if (relation.error) {
    throw new Error(relation.error.message);
  }

  return {
    ...data,
    followers_count,
    following_count,
    is_following: !!relation.data,
  };
}

async function buildPost(postId: number, viewerId: string) {
  const postResult = await service
    .from("posts")
    .select(
      "id, author_id, content, image_url, created_at, author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url, bio)",
    )
    .eq("id", postId)
    .maybeSingle();

  if (postResult.error) {
    throw new Error(postResult.error.message);
  }

  if (!postResult.data) {
    return null;
  }

  const [likesResult, commentsResult, likedResult] = await Promise.all([
    service.from("likes").select("post_id", { count: "exact", head: true }).eq("post_id", postId),
    service
      .from("comments")
      .select("post_id", { count: "exact", head: true })
      .eq("post_id", postId),
    service
      .from("likes")
      .select("post_id")
      .eq("post_id", postId)
      .eq("user_id", viewerId)
      .maybeSingle(),
  ]);

  if (likesResult.error) throw new Error(likesResult.error.message);
  if (commentsResult.error) throw new Error(commentsResult.error.message);
  if (likedResult.error) throw new Error(likedResult.error.message);

  return {
    ...postResult.data,
    likes_count: likesResult.count || 0,
    comments_count: commentsResult.count || 0,
    is_liked: !!likedResult.data,
  };
}

async function buildComments(postId: number) {
  const { data, error } = await service
    .from("comments")
    .select(
      "id, post_id, author_id, content, created_at, author:profiles!comments_author_id_fkey(id, username, display_name, avatar_url, bio)",
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

app.get(`${BASE_PATH}/health`, (c) => c.json({ status: "ok" }));

app.use(`${API_PATH}/*`, async (c, next) => {
  try {
    if (isWriteMethod(c.req.method)) {
      const ip = getClientIp(c);
      const key = `${ip}:${c.req.path}`;
      const now = Date.now();
      const current = writeRateStore.get(key);

      if (!current || now >= current.resetAt) {
        writeRateStore.set(key, { count: 1, resetAt: now + writeRateLimitWindowMs });
      } else {
        if (current.count >= writeRateLimitMax) {
          return apiError(c, 429, "rate_limited", "Too many write requests. Please try again later.");
        }
        current.count += 1;
        writeRateStore.set(key, current);
      }
    }

    const token = parseBearer(c.req.header("Authorization"));
    if (!token) {
      return apiError(c, 401, "unauthorized", "Missing bearer token.");
    }

    const { data, error } = await anon.auth.getUser(token);
    if (error || !data.user) {
      return apiError(c, 401, "unauthorized", "Invalid token.");
    }

    const user: AuthedUser = {
      id: data.user.id,
      email: data.user.email,
      user_metadata: data.user.user_metadata as Record<string, unknown>,
    };

    await ensureProfile(user);
    c.set("authUser", user);
    await next();
  } catch (middlewareError) {
    return apiError(
      c,
      500,
      "internal_error",
      middlewareError instanceof Error ? middlewareError.message : "Auth middleware error.",
    );
  }
});

app.get(`${API_PATH}/feed`, async (c) => {
  try {
    const authUser = c.get("authUser") as AuthedUser;
    const { data: posts, error } = await service
      .from("posts")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      throw new Error(error.message);
    }

    const enriched = await Promise.all(
      (posts || []).map(async (row) => {
        const post = await buildPost(Number(row.id), authUser.id);
        if (!post) return null;
        const comments = await buildComments(Number(row.id));
        return { ...post, comments };
      }),
    );

    const response = validateResponse(feedResponseSchema, {
      posts: enriched.filter(Boolean),
    });
    return c.json(response);
  } catch (feedError) {
    return apiError(c, 500, "internal_error", feedError instanceof Error ? feedError.message : "Failed to fetch feed.");
  }
});

app.post(`${API_PATH}/posts`, async (c) => {
  try {
    const authUser = c.get("authUser") as AuthedUser;
    const body = parseWithSchema(createPostBodySchema, await c.req.json());
    const content = body.content;
    const image = body.image && body.image.length > 0 ? body.image : null;

    const { data, error } = await service
      .from("posts")
      .insert({
        author_id: authUser.id,
        content,
        image_url: image,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const post = await buildPost(Number(data.id), authUser.id);
    const response = validateResponse(postResponseSchema, { post });
    return c.json(response);
  } catch (postError) {
    if (isValidationError(postError)) {
      return apiError(c, 400, "validation_error", validationMessage(postError));
    }
    return apiError(c, 500, "internal_error", postError instanceof Error ? postError.message : "Failed to create post.");
  }
});

app.post(`${API_PATH}/posts/:postId/likes`, async (c) => {
  try {
    const authUser = c.get("authUser") as AuthedUser;
    const params = parseWithSchema(postIdParamSchema, c.req.param());
    const postId = params.postId;

    const existing = await service
      .from("likes")
      .select("post_id")
      .eq("post_id", postId)
      .eq("user_id", authUser.id)
      .maybeSingle();

    if (existing.error) {
      throw new Error(existing.error.message);
    }

    if (existing.data) {
      const { error } = await service
        .from("likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", authUser.id);
      if (error) {
        throw new Error(error.message);
      }
    } else {
      const { error } = await service.from("likes").insert({ post_id: postId, user_id: authUser.id });
      if (error) {
        throw new Error(error.message);
      }
    }

    const post = await buildPost(postId, authUser.id);
    const response = validateResponse(postResponseSchema, { post });
    return c.json(response);
  } catch (likeError) {
    if (isValidationError(likeError)) {
      return apiError(c, 400, "validation_error", validationMessage(likeError));
    }
    return apiError(c, 500, "internal_error", likeError instanceof Error ? likeError.message : "Failed to toggle like.");
  }
});

app.get(`${API_PATH}/posts/:postId/comments`, async (c) => {
  try {
    const params = parseWithSchema(postIdParamSchema, c.req.param());
    const comments = await buildComments(params.postId);
    const response = validateResponse(commentsResponseSchema, { comments });
    return c.json(response);
  } catch (commentError) {
    if (isValidationError(commentError)) {
      return apiError(c, 400, "validation_error", validationMessage(commentError));
    }
    return apiError(
      c,
      500,
      "internal_error",
      commentError instanceof Error ? commentError.message : "Failed to fetch comments.",
    );
  }
});

app.post(`${API_PATH}/posts/:postId/comments`, async (c) => {
  try {
    const authUser = c.get("authUser") as AuthedUser;
    const params = parseWithSchema(postIdParamSchema, c.req.param());
    const body = parseWithSchema(createCommentBodySchema, await c.req.json());

    const insertResult = await service
      .from("comments")
      .insert({
        post_id: params.postId,
        author_id: authUser.id,
        content: body.content,
      })
      .select("id")
      .single();

    if (insertResult.error) {
      throw new Error(insertResult.error.message);
    }

    const comments = await buildComments(params.postId);
    const comment = comments.find((item) => Number(item.id) === Number(insertResult.data.id)) || null;
    const response = validateResponse(commentResponseSchema, { comment });
    return c.json(response);
  } catch (createCommentError) {
    if (isValidationError(createCommentError)) {
      return apiError(c, 400, "validation_error", validationMessage(createCommentError));
    }
    return apiError(
      c,
      500,
      "internal_error",
      createCommentError instanceof Error ? createCommentError.message : "Failed to create comment.",
    );
  }
});

app.get(`${API_PATH}/profiles/me`, async (c) => {
  try {
    const authUser = c.get("authUser") as AuthedUser;
    const profile = await buildProfile(authUser.id, authUser.id);
    const response = validateResponse(profileResponseSchema, { profile });
    return c.json(response);
  } catch (profileError) {
    return apiError(
      c,
      500,
      "internal_error",
      profileError instanceof Error ? profileError.message : "Failed to fetch profile.",
    );
  }
});

app.patch(`${API_PATH}/profiles/me`, async (c) => {
  try {
    const authUser = c.get("authUser") as AuthedUser;
    const body = parseWithSchema(updateProfileBodySchema, await c.req.json());
    const payload: Record<string, string> = {};
    if (body.name) payload.display_name = body.name;
    if (body.bio !== undefined) payload.bio = body.bio;
    if (body.avatar) payload.avatar_url = body.avatar;

    const update = await service
      .from("profiles")
      .update(payload)
      .eq("id", authUser.id);

    if (update.error) {
      throw new Error(update.error.message);
    }

    const profile = await buildProfile(authUser.id, authUser.id);
    const response = validateResponse(profileResponseSchema, { profile });
    return c.json(response);
  } catch (updateError) {
    if (isValidationError(updateError)) {
      return apiError(c, 400, "validation_error", validationMessage(updateError));
    }
    return apiError(c, 500, "internal_error", updateError instanceof Error ? updateError.message : "Failed to update profile.");
  }
});

app.get(`${API_PATH}/profiles/:userId`, async (c) => {
  try {
    const authUser = c.get("authUser") as AuthedUser;
    const params = parseWithSchema(userIdParamSchema, c.req.param());
    const profile = await buildProfile(authUser.id, params.userId);
    if (!profile) {
      return apiError(c, 404, "not_found", "Profile not found.");
    }
    const response = validateResponse(profileResponseSchema, { profile });
    return c.json(response);
  } catch (error) {
    if (isValidationError(error)) {
      return apiError(c, 400, "validation_error", validationMessage(error));
    }
    return apiError(c, 500, "internal_error", error instanceof Error ? error.message : "Failed to fetch profile.");
  }
});

app.get(`${API_PATH}/profiles/:userId/followers`, async (c) => {
  try {
    const authUser = c.get("authUser") as AuthedUser;
    const params = parseWithSchema(userIdParamSchema, c.req.param());
    const result = await service
      .from("follows")
      .select("follower:profiles!follows_follower_id_fkey(id, username, display_name, avatar_url, bio)")
      .eq("following_id", params.userId);

    if (result.error) {
      throw new Error(result.error.message);
    }

    const users = await Promise.all(
      (result.data || [])
        .map((row: Record<string, unknown>) => row.follower as Record<string, unknown> | null)
        .filter(Boolean)
        .map(async (row) => {
          const profile = await buildProfile(authUser.id, String(row?.id));
          return profile;
        }),
    );

    const response = validateResponse(usersResponseSchema, {
      users: users.filter(Boolean),
    });
    return c.json(response);
  } catch (error) {
    if (isValidationError(error)) {
      return apiError(c, 400, "validation_error", validationMessage(error));
    }
    return apiError(c, 500, "internal_error", error instanceof Error ? error.message : "Failed to fetch followers.");
  }
});

app.get(`${API_PATH}/profiles/:userId/following`, async (c) => {
  try {
    const authUser = c.get("authUser") as AuthedUser;
    const params = parseWithSchema(userIdParamSchema, c.req.param());
    const result = await service
      .from("follows")
      .select("following:profiles!follows_following_id_fkey(id, username, display_name, avatar_url, bio)")
      .eq("follower_id", params.userId);

    if (result.error) {
      throw new Error(result.error.message);
    }

    const users = await Promise.all(
      (result.data || [])
        .map((row: Record<string, unknown>) => row.following as Record<string, unknown> | null)
        .filter(Boolean)
        .map(async (row) => {
          const profile = await buildProfile(authUser.id, String(row?.id));
          return profile;
        }),
    );

    const response = validateResponse(usersResponseSchema, {
      users: users.filter(Boolean),
    });
    return c.json(response);
  } catch (error) {
    if (isValidationError(error)) {
      return apiError(c, 400, "validation_error", validationMessage(error));
    }
    return apiError(c, 500, "internal_error", error instanceof Error ? error.message : "Failed to fetch following users.");
  }
});

app.post(`${API_PATH}/profiles/:userId/follow`, async (c) => {
  try {
    const authUser = c.get("authUser") as AuthedUser;
    const params = parseWithSchema(userIdParamSchema, c.req.param());
    const targetId = params.userId;
    if (targetId === authUser.id) {
      return apiError(c, 400, "bad_request", "Cannot follow yourself.");
    }

    const existing = await service
      .from("follows")
      .select("follower_id")
      .eq("follower_id", authUser.id)
      .eq("following_id", targetId)
      .maybeSingle();

    if (existing.error) {
      throw new Error(existing.error.message);
    }

    if (existing.data) {
      const del = await service
        .from("follows")
        .delete()
        .eq("follower_id", authUser.id)
        .eq("following_id", targetId);
      if (del.error) {
        throw new Error(del.error.message);
      }
    } else {
      const insert = await service
        .from("follows")
        .insert({ follower_id: authUser.id, following_id: targetId });
      if (insert.error) {
        throw new Error(insert.error.message);
      }
    }

    const profile = await buildProfile(authUser.id, targetId);
    const response = validateResponse(profileResponseSchema, { profile });
    return c.json(response);
  } catch (error) {
    if (isValidationError(error)) {
      return apiError(c, 400, "validation_error", validationMessage(error));
    }
    return apiError(c, 500, "internal_error", error instanceof Error ? error.message : "Failed to toggle follow state.");
  }
});

app.get(`${API_PATH}/search`, async (c) => {
  try {
    const authUser = c.get("authUser") as AuthedUser;
    const query = parseWithSchema(searchQuerySchema, { query: c.req.query("query") }).query;

    let dbQuery = service
      .from("profiles")
      .select("id")
      .neq("id", authUser.id)
      .limit(20);

    if (query.length > 0) {
      const safe = query.replace(/,/g, "");
      dbQuery = dbQuery.or(`username.ilike.%${safe}%,display_name.ilike.%${safe}%`);
    }

    const result = await dbQuery;
    if (result.error) {
      throw new Error(result.error.message);
    }

    const users = await Promise.all(
      (result.data || []).map(async (row) => buildProfile(authUser.id, String(row.id))),
    );

    const response = validateResponse(usersResponseSchema, {
      users: users.filter(Boolean),
    });
    return c.json(response);
  } catch (error) {
    if (isValidationError(error)) {
      return apiError(c, 400, "validation_error", validationMessage(error));
    }
    return apiError(c, 500, "internal_error", error instanceof Error ? error.message : "Search failed.");
  }
});

Deno.serve(app.fetch);