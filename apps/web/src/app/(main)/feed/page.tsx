'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/stores/auth';
import { api } from '@/lib/api';

interface Post {
  id: string;
  imageUrl: string;
  caption: string | null;
  createdAt: string;
  userId: string;
  user: { id: string; username: string; avatarUrl: string | null };
  _count: { likes: number; comments: number };
}

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const loadFeed = useCallback(async () => {
    try {
      const res = await api.get<{ data: Post[] }>('/feed');
      setPosts(res.data);
      // check liked status for each post
      const liked = new Set<string>();
      await Promise.all(
        res.data.map(async (p) => {
          try {
            const { liked: isLiked } = await api.get<{ liked: boolean }>(
              `/posts/${p.id}/likes/check`,
            );
            if (isLiked) liked.add(p.id);
          } catch {}
        }),
      );
      setLikedPosts(liked);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  const toggleLike = async (postId: string) => {
    const liked = likedPosts.has(postId);
    try {
      if (liked) {
        await api.delete(`/posts/${postId}/likes`);
        setLikedPosts((prev) => { const n = new Set(prev); n.delete(postId); return n; });
      } else {
        await api.post(`/posts/${postId}/likes`);
        setLikedPosts((prev) => new Set(prev).add(postId));
      }
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, _count: { ...p._count, likes: liked ? p._count.likes - 1 : p._count.likes + 1 } }
            : p,
        ),
      );
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl py-8 px-4 pb-20">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Feed</h1>
          {user && <p className="text-sm text-text-secondary">{user.displayName || user.username}</p>}
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="rounded border border-border bg-bg p-8 text-center">
          <p className="text-text-secondary">Your feed empty.</p>
          <p className="text-sm text-text-secondary mt-1">Follow users to see posts here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="rounded border border-border bg-bg">
              <div className="flex items-center gap-3 p-4">
                <Link href={`/profile/${post.user.id}`}>
                  <div className="h-8 w-8 rounded-full bg-primary/20" />
                </Link>
                <Link href={`/profile/${post.user.id}`} className="text-sm font-semibold hover:underline">
                  {post.user.username}
                </Link>
              </div>
              <Link href={`/posts/${post.id}`}>
                <div
                  className="aspect-square bg-bg-secondary bg-cover bg-center"
                  style={{ backgroundImage: `url(http://localhost:4000${post.imageUrl})` }}
                />
              </Link>
              <div className="p-4">
                <div className="flex items-center gap-4 mb-2">
                  <button onClick={() => toggleLike(post.id)} className="text-xl transition-colors">
                    {likedPosts.has(post.id) ? <span className="text-danger">♥</span> : <span className="text-text">♡</span>}
                  </button>
                  <Link href={`/posts/${post.id}`} className="text-xl text-text">💬</Link>
                </div>
                <p className="text-sm font-semibold">{post._count.likes} likes</p>
                {post.caption && (
                  <p className="text-sm mt-1">
                    <Link href={`/profile/${post.user.id}`} className="font-semibold hover:underline">
                      {post.user.username}
                    </Link>{' '}
                    {post.caption}
                  </p>
                )}
                <Link href={`/posts/${post.id}`} className="text-xs text-text-secondary mt-1 block">
                  View all {post._count.comments} comments
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
