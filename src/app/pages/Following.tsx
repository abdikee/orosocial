import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { fetchCurrentProfile, fetchFollowing, normalizeApiError, toggleFollow } from '../services/socialApi';
import type { SocialUser } from '../types/social';
import { NavigationBar } from '../components/NavigationBar';
import { UserListItem } from '../components/UserListItem';

export function Following() {
  const { userId } = useParams();
  const [currentUser, setCurrentUser] = useState<SocialUser | null>(null);
  const [followingUsers, setFollowingUsers] = useState<SocialUser[]>([]);
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
        const [me, users] = await Promise.all([fetchCurrentProfile(), fetchFollowing(userId)]);
        setCurrentUser(me);
        setFollowingUsers(users);
      } catch (loadError) {
        setError(normalizeApiError(loadError, 'Failed to load following users.'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const handleFollowToggle = async (targetUserId: string) => {
    await toggleFollow(targetUserId);
    setFollowingUsers((previous) => previous.filter((user) => user.id !== targetUserId));
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <NavigationBar currentUser={currentUser} />

      {/* Main Content */}
      <main className="pt-16 pb-20 md:pb-8">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm mb-6">
            <div className="p-4 flex items-center gap-4 border-b border-neutral-200">
              <Link
                to={`/profile/${userId}`}
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-neutral-900">Following</h1>
                <p className="text-sm text-neutral-600">{followingUsers.length} following</p>
                {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
              </div>
            </div>

            {/* Following List */}
            <div className="divide-y divide-neutral-100">
              {loading ? (
                <p className="p-4 text-neutral-600">Loading following users...</p>
              ) : (
                followingUsers.map((user) => (
                  <UserListItem key={user.id} user={user} onFollowToggle={handleFollowToggle} />
                ))
              )}
            </div>

            {followingUsers.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-neutral-500">Not following anyone yet</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
