import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiClientError,
  fetchFeed,
  normalizeApiError,
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

describe('socialApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({
      data: {
        session: { access_token: 'test-token' },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps feed response to UI post shape', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          posts: [
            {
              id: 1,
              author_id: 'author-1',
              content: 'hello world',
              image_url: null,
              created_at: new Date(Date.now() - 3600_000).toISOString(),
              likes_count: 3,
              comments_count: 2,
              is_liked: true,
              author: {
                id: 'author-1',
                username: 'jane',
                display_name: 'Jane',
                avatar_url: null,
                bio: 'bio',
              },
              comments: [],
            },
          ],
        }),
      }),
    );

    const result = await fetchFeed();

    expect(result.posts).toHaveLength(1);
    expect(result.posts[0]?.username).toBe('jane');
    expect(result.posts[0]?.likes).toBe(3);
    expect(result.posts[0]?.isLiked).toBe(true);
  });

  it('normalizes API client errors', () => {
    const message = normalizeApiError(
      new ApiClientError('Too many write requests.', 'rate_limited', 429),
    );
    expect(message).toBe('Too many requests. Please try again in a moment.');
  });
});
