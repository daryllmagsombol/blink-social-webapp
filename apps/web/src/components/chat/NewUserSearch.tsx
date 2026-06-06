'use client';

import { useState, useEffect, useRef } from 'react';
import { api, UPLOADS_URL } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { MatIcon } from '@/components/ui/Icon';
import { Spinner } from '@/components/ui/Spinner';

interface SearchUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  _count: { followers: number };
}

interface NewUserSearchProps {
  open: boolean;
  onClose: () => void;
  onSelectUser: (userId: string) => void;
}

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function NewUserSearch({ open, onClose, onSelectUser }: NewUserSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      // Short timeout to let the modal render first
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Fetch results when debounced query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    api
      .get<{ users: SearchUser[] }>(`/search?q=${encodeURIComponent(debouncedQuery)}&type=users`)
      .then((data) => setResults(data.users || []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  const handleSelect = (userId: string) => {
    onSelectUser(userId);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="New message" size="sm">
      {/* Search input */}
      <div className="relative mb-4">
        <MatIcon
          icon="search"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people..."
          className="w-full rounded-lg border border-border bg-bg-secondary py-2.5 pl-10 pr-4 text-sm text-text outline-none placeholder:text-text-secondary transition-all duration-150 focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Results */}
      <div className="max-h-80 overflow-y-auto -mx-2">
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner size="sm" className="text-primary" />
          </div>
        ) : debouncedQuery.trim() && results.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-secondary">No users found.</p>
        ) : (
          <div className="space-y-0.5">
            {results.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleSelect(u.id)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-bg-secondary transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <Avatar
                  src={u.avatarUrl ? `${UPLOADS_URL}${u.avatarUrl}` : undefined}
                  alt={u.username}
                  size="md"
                  fallback={u.username[0]?.toUpperCase()}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text truncate">{u.username}</p>
                  <p className="text-xs text-text-secondary truncate">
                    {u.displayName || u.username}
                    <span className="ml-1">· {u._count.followers} followers</span>
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {!debouncedQuery.trim() && !loading && (
        <p className="pb-2 text-center text-xs text-text-secondary">
          Start typing to search for people.
        </p>
      )}
    </Modal>
  );
}
