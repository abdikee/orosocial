import { Search as SearchIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchCurrentProfile, normalizeApiError, searchUsers, toggleFollow } from '../services/socialApi';
import type { SocialUser } from '../types/social';
import { NavigationBar } from '../components/NavigationBar';
import { UserListItem } from '../components/UserListItem';
import { Input } from '../components/ui/input';

export function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<SocialUser | null>(null);
  const [users, setUsers] = useState<SocialUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCurrentProfile()
      .then(setCurrentUser)
      .catch(() => {
        // Keep page usable even if profile fetch temporarily fails.
      });
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const results = await searchUsers(searchQuery.trim());
        setUsers(results);
      } catch (loadError) {
        setError(normalizeApiError(loadError, 'Search failed.'));
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleFollowToggle = async (targetUserId: string) => {
    const updated = await toggleFollow(targetUserId);
    setUsers((previous) => previous.map((user) => (user.id === targetUserId ? updated : user)));
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fcfcff_0%,#f7f5ff_30%,#f8fafc_100%)]">
      <NavigationBar currentUser={currentUser} />

      {/* Main Content */}
      <main className="relative overflow-hidden pb-20 pt-16 md:pb-8">
        <div className="absolute left-[-7rem] top-24 h-72 w-72 rounded-full bg-violet-300/15 blur-3xl" />
        <div className="relative mx-auto max-w-2xl px-4 py-8">
          {/* Search Header */}
          <div className="mb-6 rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.45)] backdrop-blur-xl">
            <h1 className="mb-2 text-2xl font-bold text-neutral-900">Search</h1>
            <p className="mb-4 text-neutral-600">Discover creators, friends, and inspiring profiles.</p>
            
            {/* Search Input */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for people..."
                className="h-12 rounded-full border-neutral-200 bg-white/90 pl-10 focus:border-violet-400"
              />
            </div>
          </div>

          {/* Results */}
          <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/88 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.45)] backdrop-blur-xl">
            <div className="border-b border-neutral-200 p-4">
              <h2 className="font-semibold text-neutral-900">
                {searchQuery ? `Results for "${searchQuery}"` : 'Suggested People'}
              </h2>
              {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
            </div>

            <div className="divide-y divide-neutral-100">
              {loading ? (
                <p className="p-4 text-neutral-600">Loading users...</p>
              ) : users.length > 0 ? (
                users.map((user) => (
                  <UserListItem key={user.id} user={user} onFollowToggle={handleFollowToggle} />
                ))
              ) : (
                <div className="p-12 text-center">
                  <p className="text-neutral-500">No users found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
