import { Home, Search, PlusSquare, User, Menu, Bell } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import type { SocialUser } from '../types/social';
import { BrandLogo } from './BrandLogo';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';

interface NavigationBarProps {
  onCreatePost?: () => void;
  currentUser?: SocialUser | null;
}

function getFallbackProfile(user: { id: string; email?: string | null }) {
  const base = user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`;
  return {
    id: user.id,
    username: base,
    name: base,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${base}`,
  };
}

export function NavigationBar({ onCreatePost, currentUser }: NavigationBarProps) {
  const location = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { user, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;
  const resolvedUser =
    currentUser ||
    (user
      ? {
          ...getFallbackProfile(user),
          bio: '',
          followers: 0,
          following: 0,
        }
      : null);

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="fixed left-0 right-0 top-0 z-50 hidden border-b border-white/60 bg-white/80 backdrop-blur-xl md:flex">
        <div className="w-full max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/" className="transition-transform duration-200 hover:scale-[1.01]">
            <BrandLogo size="md" />
          </Link>

          <div className="flex items-center gap-6">
            <Link
              to="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isActive('/') ? 'text-blue-600 bg-blue-50' : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              <Home size={20} />
              <span>Home</span>
            </Link>

            <button
              onClick={onCreatePost}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <PlusSquare size={20} />
              <span>Create</span>
            </button>

            <Link
              to={`/profile/${resolvedUser?.id || ''}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                location.pathname.includes('/profile') ? 'text-blue-600 bg-blue-50' : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              <User size={20} />
              <span>Profile</span>
            </Link>

            <button className="p-2 rounded-lg text-neutral-700 hover:bg-neutral-100 transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full"></span>
            </button>

            {resolvedUser && (
              <Avatar className="w-8 h-8 cursor-pointer">
                <AvatarImage src={resolvedUser.avatar} alt={resolvedUser.name} />
                <AvatarFallback>{resolvedUser.name.charAt(0)}</AvatarFallback>
              </Avatar>
            )}
            <Button variant="outline" className="rounded-full" onClick={() => signOut()}>
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/60 bg-white/80 backdrop-blur-xl md:hidden">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link to="/" className="transition-transform duration-200 active:scale-[0.98]">
            <BrandLogo size="sm" />
          </Link>

          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg text-neutral-700 hover:bg-neutral-100 transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full"></span>
            </button>
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-lg text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {showMobileMenu && (
          <div className="bg-white border-t border-neutral-200 py-2">
            <Link
              to="/"
              onClick={() => setShowMobileMenu(false)}
              className={`flex items-center gap-3 px-4 py-3 ${
                isActive('/') ? 'text-blue-600 bg-blue-50' : 'text-neutral-700'
              }`}
            >
              <Home size={20} />
              <span>Home</span>
            </Link>
            <button
              onClick={() => {
                setShowMobileMenu(false);
                onCreatePost?.();
              }}
              className="flex items-center gap-3 px-4 py-3 text-neutral-700 w-full"
            >
              <PlusSquare size={20} />
              <span>Create Post</span>
            </button>
            <Link
              to={`/profile/${resolvedUser?.id || ''}`}
              onClick={() => setShowMobileMenu(false)}
              className={`flex items-center gap-3 px-4 py-3 ${
                location.pathname.includes('/profile') ? 'text-blue-600 bg-blue-50' : 'text-neutral-700'
              }`}
            >
              <User size={20} />
              <span>Profile</span>
            </Link>
            <button
              onClick={() => {
                setShowMobileMenu(false);
                signOut();
              }}
              className="flex items-center gap-3 px-4 py-3 text-neutral-700 w-full text-left"
            >
              Logout
            </button>
          </div>
        )}
      </nav>

      {/* Bottom Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/60 bg-white/85 backdrop-blur-xl md:hidden">
        <div className="px-2 py-2 flex items-center justify-around">
          <Link
            to="/"
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              isActive('/') ? 'text-blue-600' : 'text-neutral-700'
            }`}
          >
            <Home size={24} />
            <span className="text-xs">Home</span>
          </Link>

          <Link
            to="/search"
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              isActive('/search') ? 'text-blue-600' : 'text-neutral-700'
            }`}
          >
            <Search size={24} />
            <span className="text-xs">Search</span>
          </Link>

          <button
            onClick={onCreatePost}
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-neutral-700 transition-colors"
          >
            <PlusSquare size={24} />
            <span className="text-xs">Create</span>
          </button>

          <Link
            to={`/profile/${resolvedUser?.id || ''}`}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              location.pathname.includes('/profile') ? 'text-blue-600' : 'text-neutral-700'
            }`}
          >
            <User size={24} />
            <span className="text-xs">Profile</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
