import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import type { Post } from '../types/social';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card } from './ui/card';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface PostCardProps {
  post: Post;
  onComment?: (postId: string) => void;
  onLikeToggle?: (postId: string) => Promise<void> | void;
}

export function PostCard({ post, onComment, onLikeToggle }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likes, setLikes] = useState(post.likes);
  const [isSaved, setIsSaved] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    setIsLiked(post.isLiked || false);
    setLikes(post.likes);
  }, [post.isLiked, post.likes]);

  const handleLike = async () => {
    if (isLiking) {
      return;
    }
    const previousLiked = isLiked;
    const previousLikes = likes;
    setIsLiked(!previousLiked);
    setLikes(previousLiked ? previousLikes - 1 : previousLikes + 1);
    setIsLiking(true);
    try {
      await onLikeToggle?.(post.id);
    } catch {
      setIsLiked(previousLiked);
      setLikes(previousLikes);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <Card className="mb-5 overflow-hidden rounded-[28px] border border-white/70 bg-white/85 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.5)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_32px_90px_-42px_rgba(76,29,149,0.35)]">
      <div className="h-1 w-full bg-gradient-to-r from-slate-950 via-violet-700 to-amber-400" />
      {/* Header */}
      <div className="flex items-center justify-between p-5">
        <Link to={`/profile/${post.userId}`} className="flex items-center gap-3 transition-opacity hover:opacity-85">
          <Avatar className="h-11 w-11 ring-2 ring-violet-100">
            <AvatarImage src={post.avatar} alt={post.username} />
            <AvatarFallback>{post.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-neutral-900">{post.username}</p>
            <p className="text-sm text-neutral-500">{post.timestamp}</p>
          </div>
        </Link>
        <span className="rounded-full border border-violet-100 bg-violet-50/80 px-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.24em] text-violet-700">
          ORO
        </span>
      </div>

      {/* Content */}
      <div className="px-5 pb-4">
        <p className="leading-7 text-neutral-800">{post.content}</p>
      </div>

      {/* Image */}
      {post.image && (
        <div className="mx-5 mb-4 overflow-hidden rounded-[24px]">
          <ImageWithFallback
            src={post.image}
            alt="Post content"
            className="h-auto w-full object-cover"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-neutral-100/80 px-5 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`group flex items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors ${
              isLiked
                ? 'bg-violet-50 text-violet-700'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-violet-700'
            }`}
          >
            <Heart
              size={20}
              className={`${isLiked ? 'fill-violet-700 text-violet-700' : 'group-hover:scale-110'} transition-transform`}
            />
            <span className={isLiked ? 'font-medium text-violet-700' : ''}>{likes}</span>
          </button>

          <button
            onClick={() => onComment?.(post.id)}
            className="group flex items-center gap-2 rounded-full px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-violet-700"
          >
            <MessageCircle size={20} className="group-hover:scale-110 transition-transform" />
            <span>{post.comments}</span>
          </button>

          <button className="group flex items-center gap-2 rounded-full px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-violet-700">
            <Share2 size={20} className="group-hover:scale-110 transition-transform" />
            <span>{post.shares}</span>
          </button>
        </div>

        <button
          onClick={() => setIsSaved(!isSaved)}
          className={`rounded-full p-2 transition-colors ${
            isSaved ? 'bg-amber-50 text-amber-500' : 'text-neutral-600 hover:bg-neutral-100 hover:text-amber-500'
          }`}
        >
          <Bookmark size={20} className={isSaved ? 'fill-amber-500 text-amber-500' : ''} />
        </button>
      </div>
    </Card>
  );
}
