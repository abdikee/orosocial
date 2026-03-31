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
