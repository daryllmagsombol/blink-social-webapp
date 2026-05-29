'use client';

import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'info';

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

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2 md:bottom-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => removeToast(t.id)}
          className={`cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-lg backdrop-blur-sm ${
            t.type === 'success'
              ? 'bg-green-600'
              : t.type === 'error'
                ? 'bg-danger'
                : 'bg-text-secondary'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
