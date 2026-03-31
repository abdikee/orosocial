import { Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  fetchComments,
  fetchCurrentProfile,
  fetchFeed,
  togglePostLike,
  createComment,
  createPost,
  normalizeApiError,
} from '../services/socialApi';
import type { Comment, Post, SocialUser } from '../types/social';
import { BrandLogo } from '../components/BrandLogo';
import { CommentSection } from '../components/CommentSection';
import { CreatePostModal } from '../components/CreatePostModal';
import { NavigationBar } from '../components/NavigationBar';
import { PostCard } from '../components/PostCard';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

export function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUser, setCurrentUser] = useState<SocialUser | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [feedResult, me] = await Promise.all([fetchFeed(), fetchCurrentProfile()]);
        setPosts(feedResult.posts);
        setCurrentUser(me);
      } catch (loadError) {
        setError(normalizeApiError(loadError, 'Failed to load feed.'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleCreatePost = async (content: string, image?: string) => {
    try {
      const post = await createPost({ content, image });
      setPosts((previous) => [post, ...previous]);
    } catch (createError) {
      setError(normalizeApiError(createError, 'Failed to create post.'));
    }
  };

  const handleComment = async (postId: string) => {
    setSelectedPost(postId);
    setComments([]);
    try {
      const list = await fetchComments(postId);
      setComments(list);
    } catch (commentError) {
      setError(normalizeApiError(commentError, 'Failed to load comments.'));
    }
  };

  const handleAddComment = async (content: string) => {
    if (!selectedPost) {
      return;
    }
    try {
      const newComment = await createComment(selectedPost, content);
      setComments((previous) => [...previous, newComment]);
      setPosts((previousPosts) =>
        previousPosts.map((post) =>
          post.id === selectedPost
            ? {
                ...post,
                comments: post.comments + 1,
              }
            : post,
        ),
      );
    } catch (commentError) {
      setError(normalizeApiError(commentError, 'Failed to add comment.'));
    }
  };

  const handleLikeToggle = async (postId: string) => {
    const updated = await togglePostLike(postId);
    setPosts((previous) => previous.map((post) => (post.id === postId ? updated : post)));
  };

  const currentPost = posts.find((p) => p.id === selectedPost);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fcfcff_0%,#f7f5ff_30%,#f8fafc_100%)]">
      <NavigationBar currentUser={currentUser} onCreatePost={() => setShowCreatePost(true)} />

      {/* Main Content */}
      <main className="relative overflow-hidden pb-20 pt-16 md:pb-8">
        <div className="absolute left-[-7rem] top-20 h-72 w-72 rounded-full bg-violet-300/15 blur-3xl" />
        <div className="absolute right-[-6rem] top-52 h-80 w-80 rounded-full bg-amber-200/20 blur-3xl" />
        <div className="relative mx-auto max-w-2xl px-4 py-8">
          {/* Feed Header */}
          <div className="mb-8 overflow-hidden rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] backdrop-blur-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <BrandLogo size="md" showTagline />
                <h1 className="mt-5 text-3xl font-semibold text-neutral-900">Home Feed</h1>
                <p className="mt-2 text-neutral-600">A refined space to share, discover, and stay connected.</p>
              </div>
              <div className="hidden rounded-full border border-violet-100 bg-violet-50/70 px-3 py-2 text-violet-700 md:flex md:items-center md:gap-2">
                <Sparkles size={16} />
                <span className="text-sm font-medium">Premium social style</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => setShowCreatePost(true)}
                className="rounded-full bg-gradient-to-r from-slate-950 via-violet-700 to-amber-400 text-white shadow-[0_16px_30px_-18px_rgba(76,29,149,0.8)] hover:opacity-95"
              >
                Create a post
              </Button>
              <div className="rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm text-neutral-600">
                {posts.length} curated moments
              </div>
            </div>
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          </div>

          {/* Posts Feed */}
          <div className="space-y-1">
            {loading ? (
              <div className="rounded-[28px] border border-white/70 bg-white/85 px-6 py-12 text-center text-neutral-600 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.4)]">
                Loading feed...
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onComment={handleComment}
                  onLikeToggle={handleLikeToggle}
                />
              ))
            )}
          </div>

          {/* Empty State */}
          {posts.length === 0 && (
            <div className="rounded-[28px] border border-dashed border-violet-200 bg-white/80 px-6 py-14 text-center shadow-[0_20px_50px_-42px_rgba(15,23,42,0.4)]">
              <p className="mb-4 text-lg font-medium text-neutral-800">No posts yet. Be the first to share.</p>
              <button
                onClick={() => setShowCreatePost(true)}
                className="font-medium text-violet-700 hover:underline"
              >
                Create a post
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Create Post Modal */}
      <CreatePostModal
        open={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        currentUser={currentUser}
        onCreatePost={handleCreatePost}
      />

      {/* Comments Modal */}
      <Dialog
        open={!!selectedPost}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPost(null);
            setComments([]);
          }
        }}
      >
        <DialogContent className="flex h-[600px] flex-col overflow-hidden rounded-[32px] border border-white/70 bg-white/92 p-0 shadow-[0_40px_120px_-50px_rgba(15,23,42,0.55)] backdrop-blur-xl sm:max-w-[600px]">
          <div className="h-1 w-full bg-gradient-to-r from-slate-950 via-violet-700 to-amber-400" />
          <DialogHeader className="border-b border-neutral-200 px-6 py-4">
            <DialogTitle className="text-xl font-semibold text-neutral-900">Comments</DialogTitle>
          </DialogHeader>
          {currentPost && (
            <CommentSection
              comments={comments.length > 0 ? comments : currentPost.commentsList || []}
              currentUser={currentUser}
              onAddComment={handleAddComment}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
