'use client';

import { useState, useRef } from 'react';
import { api, UPLOADS_URL } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';

interface StoryCreatorProps {
  onClose: () => void;
  onCreated: () => void;
}

export function StoryCreator({ onClose, onCreated }: StoryCreatorProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handlePublish = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { url } = await api.upload<{ url: string }>('/upload', formData);
      await api.post('/stories', { imageUrl: url });
      toast('Story published!', 'success');
      onCreated();
    } catch {
      toast('Failed to publish story', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setFile(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-xl bg-bg p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-center text-lg font-bold text-brand">Add to Story</h2>

        {!preview ? (
          <div
            onClick={() => fileRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-bg-secondary p-12 transition-colors hover:border-primary"
          >
            <svg className="mb-3 h-10 w-10 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            <p className="text-sm font-medium text-text-secondary">Tap to select a photo</p>
          </div>
        ) : (
          <div className="relative">
            <img
              src={preview}
              alt="preview"
              className="max-h-80 w-full rounded-lg object-contain bg-bg-secondary"
            />
            <button
              onClick={handleRemove}
              className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white transition-colors hover:bg-black/70"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="mt-4 flex gap-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handlePublish}
            disabled={!file || uploading}
            loading={uploading}
            className="flex-1"
          >
            Publish
          </Button>
        </div>
      </div>
    </div>
  );
}
