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
import { CommentSection } from '../components/CommentSection';
import { CreatePostModal } from '../components/CreatePostModal';
import { NavigationBar } from '../components/NavigationBar';
import { PostCard } from '../components/PostCard';
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
    <div className="min-h-screen bg-neutral-50">
      <NavigationBar currentUser={currentUser} onCreatePost={() => setShowCreatePost(true)} />

      {/* Main Content */}
      <main className="pt-16 pb-20 md:pb-8">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Feed Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-neutral-900">Home Feed</h1>
            <p className="text-neutral-600 mt-1">See what's happening</p>
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          </div>

          {/* Posts Feed */}
          <div>
            {loading ? (
              <p className="text-neutral-600">Loading feed...</p>
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
            <div className="text-center py-12">
              <p className="text-neutral-500 mb-4">No posts yet. Be the first to share!</p>
              <button
                onClick={() => setShowCreatePost(true)}
                className="text-blue-600 hover:underline font-medium"
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
        <DialogContent className="sm:max-w-[600px] h-[600px] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b border-neutral-200">
            <DialogTitle>Comments</DialogTitle>
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
