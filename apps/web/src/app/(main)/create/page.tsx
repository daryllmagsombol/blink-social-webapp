'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function CreatePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('Only image files allowed');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      const { url } = await api.upload<{ url: string }>('/upload', formData);

      await api.post('/posts', { imageUrl: url, caption: caption || undefined });
      router.push('/feed');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl py-8 px-4">
      <h1 className="mb-6 text-xl font-bold">Create Post</h1>

      {error && (
        <div className="mb-4 rounded bg-danger/10 p-3 text-sm text-danger">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {preview ? (
          <div className="relative">
            <img src={preview} alt="preview" className="max-h-96 w-full rounded object-contain bg-bg-secondary" />
            <button
              type="button"
              onClick={() => { setFile(null); setPreview(null); }}
              className="absolute top-2 right-2 rounded-full bg-bg/80 px-2 py-1 text-sm"
            >
              ✕
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-border p-12 text-text-secondary hover:border-primary"
          >
            <p className="text-lg mb-2">📷</p>
            <p className="text-sm">Click to upload photo</p>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <textarea
          placeholder="Write a caption..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={2200}
          rows={3}
          className="w-full resize-none rounded border border-border bg-bg-secondary px-3 py-2 text-sm outline-none focus:border-text-secondary"
        />

        <button
          type="submit"
          disabled={loading || !file}
          className="w-full rounded bg-primary py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
        >
          {loading ? 'Posting...' : 'Share'}
        </button>
      </form>
    </div>
  );
}
