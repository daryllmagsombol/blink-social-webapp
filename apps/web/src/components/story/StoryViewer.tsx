'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

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
      <div className="relative max-h-[90vh] max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <div className="absolute top-0 left-0 right-0 z-10 p-2 flex gap-1">
          {current.stories.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden">
              <div
                className={`h-full bg-white transition-all ${i === storyIdx ? 'animate-progress' : i < storyIdx ? 'w-full' : 'w-0'}`}
              />
            </div>
          ))}
        </div>

        <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-white/20" />
          <span className="text-white text-sm font-semibold">{current.user.username}</span>
        </div>

        <img
          src={`http://localhost:4000${story.imageUrl}`}
          alt="story"
          className="h-full w-full object-contain rounded"
        />

        <div className="absolute inset-y-0 left-0 w-1/3 z-10" onClick={goPrev} />
        <div className="absolute inset-y-0 right-0 w-1/3 z-10" onClick={goNext} />

        <button onClick={onClose} className="absolute top-3 right-3 z-10 text-white text-2xl">✕</button>
      </div>
    </div>
  );
}
