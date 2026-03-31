export interface SocialUser {
  id: string;
  username: string;
  name: string;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
  isFollowing?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  avatar: string;
  content: string;
  timestamp: string;
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  shares: number;
  timestamp: string;
  isLiked?: boolean;
  commentsList?: Comment[];
}

export interface FeedResponse {
  posts: Post[];
}
