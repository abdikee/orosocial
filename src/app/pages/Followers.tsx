import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { fetchCurrentProfile, fetchFollowers, normalizeApiError, toggleFollow } from '../services/socialApi';
import type { SocialUser } from '../types/social';
import { NavigationBar } from '../components/NavigationBar';
import { UserListItem } from '../components/UserListItem';

export function Followers() {
  const { userId } = useParams();
  const [currentUser, setCurrentUser] = useState<SocialUser | null>(null);
  const [followers, setFollowers] = useState<SocialUser[]>([]);
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
        const [me, users] = await Promise.all([fetchCurrentProfile(), fetchFollowers(userId)]);
        setCurrentUser(me);
        setFollowers(users);
      } catch (loadError) {
        setError(normalizeApiError(loadError, 'Failed to load followers.'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const handleFollowToggle = async (targetUserId: string) => {
    const updated = await toggleFollow(targetUserId);
    setFollowers((previous) =>
      previous.map((follower) => (follower.id === targetUserId ? updated : follower)),
    );
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fcfcff_0%,#f7f5ff_30%,#f8fafc_100%)]">
      <NavigationBar currentUser={currentUser} />

      {/* Main Content */}
      <main className="relative overflow-hidden pb-20 pt-16 md:pb-8">
        <div className="absolute right-[-6rem] top-28 h-72 w-72 rounded-full bg-amber-200/20 blur-3xl" />
        <div className="relative mx-auto max-w-2xl px-4 py-8">
          {/* Header */}
          <div className="mb-6 overflow-hidden rounded-[28px] border border-white/70 bg-white/88 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.45)] backdrop-blur-xl">
            <div className="flex items-center gap-4 border-b border-neutral-200 p-4">
              <Link
                to={`/profile/${userId}`}
                className="rounded-full border border-neutral-200 bg-white/90 p-2 transition-colors hover:bg-neutral-100"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-neutral-900">Followers</h1>
                <p className="text-sm text-neutral-600">{followers.length} followers</p>
                {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
              </div>
            </div>

            {/* Followers List */}
            <div className="divide-y divide-neutral-100">
              {loading ? (
                <p className="p-4 text-neutral-600">Loading followers...</p>
              ) : (
                followers.map((user) => (
                  <UserListItem key={user.id} user={user} onFollowToggle={handleFollowToggle} />
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
