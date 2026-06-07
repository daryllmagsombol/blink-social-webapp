'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, UPLOADS_URL } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';

interface StoryUser {
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  stories: {
    id: string;
    imageUrl: string;
    createdAt: string;
    viewed: boolean;
  }[];
}

export function StoryViewer({
  stories,
  initialIndex,
  onClose,
}: {
  stories: StoryUser[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [userIdx, setUserIdx] = useState(initialIndex);
  const [storyIdx, setStoryIdx] = useState(0);

  const current = stories[userIdx];
  const story = current?.stories[storyIdx];

  const markViewed = useCallback(async () => {
    if (!story?.viewed) {
      try { await api.post(`/stories/${story.id}/view`); } catch {}
    }
  }, [story]);

  useEffect(() => { if (story) markViewed(); }, [story, markViewed]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (storyIdx < current.stories.length - 1) {
        setStoryIdx((i) => i + 1);
      } else if (userIdx < stories.length - 1) {
        setUserIdx((i) => i + 1);
        setStoryIdx(0);
      } else {
        onClose();
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [storyIdx, userIdx, current, stories.length, onClose]);

  if (!story) return null;

  const goPrev = () => {
    if (storyIdx > 0) setStoryIdx((i) => i - 1);
    else if (userIdx > 0) { setUserIdx((i) => i - 1); setStoryIdx(stories[userIdx - 1].stories.length - 1); }
  };

  const goNext = () => {
    if (storyIdx < current.stories.length - 1) setStoryIdx((i) => i + 1);
    else if (userIdx < stories.length - 1) { setUserIdx((i) => i + 1); setStoryIdx(0); }
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black" onClick={onClose}>
      <div className="relative h-full w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="absolute left-0 right-0 top-0 z-20 flex gap-1 p-3">
          {current.stories.map((_, i) => (
            <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
              <div
                className={`h-full bg-white transition-all ${i === storyIdx ? 'animate-progress' : i < storyIdx ? 'w-full' : 'w-0'}`}
              />
            </div>
          ))}
        </div>

        <div className="absolute left-0 right-0 top-0 z-10 h-32 bg-gradient-to-b from-black/60 to-transparent" />

        <div className="absolute left-4 top-8 z-20 flex items-center gap-3">
          <Avatar
            src={current.user.avatarUrl ? `${UPLOADS_URL}${current.user.avatarUrl}` : undefined}
            alt={current.user.username}
            size="sm"
            fallback={current.user.username[0]?.toUpperCase()}
          />
          <span className="text-base font-bold text-white drop-shadow-lg">{current.user.username}</span>
        </div>

        <img
          src={`${UPLOADS_URL}${story.imageUrl}`}
          alt="story"
          className="h-full w-full aspect-[9/16] object-cover"
        />

        <div className="absolute inset-y-0 left-0 z-10 w-1/3" onClick={goPrev} />
        <div className="absolute inset-y-0 right-0 z-10 w-1/3" onClick={goNext} />

        <button onClick={onClose} className="absolute right-4 top-8 z-20 text-3xl text-white drop-shadow-lg">✕</button>
      </div>
    </div>
  );
}
