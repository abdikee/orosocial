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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
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
            className="min-h-[120px] resize-none border-neutral-300 focus:border-blue-500"
          />

          {/* Image Preview */}
          {imagePreview && (
            <div className="relative rounded-lg overflow-hidden">
              <img src={imagePreview} alt="Preview" className="w-full h-auto" />
              <button
                onClick={() => setImagePreview(null)}
                className="absolute top-2 right-2 p-1 bg-neutral-900/70 rounded-full text-white hover:bg-neutral-900 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
            <div className="flex items-center gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-2">
                  <Image size={20} />
                  <span className="text-sm font-medium">Add Photo</span>
                </div>
              </label>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="rounded-full"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!content.trim() && !imagePreview}
                className="rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-300"
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
