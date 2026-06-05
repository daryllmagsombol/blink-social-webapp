'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, UPLOADS_URL } from '@/lib/api';
import { useAuth } from '@/stores/auth';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DropdownMenu, DropdownItem } from '@/components/ui/DropdownMenu';
import { Textarea } from '@/components/ui/Textarea';
import { Tooltip } from '@/components/ui/Tooltip';
import { Heart, Bookmark, MoreVertical } from 'lucide-react';
import { Skeleton, PostSkeleton } from '@/components/ui/Skeleton';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { toast } from '@/components/ui/Toast';
import { linkifyCaption } from '@/lib/linkify';

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
    <div className="mx-auto max-w-2xl py-8 px-4 pb-20 animate-fade-in">
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between p-4">
          <Link href={`/profile/${post.user.id}`} className="flex items-center gap-3">
            <Avatar
                src={post.user.avatarUrl ? `${UPLOADS_URL}${post.user.avatarUrl}` : undefined}
                alt={post.user.username}
                size="sm"
                fallback={post.user.username[0]?.toUpperCase()}
              />
            <span className="text-sm font-semibold">{post.user.username}</span>
          </Link>
          {(currentUser?.id === post.userId || currentUser) && (
            <DropdownMenu
              trigger={
                <Button variant="ghost" size="sm" icon={<MoreVertical className="h-4 w-4" />} />
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

        <div
          className="aspect-square bg-bg-secondary bg-cover bg-center"
          style={{ backgroundImage: `url(${UPLOADS_URL}${post.imageUrl})` }}
        />

        <div className="p-4">
          <div className="flex items-center gap-4 mb-2">
            <Tooltip content={liked ? 'Unlike' : 'Like'}>
            <button onClick={toggleLike} className="transition-colors">
              <Heart className={`h-5 w-5 ${animatingHeart ? 'animate-heart-beat' : ''} ${liked ? 'fill-accent text-accent' : 'text-text'}`} />
            </button>
            </Tooltip>
            <Tooltip content={saved ? 'Saved' : 'Save'}>
            <button onClick={toggleSave} className="ml-auto transition-colors">
              <Bookmark className={`h-5 w-5 ${saved ? 'fill-primary text-primary' : 'text-text'}`} />
            </button>
            </Tooltip>
          </div>
          <p className="text-sm font-semibold">{post._count.likes} likes</p>
          {editingCaption ? (
            <div className="mt-2 space-y-2">
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
                  {savingCaption ? 'Saving...' : 'Save'}
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
          ) : (post.caption || currentUser?.id === post.userId) && (
            <div className="flex items-start gap-2 mt-1">
              <p className="text-sm flex-1">
                <Link href={`/profile/${post.user.id}`} className="font-semibold hover:underline">
                  {post.user.username}
                </Link>{' '}
                {linkifyCaption(post.caption || '')}
              </p>
              {currentUser?.id === post.userId && (
                <Button
                  onClick={() => { setEditingCaption(true); setEditCaptionText(post.caption || ''); }}
                  variant="ghost"
                  size="sm"
                  className="shrink-0 mt-0.5"
                >
                  {post.caption ? 'Edit' : 'Add caption'}
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-border">
          <div className="max-h-64 overflow-y-auto p-4 space-y-3">
              {comments.length === 0 ? (
              <p className="text-sm text-text-secondary">No comments yet.</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="text-sm">
                  {editingCommentId === c.id ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link href={`/profile/${c.user.id}`} className="font-semibold hover:underline shrink-0">
                          {c.user.username}
                        </Link>
                        <input
                          type="text"
                          value={editCommentContent}
                          onChange={(e) => setEditCommentContent(e.target.value)}
                          maxLength={500}
                          className="flex-1 border-0 p-0 text-sm outline-none"
                          autoFocus
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => saveComment(c.id)}
                          disabled={!editCommentContent.trim()}
                          variant="ghost"
                          size="sm"
                          className="text-primary"
                        >
                          Save
                        </Button>
                        <Button onClick={cancelEditComment} variant="ghost" size="sm">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <Link href={`/profile/${c.user.id}`} className="font-semibold hover:underline shrink-0">
                        {c.user.username}
                      </Link>
                      <span className="flex-1">{c.content}</span>
                      {currentUser?.id === c.user.id && (
                        <Button
                          onClick={() => startEditComment(c.id, c.content)}
                          variant="ghost"
                          size="sm"
                          className="shrink-0"
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                  )}
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
              <Button
                type="submit"
                disabled={!newComment.trim()}
                variant="ghost"
                size="md"
                className="shrink-0 px-4"
              >
                Post
              </Button>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}
