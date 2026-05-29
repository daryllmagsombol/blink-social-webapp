'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/stores/auth';

interface Post {
  id: string;
  imageUrl: string;
  caption: string | null;
  createdAt: string;
  userId: string;
  user: { id: string; username: string; avatarUrl: string | null };
  _count: { likes: number; comments: number };
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; username: string; avatarUrl: string | null };
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Post>(`/posts/${id}`),
      api.get<{ data: Comment[] }>(`/posts/${id}/comments`),
      currentUser ? api.get<{ liked: boolean }>(`/posts/${id}/likes/check`) : Promise.resolve(null),
    ])
      .then(([postRes, commentsRes, likeRes]) => {
        setPost(postRes);
        setComments(commentsRes.data);
        if (likeRes) setLiked(likeRes.liked);
      })
      .catch(() => router.push('/feed'))
      .finally(() => setLoading(false));
  }, [id, currentUser, router]);

  const toggleLike = async () => {
    try {
      if (liked) {
        await api.delete(`/posts/${id}/likes`);
        setLiked(false);
        setPost((p) => p ? { ...p, _count: { ...p._count, likes: p._count.likes - 1 } } : p);
      } else {
        await api.post(`/posts/${id}/likes`);
        setLiked(true);
        setPost((p) => p ? { ...p, _count: { ...p._count, likes: p._count.likes + 1 } } : p);
      }
    } catch {}
  };

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const comment = await api.post<Comment>(`/posts/${id}/comments`, { content: newComment });
      setComments((prev) => [comment, ...prev]);
      setNewComment('');
      setPost((p) => p ? { ...p, _count: { ...p._count, comments: p._count.comments + 1 } } : p);
    } catch {}
  };

  const deletePost = async () => {
    if (!confirm('Delete this post?')) return;
    try {
      await api.delete(`/posts/${id}`);
      router.push('/feed');
    } catch {}
  };

  if (loading || !post) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-8 px-4 pb-20">
      <div className="rounded border border-border bg-bg overflow-hidden">
        <div className="flex items-center justify-between p-4">
          <Link href={`/profile/${post.user.id}`} className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/20" />
            <span className="text-sm font-semibold">{post.user.username}</span>
          </Link>
          {currentUser?.id === post.userId && (
            <button onClick={deletePost} className="text-sm text-danger">Delete</button>
          )}
        </div>

        <div
          className="aspect-square bg-bg-secondary bg-cover bg-center"
          style={{ backgroundImage: `url(http://localhost:4000${post.imageUrl})` }}
        />

        <div className="p-4">
          <div className="flex items-center gap-4 mb-2">
            <button onClick={toggleLike} className="text-2xl transition-colors">
              {liked ? <span className="text-danger">♥</span> : <span>♡</span>}
            </button>
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
        </div>

        <div className="border-t border-border">
          <div className="max-h-64 overflow-y-auto p-4 space-y-3">
            {comments.length === 0 ? (
              <p className="text-sm text-text-secondary">No comments yet.</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="text-sm">
                  <Link href={`/profile/${c.user.id}`} className="font-semibold hover:underline">
                    {c.user.username}
                  </Link>{' '}
                  {c.content}
                </div>
              ))
            )}
          </div>

          {currentUser && (
            <form onSubmit={addComment} className="flex border-t border-border">
              <input
                type="text"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                maxLength={500}
                className="flex-1 border-0 px-4 py-3 text-sm outline-none"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="px-4 py-3 text-sm font-semibold text-primary disabled:opacity-30"
              >
                Post
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
