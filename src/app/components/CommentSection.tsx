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
            <div className="rounded-[24px] border border-dashed border-violet-200 bg-violet-50/40 px-6 py-10 text-center text-neutral-500">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0 ring-2 ring-violet-100">
                  <AvatarImage src={comment.avatar} alt={comment.username} />
                  <AvatarFallback>{comment.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
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
      <div className="border-t border-neutral-200 bg-white/80 p-4 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0 ring-2 ring-violet-100">
            <AvatarImage src={currentUser?.avatar} alt={currentUser?.name} />
            <AvatarFallback>{(currentUser?.name || 'U').charAt(0)}</AvatarFallback>
          </Avatar>
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 rounded-full border-neutral-200 bg-white focus:border-violet-400"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newComment.trim() || submitting}
            className="rounded-full bg-gradient-to-r from-slate-950 via-violet-700 to-amber-400 text-white hover:opacity-95 disabled:bg-neutral-300"
          >
            <Send size={18} />
          </Button>
        </form>
      </div>
    </div>
  );
}
