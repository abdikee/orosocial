import { useState } from 'react';
import { Link } from 'react-router';
import type { SocialUser } from '../types/social';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';

interface UserListItemProps {
  user: SocialUser;
  onFollowToggle?: (userId: string) => Promise<void> | void;
}

export function UserListItem({ user, onFollowToggle }: UserListItemProps) {
  const [isFollowing, setIsFollowing] = useState(user.isFollowing || false);
  const [submitting, setSubmitting] = useState(false);

  const handleFollowToggle = async () => {
    if (submitting) {
      return;
    }
    const previous = isFollowing;
    setIsFollowing(!previous);
    setSubmitting(true);
    try {
      await onFollowToggle?.(user.id);
    } catch {
      setIsFollowing(previous);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors">
      <Link to={`/profile/${user.id}`} className="flex items-center gap-3 flex-1">
        <Avatar className="w-12 h-12">
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-neutral-900 truncate">{user.name}</p>
          <p className="text-sm text-neutral-500 truncate">@{user.username}</p>
          {user.bio && (
            <p className="text-sm text-neutral-600 truncate mt-1">{user.bio}</p>
          )}
        </div>
      </Link>

      <Button
        onClick={handleFollowToggle}
        disabled={submitting}
        variant={isFollowing ? 'outline' : 'default'}
        className={`rounded-full px-6 ${
          isFollowing
            ? 'border-neutral-300 text-neutral-700 hover:bg-neutral-100'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {isFollowing ? 'Following' : 'Follow'}
      </Button>
    </div>
  );
}
