import { Settings, Grid3X3, List } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { BrandLogo } from '../components/BrandLogo';
import { NavigationBar } from '../components/NavigationBar';
import { PostCard } from '../components/PostCard';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import {
  fetchCurrentProfile,
  fetchFeed,
  fetchProfile,
  normalizeApiError,
  toggleFollow,
  togglePostLike,
} from '../services/socialApi';
import type { Post, SocialUser } from '../types/social';

export function Profile() {
  const { userId } = useParams();
  const [currentUser, setCurrentUser] = useState<SocialUser | null>(null);
  const [profileUser, setProfileUser] = useState<SocialUser | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) {
      return;
    }
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [me, profile, feed] = await Promise.all([
          fetchCurrentProfile(),
          fetchProfile(userId),
          fetchFeed(),
        ]);
        setCurrentUser(me);
        setProfileUser(profile);
        setPosts(feed.posts.filter((post) => post.userId === userId));
      } catch (loadError) {
        setError(normalizeApiError(loadError, 'Failed to load profile.'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const isOwnProfile = !!currentUser && !!profileUser && profileUser.id === currentUser.id;

  const handleFollow = async () => {
    if (!profileUser || isOwnProfile) {
      return;
    }
    try {
      const updated = await toggleFollow(profileUser.id);
      setProfileUser(updated);
    } catch (followError) {
      setError(normalizeApiError(followError, 'Failed to update follow status.'));
    }
  };

  const handlePostLike = async (postId: string) => {
    const updated = await togglePostLike(postId);
    setPosts((previous) => previous.map((post) => (post.id === postId ? updated : post)));
  };

  if (loading || !profileUser) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#fcfcff_0%,#f7f5ff_30%,#f8fafc_100%)]">
        <NavigationBar currentUser={currentUser} />
        <main className="pt-16 pb-20 md:pb-8">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="rounded-[28px] border border-white/70 bg-white/85 px-6 py-12 text-center text-neutral-600 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.4)]">
              Loading profile...
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fcfcff_0%,#f7f5ff_30%,#f8fafc_100%)]">
      <NavigationBar currentUser={currentUser} />

      {/* Main Content */}
      <main className="relative overflow-hidden pb-20 pt-16 md:pb-8">
        <div className="absolute left-[-7rem] top-24 h-80 w-80 rounded-full bg-violet-300/15 blur-3xl" />
        <div className="absolute right-[-7rem] top-44 h-80 w-80 rounded-full bg-amber-200/20 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-4 py-8">
          {/* Profile Header */}
          <div className="mb-6 overflow-hidden rounded-[32px] border border-white/70 bg-white/88 p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] backdrop-blur-xl md:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <BrandLogo size="sm" showTagline />
              <div className="rounded-full border border-violet-100 bg-violet-50/70 px-4 py-2 text-sm text-violet-700">
                Curated profile
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <Avatar className="mx-auto h-32 w-32 flex-shrink-0 ring-4 ring-violet-100 md:mx-0 md:h-40 md:w-40">
                <AvatarImage src={profileUser.avatar} alt={profileUser.name} />
                <AvatarFallback className="text-3xl">{profileUser.name.charAt(0)}</AvatarFallback>
              </Avatar>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">
                      {profileUser.name}
                    </h1>
                    <p className="text-neutral-600">@{profileUser.username}</p>
                  </div>

                  <div className="flex gap-2">
                    {isOwnProfile ? (
                      <>
                        <Button variant="outline" className="rounded-full border-neutral-300 bg-white/90 px-6">
                          <Settings size={18} className="mr-2" />
                          Edit Profile
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={handleFollow}
                          className={`rounded-full px-6 ${
                            profileUser.isFollowing
                              ? 'border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100'
                              : 'bg-gradient-to-r from-slate-950 via-violet-700 to-amber-400 text-white shadow-[0_16px_30px_-18px_rgba(76,29,149,0.8)] hover:opacity-95'
                          }`}
                        >
                          {profileUser.isFollowing ? 'Following' : 'Follow'}
                        </Button>
                        <Button variant="outline" className="rounded-full border-neutral-300 bg-white/90 px-4">
                          Message
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Bio */}
                <p className="text-neutral-700 mb-4">{profileUser.bio}</p>
                {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

                {/* Stats */}
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <div className="min-w-[92px] rounded-2xl border border-violet-100 bg-violet-50/50 px-4 py-3">
                    <p className="font-bold text-neutral-900">{posts.length}</p>
                    <p className="text-sm text-neutral-600">Posts</p>
                  </div>
                  <Link
                    to={`/profile/${profileUser.id}/followers`}
                    className="min-w-[92px] rounded-2xl border border-neutral-200 bg-white/80 px-4 py-3 transition-opacity hover:opacity-80"
                  >
                    <p className="font-bold text-neutral-900">{profileUser.followers}</p>
                    <p className="text-sm text-neutral-600">Followers</p>
                  </Link>
                  <Link
                    to={`/profile/${profileUser.id}/following`}
                    className="min-w-[92px] rounded-2xl border border-neutral-200 bg-white/80 px-4 py-3 transition-opacity hover:opacity-80"
                  >
                    <p className="font-bold text-neutral-900">{profileUser.following}</p>
                    <p className="text-sm text-neutral-600">Following</p>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Posts Section */}
          <div className="overflow-hidden rounded-[32px] border border-white/70 bg-white/88 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] backdrop-blur-xl">
            <Tabs defaultValue="posts" className="w-full">
              <div className="border-b border-neutral-200 px-4">
                <div className="flex items-center justify-between">
                  <TabsList className="bg-transparent">
                    <TabsTrigger value="posts" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-violet-700">
                      Posts
                    </TabsTrigger>
                    <TabsTrigger value="media" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-violet-700">
                      Media
                    </TabsTrigger>
                    <TabsTrigger value="likes" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-violet-700">
                      Likes
                    </TabsTrigger>
                  </TabsList>

                  {/* View Toggle */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setView('grid')}
                      className={`p-2 rounded-lg transition-colors ${
                        view === 'grid' ? 'bg-violet-100 text-violet-700' : 'text-neutral-600 hover:bg-neutral-100'
                      }`}
                    >
                      <Grid3X3 size={20} />
                    </button>
                    <button
                      onClick={() => setView('list')}
                      className={`p-2 rounded-lg transition-colors ${
                        view === 'list' ? 'bg-violet-100 text-violet-700' : 'text-neutral-600 hover:bg-neutral-100'
                      }`}
                    >
                      <List size={20} />
                    </button>
                  </div>
                </div>
              </div>

              <TabsContent value="posts" className="mt-0">
                {view === 'list' ? (
                  <div className="p-4 space-y-4">
                    {posts.map((post) => (
                      <PostCard key={post.id} post={post} onLikeToggle={handlePostLike} />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 p-3">
                    {posts.map((post) => (
                      <div key={post.id} className="group relative aspect-square cursor-pointer overflow-hidden rounded-[20px]">
                        {post.image ? (
                          <ImageWithFallback
                            src={post.image}
                            alt="Post"
                            className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-neutral-100 p-4">
                            <p className="text-sm text-neutral-600 line-clamp-3">{post.content}</p>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="text-white text-center">
                            <p className="text-sm font-medium">{post.likes} likes</p>
                            <p className="text-sm">{post.comments} comments</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {posts.length === 0 && (
                  <div className="p-12 text-center">
                    <p className="text-neutral-500">No posts yet</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="media" className="mt-0">
                <div className="grid grid-cols-3 gap-2 p-3">
                  {posts
                    .filter((post) => post.image)
                    .map((post) => (
                      <div key={post.id} className="group relative aspect-square cursor-pointer overflow-hidden rounded-[20px]">
                        <ImageWithFallback
                          src={post.image!}
                          alt="Post"
                          className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                        />
                      </div>
                    ))}
                </div>
                {posts.filter((post) => post.image).length === 0 && (
                  <div className="p-12 text-center">
                    <p className="text-neutral-500">No media posts yet</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="likes" className="mt-0">
                <div className="p-12 text-center">
                  <p className="text-neutral-500">Liked posts will appear here</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
