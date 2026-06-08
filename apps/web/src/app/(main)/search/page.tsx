'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { api, UPLOADS_URL } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { GridSkeleton } from '@/components/ui/Skeleton';
import { Search } from 'lucide-react';
import { PostGridCard } from '@/components/ui/PostGridCard';

interface SearchUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  _count: { followers: number };
}

interface Post {
  id: string;
  imageUrl: string;
  caption: string | null;
  user: { id: string; username: string; avatarUrl: string | null };
  _count: { likes: number; comments: number };
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setUsers([]);
      setPosts([]);
      setSearched(false);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      setSearched(true);
      api
        .get<{ users: SearchUser[]; posts: Post[] }>(`/search?q=${encodeURIComponent(query)}&type=all`)
        .then((res) => {
          setUsers(res.users || []);
          setPosts(res.posts || []);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="mx-auto max-w-xl py-8 px-4 animate-fade-in">
      <h1 className="mb-4 text-xl font-bold">Search</h1>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users and posts..."
          className="w-full rounded-full border border-border bg-bg-secondary pl-10 pr-4 py-2.5 text-sm outline-none focus:border-text-secondary transition-colors"
        />
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : searched && users.length === 0 && posts.length === 0 ? (
          <EmptyState icon="🔍" title="No results found" description={`No matches for "${query}"`} />
        ) : (
          <>
            {users.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-3 text-sm font-semibold text-text-secondary uppercase tracking-wide">People</h2>
                <div className="space-y-2">
                  {users.map((u, idx) => (
                    <Link
                      key={u.id}
                      href={`/profile/${u.id}`}
                      className="flex items-center gap-3 rounded-lg p-2 hover:bg-bg-secondary hover:scale-[1.01] transition-all duration-150 animate-fade-in"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <Avatar
                          src={u.avatarUrl ? `${UPLOADS_URL}${u.avatarUrl}` : undefined}
                          alt={u.username}
                          size="md"
                          fallback={u.username[0]?.toUpperCase()}
                        />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{u.username}</p>
                        <p className="text-xs text-text-secondary truncate">
                          {u.displayName || `${u._count.followers} followers`}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {posts.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-semibold text-text-secondary uppercase tracking-wide">Posts</h2>
                <div className="grid grid-cols-3 gap-1">
                  {posts.map((post, idx) => (
                    <PostGridCard
                      key={post.id}
                      post={post}
                      index={idx}
                      showComments={false}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {!searched && !loading && (
          <div className="py-16 text-center text-text-secondary text-sm">
            Type something to search users and posts
          </div>
        )}
      </div>
    </div>
  );
}
