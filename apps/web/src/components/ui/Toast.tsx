'use client';

import { create } from 'zustand';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'brand';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, type = 'info') => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function toast(message: string, type?: ToastType) {
  useToastStore.getState().addToast(message, type);
}

const typeStyles: Record<ToastType, string> = {
  success: 'bg-success',
  error: 'bg-danger',
  info: 'bg-text-secondary',
  brand: 'bg-brand',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-28 left-1/2 z-[60] flex -translate-x-1/2 flex-col gap-2 md:bottom-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          onClick={() => removeToast(t.id)}
          className={cn(
            'cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-lg backdrop-blur-sm animate-slide-in-bottom',
            typeStyles[t.type],
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
