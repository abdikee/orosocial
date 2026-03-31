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
    <div className="min-h-screen bg-neutral-50">
      <NavigationBar currentUser={currentUser} />

      {/* Main Content */}
      <main className="pt-16 pb-20 md:pb-8">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Search Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-neutral-900 mb-4">Search</h1>
            
            {/* Search Input */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for people..."
                className="pl-10 rounded-full border-neutral-300 focus:border-blue-500 h-12"
              />
            </div>
          </div>

          {/* Results */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-neutral-200">
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
