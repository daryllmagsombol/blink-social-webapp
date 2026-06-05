'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, UPLOADS_URL } from '@/lib/api';
import { useAuth } from '@/stores/auth';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { DropdownMenu, DropdownItem } from '@/components/ui/DropdownMenu';
import { Textarea } from '@/components/ui/Textarea';
import { PostSkeleton } from '@/components/ui/Skeleton';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { toast } from '@/components/ui/Toast';
import { linkifyCaption } from '@/lib/linkify';

function MatIcon({ icon, filled = false, className = '' }: { icon: string; filled?: boolean; className?: string }) {
  return (
    <span
      className={`material-symbols-outlined text-[22px] ${className}`}
      style={{ fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24` }}
    >
      {icon}
    </span>
  );
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

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
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editingCaption, setEditingCaption] = useState(false);
  const [editCaptionText, setEditCaptionText] = useState('');
  const [savingCaption, setSavingCaption] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [animatingHeart, setAnimatingHeart] = useState(false);
  const [showFloatingHeart, setShowFloatingHeart] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);

  useEffect(() => {
    setLoading(true);
    setError(false);
    Promise.all([
      api.get<Post>(`/posts/${id}`),
      api.get<{ data: Comment[] }>(`/posts/${id}/comments`),
      currentUser ? api.get<{ liked: boolean }>(`/posts/${id}/likes/check`) : Promise.resolve(null),
      currentUser ? api.get<{ saved: boolean }>(`/posts/${id}/bookmark/check`) : Promise.resolve(null),
    ])
      .then(([postRes, commentsRes, likeRes, bookmarkRes]) => {
        setPost(postRes);
        setComments(commentsRes.data);
        if (likeRes) setLiked(likeRes.liked);
        if (bookmarkRes) setSaved(bookmarkRes.saved);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id, currentUser]);

  const toggleLike = async () => {
    setAnimatingHeart(true);
    setTimeout(() => setAnimatingHeart(false), 300);
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

  // Double-tap to like on image
  const handleImageClick = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap
      if (!liked) {
        toggleLike();
      }
      setShowFloatingHeart(true);
      setTimeout(() => setShowFloatingHeart(false), 800);
    }
    lastTapRef.current = now;
  };

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const comment = await api.post<Comment>(`/posts/${id}/comments`, { content: newComment });
      setComments((prev) => [comment, ...prev]);
      setNewComment('');
      setPost((p) => p ? { ...p, _count: { ...p._count, comments: p._count.comments + 1 } } : p);
    } catch {}
    setSubmitting(false);
  };

  const deletePost = async () => {
    if (!confirm('Delete this post?')) return;
    try {
      await api.delete(`/posts/${id}`);
      toast('Post deleted', 'success');
      router.push('/feed');
    } catch {
      toast('Failed to delete post', 'error');
    }
  };

  const toggleSave = async () => {
    try {
      const res = await api.post<{ saved: boolean }>(`/posts/${id}/bookmark`);
      setSaved(res.saved);
    } catch {
      toast('Failed to update bookmark', 'error');
    }
  };

  const saveCaption = async () => {
    if (!editCaptionText.trim()) return;
    setSavingCaption(true);
    try {
      const updated = await api.patch<Post>(`/posts/${id}`, { caption: editCaptionText });
      setPost(updated);
      setEditingCaption(false);
      toast('Caption updated', 'success');
    } catch {
      toast('Failed to update caption', 'error');
    } finally {
      setSavingCaption(false);
    }
  };

  const startEditComment = (commentId: string, content: string) => {
    setEditingCommentId(commentId);
    setEditCommentContent(content);
  };

  const saveComment = async (commentId: string) => {
    if (!editCommentContent.trim()) return;
    try {
      const updated = await api.patch<Comment>(
        `/posts/${id}/comments/${commentId}`,
        { content: editCommentContent },
      );
      setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
      setEditingCommentId(null);
      toast('Comment updated', 'success');
    } catch {
      toast('Failed to update comment', 'error');
    }
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditCommentContent('');
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl py-8 px-4 pb-20">
        <PostSkeleton />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="mx-auto max-w-2xl py-20 px-4">
        <ErrorDisplay message="Could not load post" onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[935px] py-8 px-4 pb-20 animate-fade-in">
      {/* Desktop: Side-by-side layout */}
      <div className="flex flex-col md:flex-row rounded-xl border border-border bg-bg overflow-hidden">
        {/* Image Section */}
        <div
          ref={imageRef}
          className="relative md:flex-1 bg-black flex items-center justify-center cursor-pointer select-none"
          onClick={handleImageClick}
        >
          <div
            className="w-full aspect-square md:aspect-auto md:h-full min-h-[400px] bg-cover bg-center"
            style={{ backgroundImage: `url(${UPLOADS_URL}${post.imageUrl})` }}
          />
          {/* Floating heart on double-tap */}
          {showFloatingHeart && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span
                className="material-symbols-outlined text-white animate-heart-beat"
                style={{
                  fontSize: '100px',
                  fontVariationSettings: `'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48`,
                  filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
                }}
              >
                favorite
              </span>
            </div>
          )}
        </div>

        {/* Right Sidebar: Comments & Interactions */}
        <div className="md:w-[400px] flex flex-col">
          {/* Post Author Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <Link href={`/profile/${post.user.id}`}>
                <Avatar
                  src={post.user.avatarUrl ? `${UPLOADS_URL}${post.user.avatarUrl}` : undefined}
                  alt={post.user.username}
                  size="sm"
                  fallback={post.user.username[0]?.toUpperCase()}
                />
              </Link>
              <Link
                href={`/profile/${post.user.id}`}
                className="text-[13px] font-semibold text-text hover:underline"
              >
                {post.user.username}
              </Link>
            </div>
            {(currentUser?.id === post.userId || currentUser) && (
              <DropdownMenu
                trigger={
                  <button className="text-text-secondary hover:text-text transition-colors">
                    <MatIcon icon="more_horiz" />
                  </button>
                }
                align="right"
              >
                {currentUser?.id === post.userId ? (
                  <DropdownItem onClick={deletePost} danger>Delete</DropdownItem>
                ) : (
                  <DropdownItem onClick={() => {
                    const reason = prompt('Reason for reporting this post:');
                    if (reason && reason.trim()) {
                      api.post('/reports', { reason: reason.trim(), postId: id })
                        .then(() => toast('Report submitted', 'success'))
                        .catch(() => toast('Failed to submit report', 'error'));
                    }
                  }}>
                    Report
                  </DropdownItem>
                )}
              </DropdownMenu>
            )}
          </div>

          {/* Comments Area */}
          <div className="flex-1 overflow-y-auto max-h-[320px] md:max-h-[420px]">
            {/* Caption as first "comment" */}
            <div className="px-4 pt-3 pb-2 flex gap-3">
              <Link href={`/profile/${post.user.id}`} className="shrink-0">
                <Avatar
                  src={post.user.avatarUrl ? `${UPLOADS_URL}${post.user.avatarUrl}` : undefined}
                  alt={post.user.username}
                  size="sm"
                  fallback={post.user.username[0]?.toUpperCase()}
                />
              </Link>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] leading-[18px]">
                  <Link
                    href={`/profile/${post.user.id}`}
                    className="font-semibold text-text hover:underline"
                  >
                    {post.user.username}
                  </Link>{' '}
                  <span className="text-text">{linkifyCaption(post.caption || '')}</span>
                </p>
                {post.caption && (
                  <p className="text-[10px] text-text-secondary uppercase tracking-wide mt-1">
                    {timeAgo(post.createdAt)}
                  </p>
                )}
              </div>
              {currentUser?.id === post.userId && (
                <button
                  onClick={() => { setEditingCaption(true); setEditCaptionText(post.caption || ''); }}
                  className="text-text-secondary hover:text-text transition-colors shrink-0 self-start"
                >
                  <MatIcon icon="edit" className="text-[16px]" />
                </button>
              )}
            </div>

            {/* Edit Caption */}
            {editingCaption && (
              <div className="px-4 pb-3 space-y-2">
                <Textarea
                  value={editCaptionText}
                  onChange={(e) => setEditCaptionText(e.target.value)}
                  maxLength={2200}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={saveCaption}
                    disabled={savingCaption || !editCaptionText.trim()}
                    size="sm"
                    loading={savingCaption}
                  >
                    Save
                  </Button>
                  <Button
                    onClick={() => { setEditingCaption(false); setEditCaptionText(post.caption || ''); }}
                    variant="secondary"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Comments */}
            <div className="px-4 pb-3 space-y-3">
              {comments.length === 0 ? (
                <p className="text-[13px] text-text-secondary py-3">No comments yet. Add one below!</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <Link href={`/profile/${c.user.id}`} className="shrink-0 mt-0.5">
                      <Avatar
                        src={c.user.avatarUrl ? `${UPLOADS_URL}${c.user.avatarUrl}` : undefined}
                        alt={c.user.username}
                        size="xs"
                        fallback={c.user.username[0]?.toUpperCase()}
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      {editingCommentId === c.id ? (
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={editCommentContent}
                            onChange={(e) => setEditCommentContent(e.target.value)}
                            maxLength={500}
                            className="w-full border border-border rounded-lg px-3 py-1.5 text-[13px] outline-none"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveComment(c.id)}
                              disabled={!editCommentContent.trim()}
                              className="text-[12px] font-semibold text-primary disabled:opacity-40"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEditComment}
                              className="text-[12px] font-semibold text-text-secondary"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-[13px] leading-[18px]">
                            <Link
                              href={`/profile/${c.user.id}`}
                              className="font-semibold text-text hover:underline"
                            >
                              {c.user.username}
                            </Link>{' '}
                            <span className="text-text">{c.content}</span>
                          </p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[10px] text-text-secondary uppercase tracking-wide">
                              {timeAgo(c.createdAt)}
                            </span>
                            {currentUser?.id === c.user.id && (
                              <button
                                onClick={() => startEditComment(c.id, c.content)}
                                className="text-[10px] text-text-secondary hover:text-text"
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Actions Footer */}
          <div className="border-t border-border px-4 py-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleLike}
                  className="transition-all duration-150 active:scale-125"
                >
                  <span
                    className={`material-symbols-outlined text-[26px] transition-all duration-150 ${
                      animatingHeart ? 'animate-heart-beat' : ''
                    } ${liked ? 'text-[#ED4956]' : 'text-text'}`}
                    style={{
                      fontVariationSettings: `'FILL' ${liked ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
                    }}
                  >
                    favorite
                  </span>
                </button>
                <button className="transition-all duration-150 hover:scale-110">
                  <span
                    className="material-symbols-outlined text-[26px] text-text"
                    style={{ fontVariationSettings: `'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24` }}
                  >
                    chat_bubble
                  </span>
                </button>
                <button className="transition-all duration-150 hover:scale-110">
                  <span
                    className="material-symbols-outlined text-[26px] text-text"
                    style={{ fontVariationSettings: `'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24` }}
                  >
                    send
                  </span>
                </button>
              </div>
              <button
                onClick={toggleSave}
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

            <p className="mt-1 text-[13px] font-semibold text-text">
              {post._count.likes.toLocaleString()} likes
            </p>
            <p className="mt-0.5 text-[10px] text-text-secondary uppercase tracking-wide">
              {timeAgo(post.createdAt)}
            </p>
          </div>

          {/* Comment Input */}
          {currentUser && (
            <form onSubmit={addComment} className="flex items-center border-t border-border px-4 py-2.5">
              <button
                type="button"
                className="mr-2 text-text-secondary hover:text-text transition-colors"
              >
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={{ fontVariationSettings: `'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24` }}
                >
                  mood
                </span>
              </button>
              <input
                type="text"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                maxLength={500}
                className="flex-1 border-0 bg-transparent text-[13px] outline-none placeholder:text-text-secondary"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || submitting}
                className="text-[13px] font-semibold text-primary disabled:opacity-40 hover:text-primary-dark transition-colors"
              >
                {submitting ? '...' : 'Post'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
