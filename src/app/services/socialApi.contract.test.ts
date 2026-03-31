import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiClientError,
  createComment,
  createPost,
  fetchFeed,
  toggleFollow,
  togglePostLike,
} from './socialApi';

const { getSessionMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  edgeBaseUrl: 'https://example.supabase.co/functions/v1/server/make-server-112187e4/api/v1',
  supabase: {
    auth: {
      getSession: getSessionMock,
    },
  },
}));

function okResponse(payload: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
  };
}

describe('socialApi edge contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({
      data: {
        session: { access_token: 'test-token' },
      },
    });
  });

  it('calls feed endpoint with GET and auth header', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      okResponse({
        posts: [],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await fetchFeed();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.supabase.co/functions/v1/server/make-server-112187e4/api/v1/feed',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      }),
    );
  });

  it('creates post through POST /posts', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      okResponse({
        post: {
          id: 1,
          author_id: 'user-1',
          content: 'Hello',
          image_url: null,
          created_at: new Date().toISOString(),
          likes_count: 0,
          comments_count: 0,
          is_liked: false,
          author: {
            id: 'user-1',
            username: 'user',
            display_name: 'User',
            avatar_url: null,
            bio: '',
          },
          comments: [],
        },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await createPost({ content: 'Hello' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.supabase.co/functions/v1/server/make-server-112187e4/api/v1/posts',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ content: 'Hello' }),
      }),
    );
  });

  it('calls like/comment/follow mutation endpoints', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        okResponse({
          post: {
            id: 10,
            author_id: 'user-1',
            content: 'Liked',
            image_url: null,
            created_at: new Date().toISOString(),
            likes_count: 1,
            comments_count: 0,
            is_liked: true,
            author: {
              id: 'user-1',
              username: 'user',
              display_name: 'User',
              avatar_url: null,
              bio: '',
            },
            comments: [],
          },
        }),
      )
      .mockResolvedValueOnce(
        okResponse({
          comment: {
            id: 5,
            post_id: 10,
            author_id: 'user-1',
            content: 'Nice',
            created_at: new Date().toISOString(),
            author: {
              id: 'user-1',
              username: 'user',
              display_name: 'User',
              avatar_url: null,
              bio: '',
            },
          },
        }),
      )
      .mockResolvedValueOnce(
        okResponse({
          profile: {
            id: 'target-user',
            username: 'target',
            display_name: 'Target',
            avatar_url: null,
            bio: '',
            followers_count: 1,
            following_count: 1,
            is_following: true,
          },
        }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await togglePostLike('10');
    await createComment('10', 'Nice');
    await toggleFollow('target-user');

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://example.supabase.co/functions/v1/server/make-server-112187e4/api/v1/posts/10/likes',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://example.supabase.co/functions/v1/server/make-server-112187e4/api/v1/posts/10/comments',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ content: 'Nice' }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'https://example.supabase.co/functions/v1/server/make-server-112187e4/api/v1/profiles/target-user/follow',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('throws unauthorized when no session exists', async () => {
    getSessionMock.mockResolvedValue({
      data: {
        session: null,
      },
    });

    await expect(fetchFeed()).rejects.toEqual(
      expect.objectContaining<ApiClientError>({
        code: 'unauthorized',
      }),
    );
  });
});
