'use client';

import Link from 'next/link';
import { UPLOADS_URL } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { MatIcon } from '@/components/ui/Icon';
import { timeAgo } from '@/lib/utils';
import { linkifyCaption } from '@/lib/linkify';

interface PostCardPost {
  id: string;
  imageUrl: string;
  caption: string | null;
  createdAt: string;
  userId: string;
  user: { id: string; username: string; avatarUrl: string | null };
  _count: { likes: number; comments: number };
}

interface PostCardProps {
  post: PostCardPost;
  index: number;
  liked: boolean;
  saved: boolean;
  isAnimatingHeart: boolean;
  commentValue: string;
  isSubmittingComment: boolean;
  currentUserId?: string;
  onToggleLike: (postId: string) => void;
  onToggleSave: (postId: string) => void;
  onSubmitComment: (postId: string, e: React.FormEvent) => void;
  onCommentChange: (postId: string, value: string) => void;
}

export function PostCard({
  post,
  index,
  liked,
  saved,
  isAnimatingHeart,
  commentValue,
  isSubmittingComment,
  currentUserId,
  onToggleLike,
  onToggleSave,
  onSubmitComment,
  onCommentChange,
}: PostCardProps) {
  return (
    <div
      className="rounded-xl border border-border bg-bg animate-fade-in-up overflow-hidden"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Post Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${post.user.id}`}>
            <Avatar
              src={post.user.avatarUrl ? `${UPLOADS_URL}${post.user.avatarUrl}` : undefined}
              alt={post.user.username}
              size="sm"
              fallback={post.user.username[0]?.toUpperCase()}
            />
          </Link>
          <div>
            <Link
              href={`/profile/${post.user.id}`}
              className="text-sm font-semibold text-text hover:underline leading-[18px]"
            >
              {post.user.username}
            </Link>
            <p className="text-xs text-text-secondary uppercase tracking-wide leading-[14px]">
              {timeAgo(post.createdAt)}
            </p>
          </div>
        </div>
        <button className="text-text-secondary hover:text-text transition-colors">
          <MatIcon icon="more_horiz" />
        </button>
      </div>

      {/* Post Image */}
      <Link href={`/posts/${post.id}`}>
        <div className="relative aspect-square bg-bg-secondary">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${UPLOADS_URL}${post.imageUrl})` }}
          />
        </div>
      </Link>

      {/* Post Actions */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Like */}
            <button
              onClick={() => onToggleLike(post.id)}
              className="transition-all duration-150 active:scale-125"
            >
              <span
                className={`material-symbols-outlined text-[26px] transition-all duration-150 ${
                  isAnimatingHeart ? 'animate-heart-beat' : ''
                } ${liked ? 'text-accent' : 'text-text'}`}
                style={{
                  fontVariationSettings: `'FILL' ${liked ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
                }}
              >
                favorite
              </span>
            </button>

            {/* Comment */}
            <Link
              href={`/posts/${post.id}`}
              className="transition-all duration-150 hover:scale-110"
            >
              <span
                className="material-symbols-outlined text-[26px] text-text"
                style={{
                  fontVariationSettings: `'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
                }}
              >
                chat_bubble
              </span>
            </Link>

            {/* Share */}
            <button className="transition-all duration-150 hover:scale-110">
              <span
                className="material-symbols-outlined text-[26px] text-text"
                style={{
                  fontVariationSettings: `'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
                }}
              >
                send
              </span>
            </button>
          </div>

          {/* Bookmark */}
          <button
            onClick={() => onToggleSave(post.id)}
            className="transition-all duration-150 hover:scale-110"
          >
            <span
              className="material-symbols-outlined text-[26px]"
              style={{
                fontVariationSettings: `'FILL' ${saved ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
              }}
            >
              bookmark
            </span>
          </button>
        </div>

        {/* Like Count */}
        <p className="mt-1 text-sm font-semibold text-text">
          {post._count.likes.toLocaleString()} likes
        </p>

        {/* Caption */}
        {post.caption && (
          <p className="mt-0.5 text-sm leading-[18px]">
            <Link
              href={`/profile/${post.user.id}`}
              className="font-semibold text-text hover:underline"
            >
              {post.user.username}
            </Link>{' '}
            <span className="text-text">{linkifyCaption(post.caption)}</span>
          </p>
        )}

        {/* View Comments */}
        {post._count.comments > 0 && (
          <Link
            href={`/posts/${post.id}`}
            className="mt-0.5 block text-xs text-text-secondary hover:underline"
          >
            View all {post._count.comments} comments
          </Link>
        )}

        {/* Time Ago */}
        <p className="mt-0.5 text-xs text-text-secondary uppercase tracking-wide">
          {timeAgo(post.createdAt)}
        </p>
      </div>

      {/* Comment Input */}
      {currentUserId && (
        <form
          onSubmit={(e) => onSubmitComment(post.id, e)}
          className="flex items-center border-t border-border px-4 py-2.5"
        >
          <button
            type="button"
            className="mr-2 text-text-secondary hover:text-text transition-colors"
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={{
                fontVariationSettings: `'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
              }}
            >
              mood
            </span>
          </button>
          <input
            type="text"
            placeholder="Add a comment..."
            value={commentValue}
            onChange={(e) => onCommentChange(post.id, e.target.value)}
            maxLength={500}
            className="flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-text-secondary"
          />
          <button
            type="submit"
            disabled={!commentValue?.trim() || isSubmittingComment}
            className="text-sm font-semibold text-primary disabled:opacity-40 hover:text-primary-dark transition-colors"
          >
            {isSubmittingComment ? '...' : 'Post'}
          </button>
        </form>
      )}
    </div>
  );
}
