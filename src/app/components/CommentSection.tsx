import { Send } from 'lucide-react';
import { useState } from 'react';
import type { Comment, SocialUser } from '../types/social';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';

interface CommentSectionProps {
  comments: Comment[];
  currentUser?: SocialUser | null;
  onAddComment?: (content: string) => Promise<void> | void;
}

export function CommentSection({ comments, currentUser, onAddComment }: CommentSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      setSubmitting(true);
      try {
        await onAddComment?.(newComment);
        setNewComment('');
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Comments List */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-center text-neutral-500 py-8">No comments yet. Be the first to comment!</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={comment.avatar} alt={comment.username} />
                  <AvatarFallback>{comment.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="bg-neutral-100 rounded-lg px-3 py-2">
                    <p className="font-semibold text-sm text-neutral-900">{comment.username}</p>
                    <p className="text-neutral-800 text-sm mt-1">{comment.content}</p>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1 ml-3">{comment.timestamp}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Add Comment Form */}
      <div className="border-t border-neutral-200 p-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src={currentUser?.avatar} alt={currentUser?.name} />
            <AvatarFallback>{(currentUser?.name || 'U').charAt(0)}</AvatarFallback>
          </Avatar>
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 rounded-full border-neutral-300 focus:border-blue-500"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newComment.trim() || submitting}
            className="rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-300"
          >
            <Send size={18} />
          </Button>
        </form>
      </div>
    </div>
  );
}
