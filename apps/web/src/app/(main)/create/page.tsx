'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { toast } from '@/components/ui/Toast';

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
      toast('Post created!', 'success');
      router.push('/feed');
    } catch (err: any) {
      setError(err.message);
      toast('Failed to create post', 'error');
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
            <Button
              type="button"
              onClick={() => { setFile(null); setPreview(null); }}
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2"
            >
              ✕
            </Button>
          </div>
        ) : (
          <div
            onClick={() => fileRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-border p-12 text-text-secondary hover:border-primary transition-colors"
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

        <Textarea
          placeholder="Write a caption..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={2200}
          rows={3}
        />

        <Button
          type="submit"
          disabled={loading || !file}
          loading={loading}
          className="w-full"
          size="lg"
        >
          {loading ? 'Posting...' : 'Share'}
        </Button>
      </form>
    </div>
  );
}
