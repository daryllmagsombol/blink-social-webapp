'use client';

import Link from 'next/link';
import { UPLOADS_URL } from '@/lib/api';

interface PostGridCardPost {
  id: string;
  imageUrl: string;
  _count: { likes: number; comments: number };
}

export function PostGridCard({
  post,
  index = 0,
  showComments = true,
}: {
  post: PostGridCardPost;
  index?: number;
  showComments?: boolean;
}) {
  return (
    <Link
      key={post.id}
      href={`/posts/${post.id}`}
      className="group relative aspect-square bg-bg-secondary overflow-hidden transition-all duration-150 hover:scale-[1.02]"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${UPLOADS_URL}${post.imageUrl})` }}
      />
      <div className="absolute inset-0 flex items-center justify-center gap-4 md:gap-6 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <span className="flex items-center gap-1.5 text-white text-sm font-semibold">
          <span
            className="material-symbols-outlined text-[18px]"
            style={{ fontVariationSettings: `'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20` }}
          >
            favorite
          </span>
          {post._count.likes}
        </span>
        {showComments && (
          <span className="flex items-center gap-1.5 text-white text-sm font-semibold">
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: `'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20` }}
            >
              chat_bubble
            </span>
            {post._count.comments}
          </span>
        )}
      </div>
    </Link>
  );
}
