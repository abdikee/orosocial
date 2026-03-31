import { Image, X } from 'lucide-react';
import { useState } from 'react';
import type { SocialUser } from '../types/social';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  currentUser?: SocialUser | null;
  onCreatePost?: (content: string, image?: string) => void;
}

export function CreatePostModal({ open, onClose, currentUser, onCreatePost }: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (content.trim() || imagePreview) {
      onCreatePost?.(content, imagePreview || undefined);
      setContent('');
      setImagePreview(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="overflow-hidden rounded-[32px] border border-white/70 bg-white/90 p-0 shadow-[0_40px_120px_-50px_rgba(15,23,42,0.55)] backdrop-blur-xl sm:max-w-[600px]">
        <div className="h-1 w-full bg-gradient-to-r from-slate-950 via-violet-700 to-amber-400" />
        <DialogHeader>
          <div className="px-6 pt-6">
            <DialogTitle className="text-xl font-semibold text-neutral-900">Create Post</DialogTitle>
            <p className="mt-1 text-sm text-neutral-500">Share a polished moment with your circle.</p>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-5 px-6 pb-6">
          {/* User Info */}
          <div className="flex items-center gap-3 rounded-2xl border border-violet-100 bg-violet-50/40 p-3">
            <Avatar className="h-11 w-11 ring-2 ring-white">
              <AvatarImage src={currentUser?.avatar} alt={currentUser?.name} />
              <AvatarFallback>{(currentUser?.name || 'U').charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-neutral-900">{currentUser?.name || 'User'}</p>
              <p className="text-sm text-neutral-500">@{currentUser?.username || 'user'}</p>
            </div>
          </div>

          {/* Content Input */}
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="min-h-[140px] resize-none rounded-[24px] border-neutral-200 bg-white/90 px-5 py-4 focus:border-violet-400"
          />

          {/* Image Preview */}
          {imagePreview && (
            <div className="relative overflow-hidden rounded-[24px] border border-neutral-200">
              <img src={imagePreview} alt="Preview" className="w-full h-auto" />
              <button
                onClick={() => setImagePreview(null)}
                className="absolute right-3 top-3 rounded-full bg-neutral-900/70 p-1.5 text-white transition-colors hover:bg-neutral-900"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
            <div className="flex items-center gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50/60 px-4 py-2 text-violet-700 transition-colors hover:bg-violet-100/70">
                  <Image size={20} />
                  <span className="text-sm font-medium">Add Photo</span>
                </div>
              </label>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="rounded-full border-neutral-300 bg-white/80"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!content.trim() && !imagePreview}
                className="rounded-full bg-gradient-to-r from-slate-950 via-violet-700 to-amber-400 text-white shadow-[0_16px_30px_-18px_rgba(76,29,149,0.8)] hover:opacity-95 disabled:bg-neutral-300"
              >
                Post
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
