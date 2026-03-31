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
    <Card className="mb-4 overflow-hidden border border-neutral-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <Link to={`/profile/${post.userId}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Avatar className="w-10 h-10">
            <AvatarImage src={post.avatar} alt={post.username} />
            <AvatarFallback>{post.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-neutral-900">{post.username}</p>
            <p className="text-sm text-neutral-500">{post.timestamp}</p>
          </div>
        </Link>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-neutral-800 leading-relaxed">{post.content}</p>
      </div>

      {/* Image */}
      {post.image && (
        <div className="w-full">
          <ImageWithFallback
            src={post.image}
            alt="Post content"
            className="w-full h-auto object-cover"
          />
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 flex items-center justify-between border-t border-neutral-100">
        <div className="flex items-center gap-6">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className="flex items-center gap-2 text-neutral-600 hover:text-blue-600 transition-colors group"
          >
            <Heart
              size={20}
              className={`${isLiked ? 'fill-blue-600 text-blue-600' : 'group-hover:scale-110'} transition-transform`}
            />
            <span className={`text-sm ${isLiked ? 'text-blue-600 font-medium' : ''}`}>{likes}</span>
          </button>

          <button
            onClick={() => onComment?.(post.id)}
            className="flex items-center gap-2 text-neutral-600 hover:text-blue-600 transition-colors group"
          >
            <MessageCircle size={20} className="group-hover:scale-110 transition-transform" />
            <span className="text-sm">{post.comments}</span>
          </button>

          <button className="flex items-center gap-2 text-neutral-600 hover:text-blue-600 transition-colors group">
            <Share2 size={20} className="group-hover:scale-110 transition-transform" />
            <span className="text-sm">{post.shares}</span>
          </button>
        </div>

        <button
          onClick={() => setIsSaved(!isSaved)}
          className="text-neutral-600 hover:text-blue-600 transition-colors"
        >
          <Bookmark size={20} className={isSaved ? 'fill-blue-600 text-blue-600' : ''} />
        </button>
      </div>
    </Card>
  );
}
